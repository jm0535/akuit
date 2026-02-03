import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params

    // 1. Find the report and its documents
    const report = await db.acquittalReport.findUnique({
      where: { id: reportId },
      include: { documents: true }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // 2. Delete physical files
    for (const doc of report.documents) {
      if (existsSync(doc.filePath)) {
        try {
          await unlink(doc.filePath)
        } catch (fileError) {
          console.error(`Failed to delete file: ${doc.filePath}`, fileError)
        }
      }
    }

    // 3. Delete from database (Issues and Documents will be deleted via Cascade)
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
