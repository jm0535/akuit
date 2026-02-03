import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// 'use server'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'akuit')

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Convert file to base64
function fileToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

// Analyze a single document using VLM
async function analyzeDocument(imageBase64: string, fileName: string) {
  try {
    const zai = await ZAI.create()
    
    const analysisPrompt = `Analyze this financial document (receipt, invoice, or acquittal document). Extract and provide the following information in JSON format:

{
  "documentType": "receipt|invoice|other",
  "vendor": "vendor/company name",
  "date": "date of transaction (YYYY-MM-DD)",
  "amount": "total amount as a number",
  "items": [
    {
      "description": "item description",
      "quantity": "quantity",
      "price": "unit price"
    }
  ],
  "tax": "tax amount",
  "total": "total including tax",
  "paymentMethod": "cash|card|check|transfer|other",
  "notes": "any additional notes or observations",
  "quality": "quality of the document (clear|partial|poor)",
  "confidence": "overall confidence score (0-1)"
}

Focus on accuracy for amounts, dates, and vendor information. If any field is not present, use null.`

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: analysisPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Try to parse JSON from the response
    let extractedData
    try {
      // Find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        extractedData = { rawResponse: content }
      }
    } catch (e) {
      extractedData = { rawResponse: content }
    }

    return {
      success: true,
      extractedData,
      rawResponse: content
    }
  } catch (error) {
    console.error('Document analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }
  }
}

// Detect issues and generate recommendations using LLM
async function detectIssuesAndRecommendations(extractedData: any, fileName: string) {
  try {
    const zai = await ZAI.create()
    
    const prompt = `You are an expert financial compliance auditor reviewing acquittal documents. Review the following extracted data from a document and identify any issues, compliance problems, or areas for improvement.

Document: ${fileName}
Extracted Data:
${JSON.stringify(extractedData, null, 2)}

Analyze the document for:
1. Missing or incomplete information (dates, amounts, vendor details)
2. Unusual amounts or patterns
3. Missing tax information
4. Poor documentation quality
5. Payment method irregularities
6. Any compliance or audit concerns

Provide a JSON response with this exact structure:
{
  "issues": [
    {
      "type": "critical|warning|info",
      "title": "brief title of the issue",
      "description": "detailed explanation of the issue",
      "recommendation": "specific actionable recommendation to fix the issue",
      "confidence": 0.95
    }
  ],
  "totalAmount": <total amount from document or null>,
  "overallConfidence": <overall confidence in analysis 0-1>
}

Only include issues that are genuinely problematic. Be specific and actionable in recommendations.`

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an expert financial compliance auditor with years of experience in audit and compliance. You are thorough, professional, and precise.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', content)
    }

    // Fallback if parsing fails
    return {
      issues: [],
      totalAmount: extractedData?.total || extractedData?.amount || null,
      overallConfidence: 0.7
    }
  } catch (error) {
    console.error('Issue detection error:', error)
    return {
      issues: [],
      totalAmount: null,
      overallConfidence: 0.5
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()
    
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Create report in database
    const report = await db.acquittalReport.create({
      data: {
        name: `Acquittal Report ${new Date().toLocaleDateString()}`,
        status: 'PENDING',
        confidence: 0.0
      }
    })

    let allIssues: any[] = []
    let totalAmountSum = 0
    let confidenceSum = 0

    // Process each file
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Save file to disk
      const fileName = `${Date.now()}-${file.name}`
      const filePath = join(UPLOAD_DIR, fileName)
      await writeFile(filePath, buffer)
      
      const mimeType = file.type || 'image/jpeg'
      const imageBase64 = fileToBase64(buffer, mimeType)
      
      // Analyze document using VLM
      const analysisResult = await analyzeDocument(imageBase64, file.name)
      
      if (analysisResult.success) {
        // Save document to database
        await db.acquittalDocument.create({
          data: {
            reportId: report.id,
            fileName: file.name,
            fileType: mimeType,
            fileSize: file.size,
            filePath: filePath,
            extractedData: JSON.stringify(analysisResult.extractedData)
          }
        })
        
        // Detect issues using LLM
        const issuesResult = await detectIssuesAndRecommendations(
          analysisResult.extractedData,
          file.name
        )
        
        // Add issues to database
        for (const issue of issuesResult.issues) {
          const dbIssue = await db.issue.create({
            data: {
              reportId: report.id,
              type: issue.type.toUpperCase() as 'CRITICAL' | 'WARNING' | 'INFO',
              title: issue.title,
              description: issue.description,
              recommendation: issue.recommendation,
              confidence: issue.confidence || 0.8,
              severity: issue.type === 'critical' ? 0.9 : issue.type === 'warning' ? 0.6 : 0.3,
              resolved: false
            }
          })
          
          allIssues.push({
            id: dbIssue.id,
            type: issue.type,
            title: issue.title,
            description: issue.description,
            recommendation: issue.recommendation,
            confidence: issue.confidence || 0.8
          })
        }
        
        if (issuesResult.totalAmount) {
          totalAmountSum += parseFloat(String(issuesResult.totalAmount))
        }
        confidenceSum += issuesResult.overallConfidence || 0.8
      }
    }

    // Update report with summary
    const avgConfidence = files.length > 0 ? confidenceSum / files.length : 0.0
    
    await db.acquittalReport.update({
      where: { id: report.id },
      data: {
        totalAmount: totalAmountSum > 0 ? totalAmountSum : null,
        confidence: avgConfidence,
        summary: `Analyzed ${files.length} document(s) with ${allIssues.length} issue(s) found.`
      }
    })

    return NextResponse.json({
      success: true,
      reportId: report.id,
      issues: allIssues,
      totalAmount: totalAmountSum > 0 ? totalAmountSum : undefined,
      confidence: avgConfidence
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
