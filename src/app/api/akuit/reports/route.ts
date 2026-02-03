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
