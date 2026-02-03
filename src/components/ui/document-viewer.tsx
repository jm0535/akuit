'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2, Download, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Card } from './card'
import { cn } from '@/lib/utils'
import type { ProcessedImageResult } from '@/lib/document-processor'

interface IssueAnnotation {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  x: number
  y: number
  width: number
  height: number
  description: string
  recommendation: string
}

interface DocumentViewerProps {
  imageUrl: string
  title?: string
  issues?: IssueAnnotation[]
  quality?: ProcessedImageResult
  onDownload?: () => void
  className?: string
}

export function DocumentViewer({
  imageUrl,
  title,
  issues = [],
  quality,
  onDownload,
  className
}: DocumentViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [selectedIssue, setSelectedIssue] = useState<IssueAnnotation | null>(null)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const viewerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 4))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
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

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getIssueIcon = (type: IssueAnnotation['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'info':
        return <Info className="h-4 w-4 text-info" />
    }
  }

  const getIssueColor = (type: IssueAnnotation['type']) => {
    switch (type) {
      case 'critical':
        return 'rgba(239, 68, 68, 0.3)' // Red
      case 'warning':
        return 'rgba(245, 158, 11, 0.3)' // Orange
      case 'info':
        return 'rgba(59, 130, 246, 0.3)' // Blue
    }
  }

  const getIssueBorderColor = (type: IssueAnnotation['type']) => {
    switch (type) {
      case 'critical':
        return '#ef4444'
      case 'warning':
        return '#f59e0b'
      case 'info':
        return '#3b82f6'
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {title && <h3 className="font-semibold text-lg">{title}</h3>}
            {quality && (
              <Badge
                variant={quality.quality === 'excellent' ? 'default' : quality.quality === 'good' ? 'secondary' : 'outline'}
                className="ml-2"
              >
                Quality: {quality.quality}
              </Badge>
            )}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              {showAnnotations ? 'Hide' : 'Show'} Annotations
            </Button>
          </div>
        </div>
      </Card>

      {/* Document Viewer */}
      <Card className="flex-1 relative overflow-hidden bg-muted/30">
        <div
          ref={viewerRef}
          className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute origin-top-left transition-transform duration-75"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`
            }}
          >
            {imageUrl && (imageUrl.toLowerCase().endsWith('.pdf') || imageUrl.includes('application/pdf') || imageUrl.includes('/api/akuit/documents/')) ? (
              <iframe
                src={imageUrl}
                className="w-full h-[800px] border-0 rounded-lg shadow-inner bg-white"
                title="Document Viewer"
              />
            ) : imageUrl ? (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Document"
                className="max-w-none shadow-2xl"
                draggable={false}
              />
            ) : null}

            {/* Issue Annotations */}
            {showAnnotations && issues.map((issue) => (
              <div
                key={issue.id}
                className="absolute cursor-pointer group"
                style={{
                  left: issue.x,
                  top: issue.y,
                  width: issue.width,
                  height: issue.height,
                  backgroundColor: getIssueColor(issue.type),
                  border: `2px solid ${getIssueBorderColor(issue.type)}`
                }}
                onClick={() => setSelectedIssue(issue)}
              >
                {/* Issue marker */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                    {getIssueIcon(issue.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {getIssueIcon(selectedIssue.type)}
              <h3 className="font-semibold text-lg">{selectedIssue.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIssue(null)}
            >
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
            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <p className="text-sm mt-1">
                Page {selectedIssue.x}, Section: {selectedIssue.y}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quality Details */}
      {quality && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Image Quality Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Brightness</label>
              <p className="text-lg font-semibold">{quality.details.brightness.toFixed(0)}</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(quality.details.brightness / 255) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Contrast</label>
              <p className="text-lg font-semibold">{quality.details.contrast.toFixed(0)}</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(quality.details.contrast / 2.55, 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Sharpness</label>
              <p className="text-lg font-semibold">{quality.details.sharpness.toFixed(0)}</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(quality.details.sharpness, 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Confidence</label>
              <p className="text-lg font-semibold">{quality.confidence}%</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${quality.confidence}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Quality</span>
              <Badge
                variant={quality.quality === 'excellent' ? 'default' : quality.quality === 'good' ? 'secondary' : 'outline'}
              >
                {quality.quality}
              </Badge>
            </div>
            {quality.details.isGrayscale && (
              <p className="text-sm text-muted-foreground mt-2">
                ℹ️ Document appears to be grayscale
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Issue Summary */}
      {issues.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Issues Found</h3>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={issue.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="mt-0.5">
                  {getIssueIcon(issue.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{issue.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {issue.description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
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
