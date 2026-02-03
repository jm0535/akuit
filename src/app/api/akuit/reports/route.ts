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
        ...report,
        date: report.createdAt,
        documentUrl: report.documents[0] ? `/api/akuit/documents/${report.documents[0].id}` : undefined,
        issues: report.issues.map(issue => ({
          id: issue.id,
          type: issue.type.toLowerCase() as 'critical' | 'warning' | 'info',
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
    // 1. Get all documents to delete files
    const documents = await db.acquittalDocument.findMany()

    // 2. Delete physical files
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

    // 3. Clear database (Triggers cascade on Issues and Documents)
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

