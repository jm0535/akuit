import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all reports
export async function GET() {
  try {
    const reports = await db.acquittalReport.findMany({
      include: {
        documents: true,
        issues: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        id: report.id,
        name: report.name,
        status: report.status,
        totalAmount: report.totalAmount,
        confidence: report.confidence,
        summary: report.summary,
        date: report.createdAt.toISOString(),
        documentUrl: report.documents[0] ? `/api/akuit/documents/${report.documents[0].id}` : undefined,
        documentType: report.documents[0]?.fileType || undefined,
        issues: report.issues.map(issue => ({
          id: issue.id,
          type: issue.type,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
          confidence: issue.confidence
        }))
      }))
    })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reports'
      },
      { status: 500 }
    )
  }
}

// DELETE all reports
export async function DELETE() {
  try {
    const documents = await db.acquittalDocument.findMany()

    const { unlink } = await import('fs/promises')
    const { existsSync } = await import('fs')

    for (const doc of documents) {
      if (existsSync(doc.filePath)) {
        try {
          await unlink(doc.filePath)
        } catch (e) {
          console.error(`Failed to delete file: ${doc.filePath}`, e)
        }
      }
    }

    await db.acquittalReport.deleteMany()

    return NextResponse.json({
      success: true,
      message: 'All reports and files cleared successfully'
    })
  } catch (error) {
    console.error('Failed to clear reports:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear reports'
      },
      { status: 500 }
    )
  }
}
