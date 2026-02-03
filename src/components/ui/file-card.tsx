'use client'

import { useState, useEffect } from 'react'
import { FileText, Trash2, Eye, CheckCircle, XCircle, Zap, RotateCw } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Progress } from './progress'
import { cn } from '@/lib/utils'
import type { ProcessedImageResult, DocumentType } from '@/lib/document-processor'
import { detectDocumentType, getQualityBadgeVariant } from '@/lib/document-processor'

interface FileCardProps {
  file: File
  index: number
  onRemove: (index: number) => void
  onPreprocess?: (index: number, result?: ProcessedImageResult) => void
  showQuality?: boolean
  showPreprocess?: boolean
  className?: string
}

export function FileCard({
  file,
  index,
  onRemove,
  onPreprocess,
  showQuality = true,
  showPreprocess = true,
  className
}: FileCardProps) {
  const [quality, setQuality] = useState<ProcessedImageResult | null>(null)
  const [docType, setDocType] = useState<DocumentType | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      detectDocumentType(file).then(setDocType).catch(() => {})
    } else if (file.type === 'application/pdf') {
      setDocType({ type: 'digital', confidence: 85, reason: 'PDF document detected' })
    }
  }, [file])

  const handlePreprocess = async () => {
    if (!showPreprocess || !onPreprocess) return

    setIsAnalyzing(true)
    try {
      onPreprocess(index)
    } catch (error) {
      console.error('Preprocessing failed:', error)
    } finally {
      setTimeout(() => setIsAnalyzing(false), 1000)
    }
  }

  const getDocTypeIcon = () => {
    if (!docType) return null

    switch (docType.type) {
      case 'scanned':
        return <Zap className="h-3 w-3 text-warning" />
      case 'digital':
        return <CheckCircle className="h-3 w-3 text-success" />
      case 'mixed':
        return <XCircle className="h-3 w-3 text-info" />
    }
  }

  const getDocTypeBadge = () => {
    if (!docType) return null

    const colors = {
      scanned: 'bg-warning/10 text-warning',
      digital: 'bg-success/10 text-success',
      mixed: 'bg-info/10 text-info'
    }

    return (
      <Badge variant="outline" className={cn('text-xs', colors[docType.type])}>
        {docType.type.toUpperCase()}
      </Badge>
    )
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('flex items-start gap-3 p-3 bg-muted/50 rounded-lg group', className)}>
      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{file.name}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getDocTypeIcon()}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsExpanded(!isExpanded)}
              title="Show details"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(index)}
              title="Remove file"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatSize(file.size)}</span>
          <span className="text-muted-foreground/50">{file.type || 'Unknown type'}</span>
          {docType && getDocTypeBadge()}
        </div>

        {isExpanded && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            {docType && (
              <div className="text-xs space-y-1">
                <p className="font-medium text-muted-foreground">Document Type Detection</p>
                <p className="text-muted-foreground/80">{docType.reason}</p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Confidence:</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${docType.confidence}%` }} />
                  </div>
                  <span className="font-medium">{docType.confidence}%</span>
                </div>
              </div>
            )}

            {showQuality && quality && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Image Quality</span>
                  <Badge variant={getQualityBadgeVariant(quality.quality)} className="text-xs">
                    {quality.quality}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Brightness:</span>
                    <span className="font-medium ml-1">{quality.details.brightness.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contrast:</span>
                    <span className="font-medium ml-1">{quality.details.contrast.toFixed(0)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Overall Confidence</span>
                    <span className="font-medium">{quality.confidence}%</span>
                  </div>
                  <Progress value={quality.confidence} className="h-1.5" />
                </div>
              </div>
            )}

            {showPreprocess && !quality && file.type.startsWith('image/') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreprocess}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Quality...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Preprocess & Enhance
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
