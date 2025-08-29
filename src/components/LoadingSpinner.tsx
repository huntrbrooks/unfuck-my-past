'use client'

import React from 'react'
import { Spinner } from 'react-bootstrap'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'
  text?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  text = 'Loading...',
  className = ''
}: LoadingSpinnerProps) {
  const sizeMap: Record<string, 'sm' | undefined> = {
    sm: 'sm',
    md: undefined,
    lg: undefined
  }

  return (
    <div className={`text-center ${className}`}>
      <Spinner 
        animation="border" 
        variant={variant}
        size={sizeMap[size]}
        className="mb-2"
      />
      {text && <p className="text-muted mb-0">{text}</p>}
    </div>
  )
}
