'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Calendar, DollarSign, ShieldCheck, AlertCircle, AlertTriangle, CheckCircle, Info, FileText, ExternalLink, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DocumentViewer } from '@/components/ui/document-viewer'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type IssueType = 'CRITICAL' | 'WARNING' | 'INFO'

interface Issue {
  id: string
  type: IssueType
  title: string
  description: string
  recommendation: string
  confidence: number
}

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  url: string
}

interface Report {
  id: string
  name: string
  status: string
  totalAmount?: number
  confidence: number
  summary?: string
  date: string
  documentUrl?: string
  documentType?: string
  documents?: Document[]
  issues: Issue[]
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocIndex, setSelectedDocIndex] = useState(0)

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/akuit/reports/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Report not found')
          }
          throw new Error('Failed to load report')
        }
        const data = await response.json()
        if (data.success && data.report) {
          setReport(data.report)
        } else {
          throw new Error(data.error || 'Failed to load report')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchReport()
    }
  }, [params.id])

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getIssueIcon = (type: IssueType) => {
    switch (type) {
      case 'CRITICAL':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'INFO':
        return <Info className="h-5 w-5 text-info" />
    }
  }

  const getIssueBadgeVariant = (type: IssueType): 'destructive' | 'default' | 'secondary' => {
    switch (type) {
      case 'CRITICAL': return 'destructive'
      case 'WARNING': return 'default'
      case 'INFO': return 'secondary'
    }
  }

  const exportPDF = () => {
    if (!report) return

    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.text('Akuit Analysis Report', 14, 22)

    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(report.name, 14, 45)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Date: ${formatDate(report.date)}`, 14, 52)
    doc.text(`Status: ${report.status}`, 14, 58)
    doc.text(`Confidence: ${Math.round(report.confidence * 100)}%`, 14, 64)
    if (report.totalAmount) {
      doc.text(`Total Amount: $${report.totalAmount.toLocaleString()}`, 14, 70)
    }

    if (report.issues.length > 0) {
      const issueData = report.issues.map((issue, i) => [
        String(i + 1),
        issue.type,
        issue.title,
        issue.description.substring(0, 80) + (issue.description.length > 80 ? '...' : ''),
        issue.recommendation.substring(0, 80) + (issue.recommendation.length > 80 ? '...' : ''),
        `${Math.round(issue.confidence * 100)}%`
      ])

      autoTable(doc, {
        startY: report.totalAmount ? 78 : 72,
        head: [['#', 'Type', 'Issue', 'Description', 'Recommendation', 'Confidence']],
        body: issueData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 37, 36] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
        }
      })
    }

    doc.save(`akuit-report-${report.id}.pdf`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'The report you are looking for does not exist.'}
            </p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const criticalCount = report.issues.filter(i => i.type === 'CRITICAL').length
  const warningCount = report.issues.filter(i => i.type === 'WARNING').length
  const infoCount = report.issues.filter(i => i.type === 'INFO').length

  const currentDoc = report.documents?.[selectedDocIndex]
  const currentDocUrl = currentDoc?.url || report.documentUrl || ''
  const currentDocType = currentDoc?.fileType || report.documentType || ''

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold truncate max-w-[300px]">{report.name}</h1>
                <p className="text-xs text-muted-foreground">{formatDate(report.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs ${
                  report.status === 'APPROVED' ? 'bg-success/15 text-success border border-success/30' :
                  report.status === 'REVIEWED' ? 'bg-info/15 text-info border border-info/30' :
                  report.status === 'REJECTED' ? 'bg-destructive/15 text-destructive border border-destructive/30' :
                  'bg-warning/15 text-warning border border-warning/30'
                }`}
              >
                {report.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Document Viewer - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Document tabs if multiple documents */}
            {report.documents && report.documents.length > 1 && (
              <Card className="p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground mr-2">Documents:</span>
                  {report.documents.map((doc, i) => (
                    <Button
                      key={doc.id}
                      variant={i === selectedDocIndex ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDocIndex(i)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {doc.fileName}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            <DocumentViewer
              documentUrl={currentDocUrl}
              documentType={currentDocType}
              title={currentDoc?.fileName || report.name}
              issues={report.issues}
              onDownload={currentDocUrl ? () => window.open(currentDocUrl, '_blank') : undefined}
            />
          </div>

          {/* Analysis Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Analysis Summary
                </CardTitle>
                {report.summary && (
                  <CardDescription>{report.summary}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20 text-center">
                    <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                  <div className="p-3 bg-warning/5 rounded-lg border border-warning/20 text-center">
                    <div className="text-2xl font-bold text-warning">{warningCount}</div>
                    <div className="text-xs text-muted-foreground">Warnings</div>
                  </div>
                  <div className="p-3 bg-info/5 rounded-lg border border-info/20 text-center">
                    <div className="text-2xl font-bold text-info">{infoCount}</div>
                    <div className="text-xs text-muted-foreground">Suggestions</div>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(report.confidence * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>

                {report.totalAmount != null && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Total Amount
                    </span>
                    <span className="font-bold">${report.totalAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date
                  </span>
                  <span className="font-medium text-sm">{formatDate(report.date)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Issues Detail Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Issues ({report.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 text-success" />
                    <p className="font-medium">No issues found</p>
                    <p className="text-sm text-muted-foreground">
                      This document passed all compliance checks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                    {report.issues.map((issue, index) => (
                      <div
                        key={issue.id}
                        className="p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {getIssueIcon(issue.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-sm">{issue.title}</span>
                              <Badge variant={getIssueBadgeVariant(issue.type)} className="text-[10px]">
                                {issue.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {issue.description}
                            </p>
                            <div className="p-2 bg-background rounded border border-border text-xs">
                              <span className="font-medium text-primary">Fix: </span>
                              {issue.recommendation}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-muted-foreground">
                                Confidence: {Math.round(issue.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
