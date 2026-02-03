'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedBackgroundProps {
  className?: string
}

/**
 * Stunning enterprise-grade animated background
 * Features:
 * - Smooth gradient mesh animation
 * - Floating blurred orbs for depth
 * - Light/dark mode compatible
 * - Respects prefers-reduced-motion
 * - Performance optimized (CSS-only animations)
 */
export function AnimatedBackground({ className }: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={cn(
          'fixed inset-0 -z-10',
          'bg-gradient-to-br from-background via-background to-primary/5',
          className
        )}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* Base gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/[0.03] dark:to-primary/[0.08]" />

      {/* Animated gradient blobs */}
      <div className="absolute inset-0">
        {/* Large primary blob - top right */}
        <div
          className={cn(
            'absolute rounded-full blur-3xl opacity-50 dark:opacity-40',
            'animate-gradient-blob-1',
            'bg-gradient-to-br from-primary/30 to-accent/30',
            'w-[700px] h-[700px]',
            '-top-[100px] -right-[100px]'
          )}
        />

        {/* Secondary blob - bottom left */}
        <div
          className={cn(
            'absolute rounded-full blur-3xl opacity-50 dark:opacity-40',
            'animate-gradient-blob-2',
            'bg-gradient-to-br from-accent/30 to-primary/30',
            'w-[600px] h-[600px]',
            '-bottom-[100px] -left-[100px]'
          )}
        />

        {/* Tertiary blob - top left */}
        <div
          className={cn(
            'absolute rounded-full blur-3xl opacity-40 dark:opacity-30',
            'animate-gradient-blob-3',
            'bg-gradient-to-br from-success/20 to-accent/20',
            'w-[500px] h-[500px]',
            '-top-[50px] -left-[50px]'
          )}
        />

        {/* Small accent blob - bottom right */}
        <div
          className={cn(
            'absolute rounded-full blur-3xl opacity-40 dark:opacity-30',
            'animate-gradient-blob-4',
            'bg-gradient-to-br from-warning/20 to-primary/20',
            'w-[400px] h-[400px]',
            '-bottom-[50px] -right-[50px]'
          )}
        />

        {/* Center blob - adds depth */}
        <div
          className={cn(
            'absolute rounded-full blur-3xl opacity-30 dark:opacity-25',
            'animate-gradient-blob-5',
            'bg-gradient-to-br from-primary/25 to-accent/25',
            'w-[800px] h-[800px]',
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          )}
        />
      </div>

      {/* Subtle mesh grid overlay */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-[linear-gradient(to_right,rgba(100,100,100,0.08)_1px,transparent_1px),',
          'linear-gradient(to_bottom,rgba(100,100,100,0.08)_1px,transparent_1px)]',
          'bg-[size:60px_60px]',
          'dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),',
          'dark:linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]',
          'dark:bg-[size:60px_60px]'
        )}
      />

      {/* Subtle noise texture for premium feel */}
      <div
        className={cn(
          'absolute inset-0',
          'opacity-[0.5] dark:opacity-[0.6]',
          'bg-[url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.04%22/%3E%3C/svg%3E")]'
        )}
      />
    </div>
  )
}
