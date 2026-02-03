import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params

    const report = await db.acquittalReport.findUnique({
      where: { id: reportId },
      include: {
        documents: true,
        issues: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        name: report.name,
        status: report.status,
        totalAmount: report.totalAmount,
        confidence: report.confidence,
        summary: report.summary,
        date: report.createdAt.toISOString(),
        documentUrl: report.documents[0] ? `/api/akuit/documents/${report.documents[0].id}` : undefined,
        documentType: report.documents[0]?.fileType || undefined,
        documents: report.documents.map(doc => ({
          id: doc.id,
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          url: `/api/akuit/documents/${doc.id}`,
        })),
        issues: report.issues.map(issue => ({
          id: issue.id,
          type: issue.type,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
          confidence: issue.confidence
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params

    const report = await db.acquittalReport.findUnique({
      where: { id: reportId },
      include: { documents: true }
    })

    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    for (const doc of report.documents) {
      if (existsSync(doc.filePath)) {
        try {
          await unlink(doc.filePath)
        } catch (fileError) {
          console.error(`Failed to delete file: ${doc.filePath}`, fileError)
        }
      }
    }

    await db.acquittalReport.delete({
      where: { id: reportId }
    })

    return NextResponse.json({
      success: true,
      message: 'Report and associated files deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
