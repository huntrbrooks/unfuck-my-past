'use client'

import React from 'react'
import SkeletonCard from './SkeletonCard'

interface SkeletonGridProps {
  count?: number
  columns?: number
  lines?: number
  showImage?: boolean
  showButton?: boolean
  className?: string
}

export default function SkeletonGrid({ 
  count = 3, 
  columns = 3, 
  lines = 3,
  showImage = false,
  showButton = false,
  className = ''
}: SkeletonGridProps) {
  const items = Array.from({ length: count })

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6 ${className}`}>
      {items.map((_, index) => (
        <div key={index}>
          <SkeletonCard 
            lines={lines}
            showImage={showImage}
            showButton={showButton}
          />
        </div>
      ))}
    </div>
  )
}
