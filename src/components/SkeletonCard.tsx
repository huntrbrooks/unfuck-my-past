'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface SkeletonCardProps {
  lines?: number
  showImage?: boolean
  showButton?: boolean
  className?: string
}

export default function SkeletonCard({ 
  lines = 3, 
  showImage = false, 
  showButton = false,
  className = ''
}: SkeletonCardProps) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardContent className="p-6">
        {showImage && (
          <div className="bg-gray-200 rounded-lg mb-4" style={{ height: '120px' }} />
        )}
        
        <div className="bg-gray-200 h-6 rounded mb-3" style={{ width: '60%' }} />
        
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2 mb-3">
            <div className="bg-gray-200 h-4 rounded" style={{ width: '100%' }} />
            {index < lines - 1 && (
              <div className="bg-gray-200 h-4 rounded" style={{ width: '80%' }} />
            )}
          </div>
        ))}
        
        {showButton && (
          <div className="bg-gray-200 h-10 rounded mt-4" style={{ width: '40%' }} />
        )}
      </CardContent>
    </Card>
  )
}
