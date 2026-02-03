'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FileText,
  ArrowLeft,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Calendar,
  DollarSign,
  ShieldCheck,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DocumentViewer } from '@/components/ui/document-viewer'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Issue {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  recommendation: string
  confidence: number
}

interface Report {
  id: string
  name: string
  date: string
  status: string
  issues: Issue[]
  totalAmount?: number
  confidence: number
  documentUrl?: string
  summary?: string
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/akuit/reports/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setReport(data.report)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load report data',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    if (!report) return

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Akuit Compliance Report', 14, 22)

    doc.setFontSize(11)
    doc.text(`Report ID: ${report.id}`, 14, 30)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36)

    doc.setFontSize(16)
    doc.text(report.name, 14, 50)

    const issueData = report.issues.map(issue => [
      issue.type.toUpperCase(),
      issue.title,
      issue.confidence + '%',
      issue.recommendation
    ])

    autoTable(doc, {
      startY: 55,
      head: [['Type', 'Issue', 'Confidence', 'Recommendation']],
      body: issueData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    })

    doc.save(`akuit-report-${report.id}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading comprehensive analysis...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          The requested report could not be found. It may have been deleted or the link is invalid.
        </p>
        <Button onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="font-bold text-lg hidden md:block">{report.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {report.status}
            </Badge>
            <Button size="sm" onClick={exportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

        {/* Left: Document Viewer (The "Report") */}
        <section className="flex-1 overflow-hidden p-4 bg-muted/10 relative">
          <div className="h-full rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
            <DocumentViewer
              imageUrl={report.documentUrl || ''}
              title={report.name}
              issues={report.issues.map(issue => ({
                id: issue.id,
                type: issue.type,
                title: issue.title,
                description: issue.description,
                recommendation: issue.recommendation,
                confidence: issue.confidence,
                x: 0,
                y: 0,
                width: 100,
                height: 100
              }))}
            />
          </div>
        </section>

        {/* Right: Analysis Results Sidebar */}
        <aside className="w-full lg:w-[400px] border-l border-border bg-card flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-bold mb-1">Analysis Summary</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Processed on {new Date(report.date).toLocaleString()}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/20 border-border/50">
                <CardContent className="p-4 pt-4">
                  <div className="text-2xl font-bold">{(report.confidence * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                  <Progress value={report.confidence * 100} className="h-1 mt-2" />
                </CardContent>
              </Card>
              <Card className="bg-muted/20 border-border/50">
                <CardContent className="p-4 pt-4">
                  <div className="text-2xl font-bold flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    {report.totalAmount?.toLocaleString() || '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Amount</div>
                </CardContent>
              </Card>
            </div>

            {/* Findings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Compliance Findings</h3>
                <Badge variant="outline" className="text-[10px]">{report.issues.length} Issues</Badge>
              </div>

              {report.issues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">No compliance issues detected.</p>
                </div>
              ) : (
                report.issues.map((issue, idx) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={`border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-default ${
                      issue.type === 'critical' ? 'border-l-destructive' :
                      issue.type === 'warning' ? 'border-l-warning' :
                      'border-l-info'
                    }`}>
                      <CardHeader className="p-4 pb-0">
                        <div className="flex items-center gap-2">
                          {issue.type === 'critical' ? <XCircle className="h-4 w-4 text-destructive" /> :
                           issue.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning" /> :
                           <Info className="h-4 w-4 text-info" />}
                          <CardTitle className="text-sm">{issue.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {issue.description}
                        </p>
                        <div className="p-3 bg-muted/40 rounded-lg text-xs border border-border/50">
                          <div className="font-semibold mb-1 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-primary" />
                            Recommendation:
                          </div>
                          {issue.recommendation}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Organization Info */}
            {report.summary && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Context</h3>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm">
                  {report.summary}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border bg-muted/10">
            <Button variant="outline" className="w-full" onClick={() => window.open(report.documentUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Source Document
            </Button>
          </div>
        </aside>
      </main>
    </div>
  )
}
