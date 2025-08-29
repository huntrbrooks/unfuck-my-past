'use client'

import React from 'react'
import { Card, Placeholder } from 'react-bootstrap'

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
    <Card className={`skeleton-card ${className}`}>
      <Card.Body>
        {showImage && (
          <Placeholder as="div" animation="glow" className="mb-3">
            <Placeholder xs={12} style={{ height: '120px', borderRadius: '8px' }} />
          </Placeholder>
        )}
        
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={8} />
        </Placeholder>
        
        {Array.from({ length: lines }).map((_, index) => (
          <Placeholder key={index} as="p" animation="glow" className="mb-2">
            <Placeholder xs={12} />
            {index < lines - 1 && <Placeholder xs={10} />}
          </Placeholder>
        ))}
        
        {showButton && (
          <Placeholder.Button variant="primary" xs={6} className="mt-3" />
        )}
      </Card.Body>
    </Card>
  )
}
