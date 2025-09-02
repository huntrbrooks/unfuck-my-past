'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

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
  const sizeMap: Record<string, string> = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorMap: Record<string, string> = {
    primary: 'text-green-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    light: 'text-gray-300',
    dark: 'text-gray-900'
  }

  return (
    <div className={`text-center ${className}`}>
      <Loader2 
        className={`${sizeMap[size]} ${colorMap[variant]} animate-spin mx-auto mb-2`}
        role="status"
      />
      {text && <p className="text-gray-600 mb-0">{text}</p>}
    </div>
  )
}
