'use client'

import React from 'react'
import { Card, Button } from 'react-bootstrap'

interface MobileOptimizedCardProps {
  title: string
  content: string
  actionText?: string
  onAction?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  className?: string
  disabled?: boolean
}

export default function MobileOptimizedCard({
  title,
  content,
  actionText,
  onAction,
  variant = 'primary',
  className = '',
  disabled = false
}: MobileOptimizedCardProps) {
  return (
    <Card className={`mobile-card ${className}`}>
      <Card.Body className="p-4">
        <Card.Title className="h5 mb-3">{title}</Card.Title>
        <Card.Text className="mb-4">{content}</Card.Text>
        
        {actionText && onAction && (
          <Button
            variant={variant}
            onClick={onAction}
            disabled={disabled}
            className="w-100 mobile-action-button"
            size="lg"
          >
            {actionText}
          </Button>
        )}
      </Card.Body>
    </Card>
  )
}
