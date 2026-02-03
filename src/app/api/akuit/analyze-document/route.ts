import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

/**
 * Advanced Document Analysis API
 * Handles scanned documents, OCR extraction, and compliance checking
 */

let zaiInstance: any = null

async function getZAI(apiKey?: string) {
  if (apiKey) {
    return await ZAI.create(apiKey)
  }

  // Fallback to env vars (ZAI or GOOGLE)
  if (!zaiInstance) {
    const envKey = process.env.ZAI_API_KEY || process.env.GOOGLE_API_KEY
    if (!envKey) {
      throw new Error('Server configuration error: ZAI_API_KEY or GOOGLE_API_KEY is missing')
    }
    zaiInstance = await ZAI.create(envKey)
  }
  return zaiInstance
}

function getModelFromKey(apiKey?: string): string {
  if (!apiKey) {
    const envKey = process.env.ZAI_API_KEY || process.env.GOOGLE_API_KEY
    return (envKey && envKey.startsWith('AIza')) ? 'gemini-1.5-pro' : 'glm-4.6v'
  }
  return apiKey.startsWith('AIza') ? 'gemini-1.5-pro' : 'glm-4.6v'
}

export async function POST(request: NextRequest) {
  try {
    // Try to get key from header first, then env
    const headerKey = request.headers.get('x-api-key')
    const zai = await getZAI(headerKey || undefined)
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Process first file (can extend for multiple)
    const file = files[0]
    const fileData = await file.arrayBuffer()
    const base64Data = Buffer.from(fileData).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Data}`

    const model = getModelFromKey(headerKey)

    // Step 1: Extract text using VLM (Vision Language Model)
    const extractionPrompt = `You are an expert document analyzer for financial acquittal reports.

Please analyze this document and extract:
1. Document type (invoice, receipt, report, etc.)
2. Date of document
3. Total amount or value
4. Any reference numbers, IDs, or invoice numbers
5. Organization or company name
6. List of items, services, or charges with amounts
7. Payment method or payment information
8. Authorization or approval information
9. Any signatures or stamps visible

Format as structured JSON:
{
  "documentType": "string",
  "date": "YYYY-MM-DD",
  "totalAmount": number,
  "referenceNumber": "string",
  "organization": "string",
  "items": [{"description": "string", "amount": number}],
  "paymentMethod": "string",
  "authorization": "string",
  "signatures": boolean,
  "extractedText": "full text content"
}

Only return valid JSON, no other text.`

    let extractedData: any = {}
    let extractedText = ''

    try {
      console.log('Starting VLM document extraction...')

      const extractionResult = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractionPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        model: model
      })

      const content = extractionResult.choices[0]?.message?.content || ''

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
        extractedText = extractedData.extractedText || content
      } else {
        // Fallback: extract text without JSON parsing
        extractedData = {
          documentType: 'unknown',
          extractedText: content
        }
        extractedText = content
      }

      console.log('VLM extraction successful')
    } catch (error) {
      console.error('VLM extraction failed:', error)
      extractedData = {
        documentType: 'unknown',
        extractedText: ''
      }
    }

    // Step 2: Compliance Analysis using LLM
    const compliancePrompt = `You are a compliance expert specializing in financial acquittal reports and government funding.

Analyze this document content for compliance issues:
${extractedText || '(Document content will be here)'}

Context: This is a BSCF (Blue Shield of California Foundation) project funds acquittal report requiring strict adherence to funding guidelines.

Check for:
1. CRITICAL ISSUES (missing information, incomplete documentation, unauthorized expenses, missing signatures, expired dates)
2. WARNING ISSUES (incomplete descriptions, unclear charges, missing supporting details, formatting errors)
3. SUGGESTIONS (best practices, improvement opportunities, documentation tips)

Return as JSON array:
[
  {
    "id": "unique-id",
    "type": "critical" | "warning" | "info",
    "title": "short descriptive title",
    "description": "detailed explanation of the issue",
    "recommendation": "how to fix the issue",
    "confidence": 0-100,
    "location": {
      "page": 1,
      "section": "description of where issue is found"
    }
  }
]

Only return valid JSON array, no other text.`

    let issues: any[] = []

    try {
      console.log('Starting compliance analysis...')

      const analysisResult = await zai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: compliancePrompt
          }
        ],
        model: model
      })

      const analysisContent = analysisResult.choices[0]?.message?.content || ''

      // Extract JSON from response
      const jsonMatch = analysisContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        issues = JSON.parse(jsonMatch[0])
      }

      console.log(`Found ${issues.length} compliance issues`)
    } catch (error) {
      console.error('Compliance analysis failed:', error)
    }

    // Step 3: Save to database
    const totalAmount = extractedData.totalAmount || 0
    const overallConfidence = calculateOverallConfidence(issues, extractedText)

    // Create report
    const report = await db.acquittalReport.create({
      data: {
        name: `${extractedData.documentType || 'Document'} Report - ${new Date().toLocaleDateString()}`,
        status: 'PENDING',
        totalAmount,
        confidence: overallConfidence,
        summary: extractedData.organization || 'Unknown Organization',
      }
    })

    // Create document record
    const documentRecord = await db.acquittalDocument.create({
      data: {
        reportId: report.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: '',
        extractedData: JSON.stringify({
          ...extractedData,
          analysisTimestamp: new Date().toISOString()
        })
      }
    })

    // Create issues
    for (const issue of issues) {
      // Convert issue type to uppercase enum value
      const issueType = (issue.type?.toUpperCase() || 'INFO') as 'CRITICAL' | 'WARNING' | 'INFO'

      await db.issue.create({
        data: {
          reportId: report.id,
          type: issueType,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
          confidence: issue.confidence || 75,
          severity: issueType,
          resolved: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      documentId: documentRecord.id,
      extractedData: {
        ...extractedData,
        issues
      },
      totalAmount,
      confidence: overallConfidence,
      issues,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter((i: any) => i.type === 'critical').length,
        warningIssues: issues.filter((i: any) => i.type === 'warning').length,
        infoIssues: issues.filter((i: any) => i.type === 'info').length
      }
    })

  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      },
      { status: 500 }
    )
  }
}

function calculateOverallConfidence(issues: any[], extractedText: string): number {
  const textConfidence = extractedText.length > 50 ? 90 : 60
  const issueConfidence = issues.length > 0
    ? issues.reduce((sum: number, i: any) => sum + (i.confidence || 75), 0) / issues.length
    : 85

  return Math.round((textConfidence * 0.6 + issueConfidence * 0.4))
}
