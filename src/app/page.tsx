'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Plus, Download, Trash2, Eye, Calendar, DollarSign, Moon, Sun, Settings, Sparkles, ShieldCheck, ArrowRight, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/lib/theme-provider'
import { useRouter } from 'next/navigation'
import { FileCard } from '@/components/ui/file-card'
import type { ProcessedImageResult, DocumentType } from '@/lib/document-processor'
import { preprocessImage, detectDocumentType } from '@/lib/document-processor'
import { getActiveApiKey } from '@/lib/api-keys'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type IssueType = 'CRITICAL' | 'WARNING' | 'INFO'
type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'

interface Issue {
  id: string
  type: IssueType
  title: string
  description: string
  recommendation: string
  confidence: number
}

interface Report {
  id: string
  name: string
  date: string
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED'
  issues: Issue[]
  totalAmount?: number
  confidence: number
  documentUrl?: string
  documentType?: string
  summary?: string
}

export default function AkuitDashboard() {
  const [files, setFiles] = useState<File[]>([])
  const [fileQualities, setFileQualities] = useState<Map<number, ProcessedImageResult>>(new Map())
  const [fileDocTypes, setFileDocTypes] = useState<Map<number, DocumentType>>(new Map())
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const { toast } = useToast()
  const { theme, setTheme, actualTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    fetchReports()
  }, [])

  const preprocessFile = async (index: number) => {
    const file = files[index]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        const quality = await preprocessImage(dataUrl)
        const docType = await detectDocumentType(file)

        setFileQualities(prev => new Map(prev.set(index, quality)))
        setFileDocTypes(prev => new Map(prev.set(index, docType)))

        toast({
          title: 'Document preprocessed',
          description: `Quality: ${quality.quality} (${quality.confidence}% confidence)`,
        })
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Preprocessing failed:', error)
      toast({
        title: 'Preprocessing failed',
        description: 'Could not preprocess the document',
        variant: 'destructive',
      })
    }
  }

  const analyzeDocuments = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one document to analyze',
        variant: 'destructive',
      })
      return
    }

    setAnalysisStatus('uploading')
    setUploadProgress(0)

    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(uploadInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    setTimeout(() => {
      clearInterval(uploadInterval)
      setUploadProgress(100)
      setAnalysisStatus('analyzing')
      processAnalysis()
    }, 2000)
  }

  const processAnalysis = async () => {
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const apiKey = await getActiveApiKey()

      const response = await fetch('/api/akuit/analyze-document', {
        method: 'POST',
        headers: {
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()

      if (result.success) {
        setFiles([])
        setFileQualities(new Map())
        setFileDocTypes(new Map())
        setAnalysisStatus('complete')
        setActiveTab('reports')

        await fetchReports()

        toast({
          title: 'Analysis complete',
          description: `Found ${result.summary?.totalIssues || 0} issues (${result.summary?.criticalIssues || 0} critical)`,
        })

        // Auto-reset status after a short delay
        setTimeout(() => setAnalysisStatus('idle'), 3000)
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      setAnalysisStatus('error')
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'There was an error analyzing your documents',
        variant: 'destructive',
      })
      setTimeout(() => setAnalysisStatus('idle'), 3000)
    }
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const fetchReports = async () => {
    setIsLoadingReports(true)
    try {
      const response = await fetch('/api/akuit/reports')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setReports(result.reports)
        }
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setIsLoadingReports(false)
    }
  }

  const generatePDF = (report?: Report) => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Akuit Report', 14, 22)

    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

    if (report) {
      doc.setFontSize(16)
      doc.text(report.name, 14, 45)

      const issueData = report.issues.map(issue => [
        issue.type,
        issue.title,
        Math.round(issue.confidence * 100) + '%',
        issue.recommendation
      ])

      autoTable(doc, {
        startY: 50,
        head: [['Type', 'Issue', 'Confidence', 'Recommendation']],
        body: issueData,
      })

      doc.save(`akuit-report-${report.id}.pdf`)
    } else {
      const tableData = reports.map(r => [
        r.name,
        formatDate(r.date),
        r.status,
        String(r.issues.length),
        r.totalAmount ? '$' + r.totalAmount.toLocaleString() : '-'
      ])

      autoTable(doc, {
        startY: 40,
        head: [['Name', 'Date', 'Status', 'Issues', 'Amount']],
        body: tableData,
      })

      doc.save('akuit-reports-summary.pdf')
    }

    toast({
      title: 'PDF exported',
      description: 'Your report has been downloaded.',
    })
  }

  const generateCSV = () => {
    if (reports.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Create some reports first before exporting.',
        variant: 'destructive',
      })
      return
    }

    const headers = ['Name', 'Date', 'Status', 'Issues', 'Critical', 'Warning', 'Info', 'Amount']
    const csvContent = [
      headers.join(','),
      ...reports.map(r => {
        return [
          `"${r.name}"`,
          formatDate(r.date),
          r.status,
          r.issues.length,
          r.issues.filter(i => i.type === 'CRITICAL').length,
          r.issues.filter(i => i.type === 'WARNING').length,
          r.issues.filter(i => i.type === 'INFO').length,
          r.totalAmount || 0
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'akuit_reports_export.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'CSV exported',
      description: 'Your data has been downloaded.',
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter(
      file => file.type.startsWith('image/') || file.type === 'application/pdf'
    )

    if (validFiles.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload images or PDF files only',
        variant: 'destructive',
      })
      return
    }

    setFiles(prev => [...prev, ...validFiles])
  }, [toast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }, [])

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFileQualities(prev => {
      const next = new Map(prev)
      next.delete(index)
      return next
    })
    setFileDocTypes(prev => {
      const next = new Map(prev)
      next.delete(index)
      return next
    })
  }

  const getIssueIcon = (type: IssueType) => {
    switch (type) {
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'INFO':
        return <CheckCircle className="h-5 w-5 text-info" />
    }
  }

  const getIssueBadgeVariant = (type: IssueType): 'destructive' | 'default' | 'secondary' => {
    switch (type) {
      case 'CRITICAL':
        return 'destructive'
      case 'WARNING':
        return 'default'
      case 'INFO':
        return 'secondary'
    }
  }

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/akuit/reports/${reportId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast({
          title: 'Report deleted',
          description: 'The report and associated files have been removed.',
        })
        fetchReports()
        if (selectedReport?.id === reportId) {
          setSelectedReport(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete report:', error)
      toast({
        title: 'Delete failed',
        description: 'Could not delete the report at this time.',
        variant: 'destructive',
      })
    }
  }

  const clearAllReports = async () => {
    if (!confirm('This will PERMANENTLY delete ALL reports and files. Are you absolutely sure?')) return

    try {
      const response = await fetch('/api/akuit/reports', {
        method: 'DELETE'
      })
      if (response.ok) {
        toast({
          title: 'All reports cleared',
          description: 'Your reports tab is now empty.',
        })
        setReports([])
        setSelectedReport(null)
      }
    } catch (error) {
      console.error('Failed to clear reports:', error)
      toast({
        title: 'Reset failed',
        description: 'Could not clear reports at this time.',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadgeColor = (status: Report['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-warning/15 text-warning border border-warning/30'
      case 'REVIEWED':
        return 'bg-info/15 text-info border border-info/30'
      case 'APPROVED':
        return 'bg-success/15 text-success border border-success/30'
      case 'REJECTED':
        return 'bg-destructive/15 text-destructive border border-destructive/30'
    }
  }

  const totalCritical = reports.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'CRITICAL').length, 0)
  const totalWarnings = reports.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'WARNING').length, 0)
  const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Akuit</h1>
                <p className="text-xs text-muted-foreground">Acquittal Review & Reporting</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => {
                setTheme(actualTheme === 'dark' ? 'light' : 'dark')
              }} title="Toggle theme">
                {actualTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              {reports.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => generateCSV()}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generatePDF()}>
                      Export as PDF (Summary)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button size="sm" onClick={() => {
                setActiveTab('upload')
                setFiles([])
                setAnalysisStatus('idle')
              }}>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          if (value === 'reports') fetchReports()
        }} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload & Analyze
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
              {reports.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {reports.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Upload & Analyze Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Upload Section - spans 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Documents
                    </CardTitle>
                    <CardDescription>
                      Upload acquittal reports, receipts, and financial documents for AI-powered compliance analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        relative border-2 border-dashed rounded-xl p-12
                        transition-all duration-200 ease-out
                        ${isDragOver
                          ? 'border-primary bg-primary/5 scale-[1.01]'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }
                      `}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className={`
                          w-16 h-16 rounded-full flex items-center justify-center
                          transition-colors ${isDragOver ? 'bg-primary/10' : 'bg-muted'}
                        `}>
                          <Upload className={`h-8 w-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold">
                            {isDragOver ? 'Drop files here' : 'Drag & drop documents here'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse -- Supports images and PDFs
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* File List */}
                    <AnimatePresence>
                      {files.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{files.length} file(s) selected</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFiles([])
                                setFileQualities(new Map())
                                setFileDocTypes(new Map())
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              Clear all
                            </Button>
                          </div>
                          <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2">
                            {files.map((file, index) => (
                              <FileCard
                                key={`${file.name}-${index}`}
                                file={file}
                                index={index}
                                onRemove={removeFile}
                                onPreprocess={preprocessFile}
                                showQuality={true}
                                showPreprocess={true}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Progress Bar */}
                    {analysisStatus === 'uploading' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Uploading files...</span>
                          <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </motion.div>
                    )}

                    {analysisStatus === 'analyzing' && (
                      <Alert className="border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <AlertDescription className="font-medium">
                            Analyzing documents with AI... This may take a moment.
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}

                    {analysisStatus === 'complete' && (
                      <Alert className="border-success/20 bg-success/5">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <AlertDescription className="font-medium text-success">
                          Analysis complete! Check the Reports tab for results.
                        </AlertDescription>
                      </Alert>
                    )}

                    {analysisStatus === 'error' && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          Analysis failed. Please check your API key in Settings and try again.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={analyzeDocuments}
                      disabled={files.length === 0 || analysisStatus === 'uploading' || analysisStatus === 'analyzing'}
                      className="w-full"
                      size="lg"
                    >
                      {analysisStatus === 'analyzing' ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze {files.length > 0 ? `${files.length} Document${files.length > 1 ? 's' : ''}` : 'Documents'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Reports</span>
                      <span className="font-semibold">{reports.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pending Review</span>
                      <span className="font-semibold text-warning">
                        {reports.filter(r => r.status === 'PENDING').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Issues</span>
                      <span className="font-semibold">{totalIssues}</span>
                    </div>
                    {totalCritical > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Critical Issues</span>
                        <span className="font-semibold text-destructive">{totalCritical}</span>
                      </div>
                    )}
                    {reports.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setActiveTab('reports')}
                      >
                        View All Reports
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">How it works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">1</div>
                      <p>Upload receipts, invoices, or acquittal forms</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">2</div>
                      <p>AI extracts data and checks for compliance</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">3</div>
                      <p>Review findings and export detailed reports</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Selected Report Detail Panel */}
            <AnimatePresence>
              {selectedReport && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            {selectedReport.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(selectedReport.date)}
                            </span>
                            {selectedReport.totalAmount && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {selectedReport.totalAmount.toLocaleString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {Math.round(selectedReport.confidence * 100)}% Confidence
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => generatePDF(selectedReport)}>
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          <Button size="sm" onClick={() => router.push(`/reports/${selectedReport.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Full Analysis
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                          <div className="text-2xl font-bold text-destructive">
                            {selectedReport.issues.filter(i => i.type === 'CRITICAL').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Critical</div>
                        </div>
                        <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                          <div className="text-2xl font-bold text-warning">
                            {selectedReport.issues.filter(i => i.type === 'WARNING').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Warnings</div>
                        </div>
                        <div className="p-3 bg-info/5 rounded-lg border border-info/20">
                          <div className="text-2xl font-bold text-info">
                            {selectedReport.issues.filter(i => i.type === 'INFO').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Suggestions</div>
                        </div>
                        {selectedReport.totalAmount != null && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="text-2xl font-bold text-primary">
                              ${selectedReport.totalAmount.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Amount</div>
                          </div>
                        )}
                      </div>

                      {/* Issues List */}
                      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                        {selectedReport.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="p-3 bg-muted/50 rounded-lg border border-border"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getIssueIcon(issue.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-medium text-sm">{issue.title}</h4>
                                  <Badge variant={getIssueBadgeVariant(issue.type)} className="text-[10px]">
                                    {issue.type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {issue.description}
                                </p>
                                <div className="mt-2 p-2 bg-background rounded border border-border text-xs">
                                  <span className="font-medium text-primary">Fix: </span>
                                  {issue.recommendation}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedReport.issues.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <CheckCircle className="h-10 w-10 mx-auto mb-2 text-success" />
                            <p className="font-medium">No issues found</p>
                            <p className="text-sm">This document passed all compliance checks.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reports List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>All Reports</CardTitle>
                  <CardDescription>
                    View and manage your acquittal review reports
                  </CardDescription>
                </div>
                {reports.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllReports} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-muted/50 rounded-lg border border-border animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-muted rounded" />
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Upload and analyze documents to create your first compliance report.
                    </p>
                    <Button onClick={() => setActiveTab('upload')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Go to Upload
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                    {reports.map((report) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                          p-4 rounded-lg border transition-all cursor-pointer
                          ${selectedReport?.id === report.id
                            ? 'bg-primary/5 border-primary/30 shadow-sm'
                            : 'bg-muted/50 border-border hover:border-primary/30 hover:bg-muted/80'
                          }
                        `}
                        onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <h4 className="font-semibold text-sm truncate">{report.name}</h4>
                              <Badge className={`text-[10px] ${getStatusBadgeColor(report.status)}`}>
                                {report.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(report.date)}
                              </span>
                              {report.totalAmount != null && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {report.totalAmount.toLocaleString()}
                                </span>
                              )}
                              <span>{Math.round(report.confidence * 100)}% confidence</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {report.issues.filter(i => i.type === 'CRITICAL').length > 0 && (
                                <Badge variant="destructive" className="text-[10px]">
                                  {report.issues.filter(i => i.type === 'CRITICAL').length} Critical
                                </Badge>
                              )}
                              {report.issues.filter(i => i.type === 'WARNING').length > 0 && (
                                <Badge variant="default" className="text-[10px]">
                                  {report.issues.filter(i => i.type === 'WARNING').length} Warnings
                                </Badge>
                              )}
                              {report.issues.filter(i => i.type === 'INFO').length > 0 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {report.issues.filter(i => i.type === 'INFO').length} Suggestions
                                </Badge>
                              )}
                              {report.issues.length === 0 && (
                                <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">
                                  No Issues
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/reports/${report.id}`)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteReport(report.id)
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Akuit. Enterprise acquittal review and reporting.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-pointer" onClick={() => router.push('/settings')}>Settings</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
