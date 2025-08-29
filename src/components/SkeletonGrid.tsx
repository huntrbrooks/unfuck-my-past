'use client'

import React from 'react'
import { Row, Col } from 'react-bootstrap'
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
  const colSize = 12 / columns

  return (
    <Row className={className}>
      {items.map((_, index) => (
        <Col key={index} md={colSize} className="mb-4">
          <SkeletonCard 
            lines={lines}
            showImage={showImage}
            showButton={showButton}
          />
        </Col>
      ))}
    </Row>
  )
}
