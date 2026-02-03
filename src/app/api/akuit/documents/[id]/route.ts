import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    const document = await db.acquittalDocument.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!existsSync(document.filePath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
    }

    const fileBuffer = await readFile(document.filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.fileType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${document.fileName}"`
      }
    })
  } catch (error) {
    console.error('Error serving document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
