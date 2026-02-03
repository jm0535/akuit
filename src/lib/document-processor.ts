/**
 * Document Processing Utilities
 * Handles image preprocessing, enhancement, and quality detection for scanned documents
 */

export interface ProcessedImageResult {
  processedImage: string
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  confidence: number
  details: {
    brightness: number
    contrast: number
    sharpness: number
    isGrayscale: boolean
    estimatedRotation: number
  }
}

export interface DocumentType {
  type: 'digital' | 'scanned' | 'mixed'
  confidence: number
  reason: string
}

/**
 * Preprocess and enhance a document image
 */
export async function preprocessImage(imageDataUrl: string): Promise<ProcessedImageResult> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { brightness, contrast, isGrayscale } = analyzeImageQuality(imageData)

      // Apply enhancements
      enhanceImage(ctx, canvas.width, canvas.height, brightness, contrast)

      // Get processed image data URL
      const processedDataUrl = canvas.toDataURL('image/jpeg', 0.95)

      // Calculate sharpness
      const sharpness = calculateSharpness(imageData)

      // Determine overall quality
      const quality = determineQuality(brightness, contrast, sharpness)

      // Estimate rotation (simplified)
      const estimatedRotation = estimateRotation(imageData)

      resolve({
        processedImage: processedDataUrl,
        quality,
        confidence: calculateConfidence(quality, brightness, contrast, sharpness),
        details: {
          brightness,
          contrast,
          sharpness,
          isGrayscale,
          estimatedRotation
        }
      })
    }

    img.src = imageDataUrl
  })
}

/**
 * Analyze image quality metrics
 */
function analyzeImageQuality(imageData: ImageData): {
  brightness: number
  contrast: number
  isGrayscale: boolean
} {
  const data = imageData.data
  let totalBrightness = 0
  let minBrightness = 255
  let maxBrightness = 0
  let colorVariance = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r + g + b) / 3

    totalBrightness += brightness
    minBrightness = Math.min(minBrightness, brightness)
    maxBrightness = Math.max(maxBrightness, brightness)

    // Calculate color variance for grayscale detection
    colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
  }

  const pixelCount = data.length / 4
  const avgBrightness = totalBrightness / pixelCount
  const contrast = maxBrightness - minBrightness
  const avgColorVariance = colorVariance / pixelCount

  return {
    brightness: avgBrightness,
    contrast,
    isGrayscale: avgColorVariance < 30 // Low variance means grayscale
  }
}

/**
 * Enhance image for better OCR/analysis
 */
function enhanceImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number,
  contrast: number
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Target brightness (slightly darker for better OCR)
  const targetBrightness = 180

  // Calculate brightness adjustment
  const brightnessAdjust = targetBrightness - brightness

  // Contrast enhancement factor
  const contrastFactor = contrast < 100 ? 1.2 : 1.1

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // Apply brightness adjustment
    r += brightnessAdjust
    g += brightnessAdjust
    b += brightnessAdjust

    // Apply contrast enhancement
    r = ((r - 128) * contrastFactor) + 128
    g = ((g - 128) * contrastFactor) + 128
    b = ((b - 128) * contrastFactor) + 128

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Calculate image sharpness (simplified)
 */
function calculateSharpness(imageData: ImageData): number {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  let totalEdgeStrength = 0
  let edgeCount = 0

  // Sample every 10th pixel for performance
  for (let y = 1; y < height - 1; y += 10) {
    for (let x = 1; x < width - 1; x += 10) {
      const i = (y * width + x) * 4

      // Calculate horizontal and vertical gradients
      const leftDiff = Math.abs(data[i] - data[i - 4])
      const topDiff = Math.abs(data[i] - data[i - width * 4])

      const edgeStrength = Math.max(leftDiff, topDiff)

      if (edgeStrength > 20) {
        totalEdgeStrength += edgeStrength
        edgeCount++
      }
    }
  }

  return edgeCount > 0 ? totalEdgeStrength / edgeCount : 0
}

/**
 * Determine overall quality rating
 */
function determineQuality(brightness: number, contrast: number, sharpness: number): ProcessedImageResult['quality'] {
  const brightnessScore = brightness > 100 && brightness < 200 ? 1 : 0.5
  const contrastScore = contrast > 80 ? 1 : contrast > 40 ? 0.7 : 0.3
  const sharpnessScore = sharpness > 40 ? 1 : sharpness > 25 ? 0.7 : 0.4

  const overallScore = (brightnessScore * 0.3 + contrastScore * 0.4 + sharpnessScore * 0.3)

  if (overallScore >= 0.8) return 'excellent'
  if (overallScore >= 0.6) return 'good'
  if (overallScore >= 0.4) return 'fair'
  return 'poor'
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  quality: ProcessedImageResult['quality'],
  brightness: number,
  contrast: number,
  sharpness: number
): number {
  const qualityScore = quality === 'excellent' ? 1 : quality === 'good' ? 0.8 : quality === 'fair' ? 0.6 : 0.4

  const normalizedBrightness = 1 - Math.abs(brightness - 150) / 150
  const normalizedContrast = Math.min(contrast / 150, 1)
  const normalizedSharpness = Math.min(sharpness / 60, 1)

  return Math.round((qualityScore * 0.5 + normalizedBrightness * 0.2 + normalizedContrast * 0.2 + normalizedSharpness * 0.1) * 100)
}

/**
 * Estimate document rotation (simplified)
 */
function estimateRotation(imageData: ImageData): number {
  // This is a simplified version
  // For production, use more sophisticated algorithms like Hough transform
  return 0
}

/**
 * Detect if document is scanned or digital
 */
export async function detectDocumentType(file: File | string): Promise<DocumentType> {
  return new Promise((resolve) => {
    let imageUrl: string

    if (typeof file === 'string') {
      imageUrl = file
    } else {
      imageUrl = URL.createObjectURL(file)
    }

    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Analyze for scanned document indicators
      let noiseLevel = 0
      let edgeDensity = 0
      let patternUniformity = 0

      for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // Calculate local noise
        if (i > 64) {
          const prevR = data[i - 64]
          const prevG = data[i - 63]
          const prevB = data[i - 62]
          noiseLevel += Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB)
        }

        // Edge detection (simplified)
        if (i + 64 < data.length) {
          const nextR = data[i + 64]
          const diff = Math.abs(r - nextR)
          if (diff > 30) edgeDensity++
        }
      }

      const pixelCount = data.length / 4
      const normalizedNoise = (noiseLevel / (pixelCount / 4)) / 3
      const normalizedEdgeDensity = edgeDensity / (pixelCount / 64)

      // Determine document type
      let type: DocumentType['type']
      let confidence: number
      let reason: string

      if (normalizedNoise > 25 && normalizedEdgeDensity > 0.15) {
        type = 'scanned'
        confidence = Math.min(90, 60 + normalizedNoise + normalizedEdgeDensity * 100)
        reason = 'High noise level and edge density indicate scanned document'
      } else if (normalizedNoise < 15 && normalizedEdgeDensity < 0.08) {
        type = 'digital'
        confidence = Math.min(95, 80 + (20 - normalizedNoise))
        reason = 'Clean digital characteristics detected'
      } else {
        type = 'mixed'
        confidence = 60
        reason = 'Mixed characteristics - may be a scan of a digital document'
      }

      if (typeof file !== 'string') {
        URL.revokeObjectURL(imageUrl)
      }

      resolve({ type, confidence, reason })
    }

    img.onerror = () => {
      resolve({
        type: 'digital',
        confidence: 50,
        reason: 'Could not analyze image, defaulting to digital'
      })
    }

    img.src = imageUrl
  })
}

/**
 * Convert PDF page to image (requires pdf.js)
 */
export async function convertPdfPageToImage(
  pdfData: ArrayBuffer,
  pageNumber: number = 1
): Promise<string> {
  try {
    // This would require pdf.js library
    // For now, return placeholder
    return ''
  } catch (error) {
    console.error('Error converting PDF page:', error)
    return ''
  }
}

/**
 * Get quality color for display
 */
export function getQualityColor(quality: ProcessedImageResult['quality']): string {
  switch (quality) {
    case 'excellent':
      return 'text-success'
    case 'good':
      return 'text-info'
    case 'fair':
      return 'text-warning'
    case 'poor':
      return 'text-destructive'
  }
}

/**
 * Get quality badge variant
 */
export function getQualityBadgeVariant(quality: ProcessedImageResult['quality']): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (quality) {
    case 'excellent':
      return 'default'
    case 'good':
      return 'secondary'
    case 'fair':
      return 'outline'
    case 'poor':
      return 'destructive'
  }
}
