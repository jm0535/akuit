import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'akuit')

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

async function geminiFetch(apiKey: string, model: string, messages: any[], isVision: boolean, retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const contents = messages.map(msg => {
    if (typeof msg.content === 'string') {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }
    }
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      })

      if (!response.ok) {
        if (response.status === 429 && attempt < retries) {
          // Exponential backoff: 2s, 4s, 8s...
          const waitTime = Math.pow(2, attempt + 1) * 1000
          console.warn(`Gemini API rate limited. Retrying in ${waitTime}ms... (Attempt ${attempt + 1}/${retries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        const error = await response.json()
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (attempt === retries) throw error
    }
  }
}

function getApiKey(headerKey?: string | null): string {
  const key = headerKey || process.env.AI_API_KEY || process.env.GOOGLE_API_KEY
  if (!key) {
    throw new Error('No API key configured. Set GOOGLE_API_KEY in your environment or add one in Settings.')
  }
  return key
}

function getModelFromKey(): string {
  return 'gemini-2.0-flash'
}

function severityScore(type: string): number {
  switch (type?.toLowerCase()) {
    case 'critical': return 0.9
    case 'warning': return 0.6
    case 'info': return 0.3
    default: return 0.3
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()
    const headerKey = request.headers.get('x-api-key')
    const apiKey = getApiKey(headerKey)
    const model = getModelFromKey()

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Create report first
    const report = await db.acquittalReport.create({
      data: {
        name: `Acquittal Report - ${new Date().toLocaleDateString()}`,
        status: 'PENDING',
        confidence: 0.0,
      }
    })

    let allIssues: any[] = []
    let totalAmountSum = 0
    let confidenceSum = 0
    let reportName = ''

    // Process ALL uploaded files
    for (const file of files) {
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
        const extractionResult = await geminiFetch(apiKey, model, [
          {
            role: 'user',
            content: [
              { type: 'text', text: extractionPrompt },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ], true)

        const content = extractionResult.candidates?.[0]?.content?.parts?.[0]?.text || ''

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            extractedData = JSON.parse(jsonMatch[0])
            extractedText = extractedData.extractedText || content
          } catch {
            extractedData = { documentType: 'Document', extractedText: content }
            extractedText = content
          }
        } else {
          extractedData = { documentType: 'Document', extractedText: content }
          extractedText = content
        }
      } catch (error) {
        console.error('Gemini extraction failed:', error)
        extractedData = { documentType: 'unknown', extractedText: '' }
      }

      if (!reportName && extractedData.documentType && extractedData.documentType !== 'unknown') {
        reportName = `${extractedData.documentType} Report - ${new Date().toLocaleDateString()}`
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
    "type": "CRITICAL" | "WARNING" | "INFO",
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
        const analysisResult = await geminiFetch(apiKey, model, [
          { role: 'user', content: compliancePrompt + "\n\nDocument Content:\n" + extractedText }
        ], false)

        const analysisContent = analysisResult.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const issueJsonMatch = analysisContent.match(/\[[\s\S]*\]/)
        if (issueJsonMatch) {
          try {
            issues = JSON.parse(issueJsonMatch[0])
          } catch {
            console.error('Issues JSON parse error')
          }
        }
      } catch (error) {
        console.error('Gemini compliance analysis failed:', error)
      }

      // Save document record
      await db.acquittalDocument.create({
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

      // Create issue records with proper type normalization
      for (const issue of issues) {
        const rawType = (issue.type || 'INFO').toUpperCase()
        const validTypes = ['CRITICAL', 'WARNING', 'INFO']
        const normalizedType = validTypes.includes(rawType) ? rawType : 'INFO'

        const dbIssue = await db.issue.create({
          data: {
            reportId: report.id,
            type: normalizedType as 'CRITICAL' | 'WARNING' | 'INFO',
            title: issue.title || 'Untitled Issue',
            description: issue.description || 'No description provided',
            recommendation: issue.recommendation || 'Review this item',
            confidence: issue.confidence > 1 ? issue.confidence / 100 : issue.confidence || 0.75,
            severity: severityScore(issue.type),
            resolved: false
          }
        })

        allIssues.push({
          id: dbIssue.id,
          type: normalizedType,
          title: issue.title || 'Untitled Issue',
          description: issue.description || 'No description provided',
          recommendation: issue.recommendation || 'Review this item',
          confidence: issue.confidence > 1 ? issue.confidence / 100 : issue.confidence || 0.75,
        })
      }

      const docAmount = extractedData.totalAmount || 0
      totalAmountSum += typeof docAmount === 'number' ? docAmount : parseFloat(String(docAmount)) || 0
      confidenceSum += calculateDocConfidence(issues, extractedText)
    }

    // Update report with final data
    const overallConfidence = files.length > 0 ? Number((confidenceSum / files.length).toFixed(2)) : 0
    const finalName = reportName || `Acquittal Report - ${new Date().toLocaleDateString()}`

    await db.acquittalReport.update({
      where: { id: report.id },
      data: {
        name: finalName,
        status: 'REVIEWED',
        totalAmount: totalAmountSum > 0 ? totalAmountSum : null,
        confidence: overallConfidence,
        summary: `Analyzed ${files.length} document(s). Found ${allIssues.length} compliance issue(s).`,
      }
    })

    return NextResponse.json({
      success: true,
      reportId: report.id,
      totalAmount: totalAmountSum > 0 ? totalAmountSum : undefined,
      confidence: overallConfidence,
      issues: allIssues,
      summary: {
        totalIssues: allIssues.length,
        criticalIssues: allIssues.filter((i: any) => i.type === 'CRITICAL').length,
        warningIssues: allIssues.filter((i: any) => i.type === 'WARNING').length,
        infoIssues: allIssues.filter((i: any) => i.type === 'INFO').length,
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

function calculateDocConfidence(issues: any[], extractedText: string): number {
  const textConfidence = extractedText.length > 50 ? 0.9 : 0.6
  const issueConfidence = issues.length > 0
    ? issues.reduce((sum: number, i: any) => sum + (i.confidence > 1 ? i.confidence / 100 : i.confidence || 0.75), 0) / issues.length
    : 0.85

  return Number((textConfidence * 0.6 + issueConfidence * 0.4).toFixed(2))
}
