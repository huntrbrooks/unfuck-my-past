'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import SkeletonCard from './SkeletonCard'

interface SkeletonGridProps {
  className?: string
  columns?: 1 | 2 | 3 | 4
  rows?: number
  variant?: 'default' | 'glass' | 'feature'
  showHeaders?: boolean
  showContent?: boolean
  showFooters?: boolean
}

export default function SkeletonGrid({ 
  className,
  columns = 3,
  rows = 2,
  variant = 'default',
  showHeaders = true,
  showContent = true,
  showFooters = false
}: SkeletonGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  return (
    <div className={cn(
      'grid gap-6',
      gridCols[columns],
      className
    )}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <SkeletonCard
          key={i}
          variant={variant}
          showHeader={showHeaders}
          showContent={showContent}
          showFooter={showFooters}
        />
      ))}
    </div>
  )
}

// Specialized grid layouts
export function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} variant="default" showContent={false} />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard variant="feature" showFooter={true} />
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} variant="default" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} variant="glass" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonOnboarding({ className }: { className?: string }) {
  return (
    <div className={cn('max-w-2xl mx-auto space-y-8', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Step 3 of 10</span>
          <span className="text-muted-foreground">30%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-1/3 animate-pulse" />
        </div>
      </div>
      
      {/* Question */}
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
      
      {/* Options */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-primary rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

export function SkeletonDiagnostic({ className }: { className?: string }) {
  return (
    <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
      {/* Question */}
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-5 bg-muted rounded w-1/2" />
      </div>
      
      {/* Response Area */}
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="flex justify-between items-center">
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-primary rounded-lg animate-pulse" />
        </div>
      </div>
      
      {/* Previous Responses */}
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-1/3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 border border-border rounded-lg space-y-3">
            <div className="h-5 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
