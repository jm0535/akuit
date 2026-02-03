'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Plus, Download, Trash2, Eye, Calendar, DollarSign, Moon, Sun, Settings, FileImage, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { DocumentViewer } from '@/components/ui/document-viewer'
import type { ProcessedImageResult, DocumentType } from '@/lib/document-processor'
import { preprocessImage, detectDocumentType, getQualityColor, getQualityBadgeVariant } from '@/lib/document-processor'
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
  date: Date | string
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED'
  issues: Issue[]
  totalAmount?: number
  confidence: number
  documentUrl?: string
  quality?: ProcessedImageResult
  docType?: DocumentType
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
  const [viewingDocument, setViewingDocument] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState('upload')
  const { toast } = useToast()
  const { theme, setTheme, actualTheme } = useTheme()
  const router = useRouter()

  // Fetch reports on component mount
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

    // Upload progress simulation
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    setTimeout(() => {
      clearInterval(uploadInterval)
      setUploadProgress(100)
      setAnalysisStatus('analyzing')

      // Simulate API call to backend
      processAnalysis()
    }, 2500)
  }

  const processAnalysis = async () => {
    try {
      // Use new analyze-document API
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
        throw new Error('Analysis failed')
      }

      const result = await response.json()

      if (result.success) {
        const newReport: Report = {
          id: result.reportId,
          name: result.extractedData?.documentType
            ? `${result.extractedData.documentType} Report - ${new Date().toLocaleDateString()}`
            : `Acquittal Report ${reports.length + 1}`,
          date: new Date().toISOString(),
          status: 'PENDING',
          issues: result.issues || [],
          totalAmount: result.totalAmount,
          confidence: result.confidence || 0.85,
        }

        setReports(prev => [newReport, ...prev])
        setSelectedReport(newReport)
        setFiles([])
        setFileQualities(new Map())
        setFileDocTypes(new Map())
        setAnalysisStatus('complete')
        setActiveTab('reports')

        // Refresh reports list
        fetchReports()

        toast({
          title: 'Analysis complete',
          description: `Found ${result.summary?.totalIssues || 0} issues (${result.summary?.criticalIssues || 0} critical)`,
        })
      }
    } catch (error) {
      setAnalysisStatus('error')
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'There was an error analyzing your documents',
        variant: 'destructive',
      })
    }
  }

  const viewDocument = (report: Report) => {
    setViewingDocument(report)
  }

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString()
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

    // Add Logo or Title
    doc.setFontSize(20)
    doc.text('Akuit Report', 14, 22)

    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

    if (report) {
      // Single Report Export
      doc.setFontSize(16)
      doc.text(report.name, 14, 45)

      const issueData = report.issues.map(issue => [
        issue.type,
        issue.title,
        issue.confidence + '%',
        issue.recommendation
      ])

      autoTable(doc, {
        startY: 50,
        head: [['Type', 'Issue', 'Confidence', 'Recommendation']],
        body: issueData,
      })

      doc.save(`akuit-report-${report.id}.pdf`)
    } else {
      // All Reports Export
      const tableData = reports.map(r => [
        r.name,
        new Date(r.date).toLocaleDateString(),
        r.status,
        r.issues.length,
        r.totalAmount ? '$' + r.totalAmount : '-'
      ])

      autoTable(doc, {
        startY: 40,
        head: [['Name', 'Date', 'Status', 'Issues', 'Amount']],
        body: tableData,
      })

      doc.save('akuit-reports-summary.pdf')
    }
  }

  const generateCSV = () => {
    const headers = ['Name', 'Date', 'Status', 'Issues', 'Critical', 'Warning', 'Info', 'Amount']
    const csvContent = [
      headers.join(','),
      ...reports.map(r => {
        return [
          `"${r.name}"`,
          new Date(r.date).toLocaleDateString(),
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
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'akuit_reports_export.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
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

  const getIssueBadgeVariant = (type: IssueType) => {
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
        return 'bg-warning text-warning-foreground'
      case 'REVIEWED':
        return 'bg-info text-info-foreground'
      case 'APPROVED':
        return 'bg-success text-success-foreground'
      case 'REJECTED':
        return 'bg-destructive text-destructive-foreground'
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Akuit</h1>
                <p className="text-xs text-muted-foreground">Acquittal Review & Reporting</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setTheme(actualTheme === 'dark' ? 'light' : 'dark')
              }} title="Toggle theme">
                {actualTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => generateCSV()}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generatePDF()}>
                    Export as PDF (Summary)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          if (value === 'reports') fetchReports()
        }} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Upload & Analyze Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Upload Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Documents</CardTitle>
                    <CardDescription>
                      Upload your acquittal reports, receipts, and financial documents for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        relative border-2 border-dashed rounded-lg p-12
                        transition-all duration-200 ease-out
                        ${isDragOver
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
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
                            or click to browse • Supports images and PDFs
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
                          className="space-y-2"
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
                                quality={fileQualities.get(index) || null}
                                docType={fileDocTypes.get(index) || null}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Progress Bar */}
                    {analysisStatus === 'uploading' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Uploading files...</span>
                          <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {analysisStatus === 'analyzing' && (
                      <Alert>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <AlertDescription className="font-medium">
                            Analyzing documents with AI...
                          </AlertDescription>
                        </div>
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
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Analyze Documents
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Results */}
              {selectedReport && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Analysis Results</CardTitle>
                          <CardDescription>
                            Issues found and recommendations for {selectedReport.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => generatePDF(selectedReport)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                          </Button>
                          <Badge variant="secondary" className="ml-2">
                            {Math.round(selectedReport.confidence * 100)}% Confidence
                          </Badge>
                        </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                            <div className="text-2xl font-bold text-destructive">
                              {selectedReport.issues.filter(i => i.type === 'CRITICAL').length}
                            </div>
                            <div className="text-xs text-muted-foreground">Critical Issues</div>
                          </div>
                          <div className="p-4 bg-warning/5 rounded-lg border-warning/20">
                            <div className="text-2xl font-bold text-warning">
                              {selectedReport.issues.filter(i => i.type === 'WARNING').length}
                            </div>
                            <div className="text-xs text-muted-foreground">Warnings</div>
                          </div>
                          <div className="p-4 bg-info/5 rounded-lg border-info/20">
                            <div className="text-2xl font-bold text-info">
                              {selectedReport.issues.filter(i => i.type === 'INFO').length}
                            </div>
                            <div className="text-xs text-muted-foreground">Suggestions</div>
                          </div>
                          {selectedReport.totalAmount && (
                            <div className="p-4 bg-primary/5 rounded-lg border-primary/20">
                              <div className="text-2xl font-bold text-primary">
                                ${selectedReport.totalAmount.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Amount</div>
                            </div>
                          )}
                        </div>

                        {/* Issues List */}
                        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                          {selectedReport.issues.map((issue) => (
                            <motion.div
                              key={issue.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 bg-muted/50 rounded-lg border border-border"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">{getIssueIcon(issue.type)}</div>
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <h4 className="font-semibold">{issue.title}</h4>
                                    <Badge variant={getIssueBadgeVariant(issue.type)}>
                                      {issue.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(issue.confidence * 100)}% confidence
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {issue.description}
                                  </p>
                                  <div className="p-3 bg-background rounded-md border border-border">
                                    <p className="text-sm font-medium text-primary mb-1">Recommendation</p>
                                    <p className="text-sm">{issue.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {selectedReport.issues.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
                              <p>No issues found. Great job!</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
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
                        <span className="text-muted-foreground">Approved</span>
                        <span className="font-semibold text-success">
                          {reports.filter(r => r.status === 'APPROVED').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Help Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• Upload receipts and invoices</p>
                    <p>• AI analyzes for compliance</p>
                    <p>• Get recommendations for fixes</p>
                    <p>• Export detailed reports</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 bg-muted/50 rounded-lg border border border-border animate-pulse">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                              <div className="flex-1">
                                <div className="h-3 bg-muted rounded w-1/3 mb-2 animate-pulse" />
                                <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Upload and analyze documents to create your first report
                        </p>
                        <Button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))}>
                          Go to Upload
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                        {reports.map((report) => (
                          <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedReport(report)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <h4 className="font-semibold">{report.name}</h4>
                                  <Badge className={getStatusBadgeColor(report.status)}>
                                    {report.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(report.date)}
                                </div>
                                {report.totalAmount && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {report.totalAmount.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="destructive" className="text-xs">
                                {report.issues.filter(i => i.type === 'CRITICAL').length} Critical
                              </Badge>
                              <Badge variant="default" className="text-xs">
                                {report.issues.filter(i => i.type === 'WARNING').length} Warnings
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {report.issues.filter(i => i.type === 'INFO').length} Suggestions
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('Opening document:', report.documentUrl)
                                  if (report.documentUrl) {
                                    window.open(report.documentUrl, '_blank')
                                  } else {
                                    toast({ title: 'No document found' })
                                  }
                                }}
                                className="ml-auto"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Open PDF
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('Deleting report:', report.id)
                                  deleteReport(report.id)
                                }}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

      {/* Modal Dialog Removed as requested */}


      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Akuit. Premium enterprise acquittal review and reporting.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
