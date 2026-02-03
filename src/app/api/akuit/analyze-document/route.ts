import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'akuit')

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Advanced Document Analysis API
 * Handles scanned documents, OCR extraction, and compliance checking
 */

async function geminiFetch(apiKey: string, model: string, messages: any[], isVision: boolean) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`

  const contents = messages.map(msg => {
    if (typeof msg.content === 'string') {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }
    }
    // Handle vision content
    const parts = msg.content.map((c: any) => {
      if (c.type === 'text') return { text: c.text }
      if (c.type === 'image_url') {
        const [mime, data] = c.image_url.url.split(';base64,')
        return {
          inline_data: {
            mime_type: mime.replace('data:', ''),
            data: data
          }
        }
      }
      return null
    }).filter(Boolean)

    return { role: msg.role === 'user' ? 'user' : 'model', parts }
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return {
    choices: [{ message: { content } }]
  }
}

function getApiKey(headerKey?: string | null): string {
  const key = headerKey || process.env.AI_API_KEY || process.env.GOOGLE_API_KEY
  if (!key) {
    throw new Error('Server configuration error: AI_API_KEY or GOOGLE_API_KEY is missing')
  }
  return key
}

function getModelFromKey(apiKey: string): string {
  return apiKey.startsWith('AIza') ? 'gemini-1.5-flash' : 'gemini-1.5-flash' // Standardize on Flash for now
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()
    const headerKey = request.headers.get('x-api-key')
    const apiKey = getApiKey(headerKey)
    const model = getModelFromKey(apiKey)

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Process first file
    const file = files[0]
    const fileData = await file.arrayBuffer()
    const buffer = Buffer.from(fileData)

    // Save file to disk
    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(UPLOAD_DIR, fileName)
    await writeFile(filePath, buffer)

    const base64Data = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Data}`

    // Step 1: Extract text using VLM
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
      console.log('Starting Gemini document extraction...')

      const extractionResult = await geminiFetch(apiKey, model, [
        {
          role: 'user',
          content: [
            { type: 'text', text: extractionPrompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ], true)

      const content = extractionResult.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
        extractedText = extractedData.extractedText || content
      } else {
        extractedData = { documentType: 'unknown', extractedText: content }
        extractedText = content
      }
      console.log('Gemini extraction successful')
    } catch (error) {
      console.error('Gemini extraction failed:', error)
      extractedData = { documentType: 'unknown', extractedText: '' }
    }

    // Step 2: Compliance Analysis
    const compliancePrompt = `You are a compliance expert specializing in financial acquittal reports and government funding.

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
    "confidence": 0-1,
    "location": {
      "page": 1,
      "section": "description of where issue is found"
    }
  }
]

Only return valid JSON array, no other text.`
    let issues: any[] = []

    try {
      console.log('Starting Gemini compliance analysis...')
      const analysisResult = await geminiFetch(apiKey, model, [
        { role: 'user', content: compliancePrompt + "\n\nDocument Content:\n" + extractedText }
      ], false)

      const analysisContent = analysisResult.choices[0]?.message?.content || ''
      const jsonMatch = analysisContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        issues = JSON.parse(jsonMatch[0])
      }
      console.log(`Found ${issues.length} compliance issues`)
    } catch (error) {
      console.error('Gemini compliance analysis failed:', error)
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
        filePath: filePath,
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
          confidence: issue.confidence > 1 ? issue.confidence / 100 : issue.confidence || 0.75,
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
  const textConfidence = extractedText.length > 50 ? 0.9 : 0.6
  const issueConfidence = issues.length > 0
    ? issues.reduce((sum: number, i: any) => sum + (i.confidence > 1 ? i.confidence / 100 : i.confidence || 0.75), 0) / issues.length
    : 0.85

  return Number((textConfidence * 0.6 + issueConfidence * 0.4).toFixed(2))
}
