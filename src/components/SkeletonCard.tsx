'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
  variant?: 'default' | 'glass' | 'feature'
  showHeader?: boolean
  showContent?: boolean
  showFooter?: boolean
}

export default function SkeletonCard({ 
  className,
  variant = 'default',
  showHeader = true,
  showContent = true,
  showFooter = false
}: SkeletonCardProps) {
  const variantClasses = {
    default: 'bg-card border border-border/50',
    glass: 'glass-card border-white/20',
    feature: 'feature-card border-border/20'
  }

  return (
    <div className={cn(
      'rounded-xl p-6 animate-pulse',
      variantClasses[variant],
      className
    )}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-muted rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      )}
      
      {showContent && (
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
        </div>
      )}
      
      {showFooter && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="h-10 bg-muted rounded-lg w-full" />
        </div>
      )}
    </div>
  )
}

// Specialized skeleton components
export function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <div className={cn('w-12 h-12 bg-muted rounded-full animate-pulse', className)} />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonButton({ className }: { className?: string }) {
  return (
    <div className={cn('h-10 bg-muted rounded-lg animate-pulse', className)} />
  )
}

export function SkeletonBadge({ className }: { className?: string }) {
  return (
    <div className={cn('h-6 w-16 bg-muted rounded-full animate-pulse', className)} />
  )
}
