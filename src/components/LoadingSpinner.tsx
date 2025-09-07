'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'glass' | 'gradient' | 'neon'
  className?: string
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const variantClasses: Record<NonNullable<LoadingSpinnerProps['variant']>, string> = {
    default: 'border-[#ff1aff] shadow-[0_0_10px_#ff1aff,0_0_20px_#ff1aff]',
    primary: 'border-[#ff1aff] shadow-[0_0_10px_#ff1aff,0_0_20px_#ff1aff]',
    glass: 'border-white/30',
    gradient: 'border-gradient',
    neon: 'border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.45)]'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className={cn(
        'rounded-full border-2 border-t-transparent animate-spin',
        sizeClasses[size],
        variantClasses[variant]
      )} />
      {text && (
        <p className="mt-3 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

// Enhanced loading states
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
    </div>
  )
}

export function LoadingShimmer({ className }: { className?: string }) {
  return (
    <div className={cn('w-full h-4 bg-muted rounded-md overflow-hidden', className)}>
      <div className="loading-shimmer w-full h-full" />
    </div>
  )
}
