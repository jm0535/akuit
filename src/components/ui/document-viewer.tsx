'use client'

import { useState, useRef } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2, Download, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface IssueAnnotation {
  id: string
  type: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  description: string
  recommendation: string
  confidence: number
}

interface DocumentViewerProps {
  documentUrl: string
  documentType?: string
  title?: string
  issues?: IssueAnnotation[]
  onDownload?: () => void
  className?: string
}

export function DocumentViewer({
  documentUrl,
  documentType,
  title,
  issues = [],
  onDownload,
  className
}: DocumentViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [selectedIssue, setSelectedIssue] = useState<IssueAnnotation | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const viewerRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const getIssueIcon = (type: IssueAnnotation['type']) => {
    switch (type) {
      case 'CRITICAL':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'INFO':
        return <Info className="h-4 w-4 text-info" />
    }
  }

  const getIssueBadgeVariant = (type: IssueAnnotation['type']): 'destructive' | 'default' | 'secondary' => {
    switch (type) {
      case 'CRITICAL': return 'destructive'
      case 'WARNING': return 'default'
      case 'INFO': return 'secondary'
    }
  }

  // Determine if document should render as PDF iframe or image
  const isPdf = documentType?.includes('pdf') ||
    documentUrl?.toLowerCase().endsWith('.pdf') ||
    documentUrl?.includes('application/pdf')

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {title && <h3 className="font-semibold text-lg">{title}</h3>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRotate} title="Rotate">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset} title="Reset View">
              <Maximize2 className="h-4 w-4" />
            </Button>
            {onDownload && (
              <Button variant="outline" size="icon" onClick={onDownload} title="Download">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Document Viewer */}
      <Card className="relative overflow-hidden bg-muted/30" style={{ minHeight: '500px' }}>
        {documentUrl ? (
          isPdf ? (
            <iframe
              src={documentUrl}
              className="w-full border-0 bg-white"
              style={{ height: '600px' }}
              title={title || 'Document Viewer'}
            />
          ) : (
            <div
              ref={viewerRef}
              className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
              style={{ minHeight: '500px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="transition-transform duration-75 flex items-start justify-center p-4"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={documentUrl}
                  alt={title || 'Document'}
                  className="max-w-full shadow-2xl"
                  draggable={false}
                />
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
            <div className="text-center">
              <p className="font-medium">No document to display</p>
              <p className="text-sm">Upload a document to view it here</p>
            </div>
          </div>
        )}
      </Card>

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {getIssueIcon(selectedIssue.type)}
              <h3 className="font-semibold text-lg">{selectedIssue.title}</h3>
              <Badge variant={getIssueBadgeVariant(selectedIssue.type)} className="text-xs">
                {selectedIssue.type}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedIssue(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm mt-1">{selectedIssue.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Recommendation</label>
              <p className="text-sm mt-1">{selectedIssue.recommendation}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Issue Summary */}
      {issues.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Issues Found ({issues.length})</h3>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={issue.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-border"
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="mt-0.5">
                  {getIssueIcon(issue.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{issue.title}</p>
                    <Badge variant={getIssueBadgeVariant(issue.type)} className="text-[10px]">
                      {issue.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {issue.description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
