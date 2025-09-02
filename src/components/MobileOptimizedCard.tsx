'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MobileOptimizedCardProps {
  title: string
  content: string
  buttonText?: string
  buttonOnClick?: () => void
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
}

const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  title,
  content,
  buttonText,
  buttonOnClick,
  className,
  variant = 'default'
}) => {
  return (
    <Card className={cn('w-full transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          {content}
        </p>
        
        {buttonText && buttonOnClick && (
          <Button 
            onClick={buttonOnClick}
            variant={variant}
            className="w-full sm:w-auto"
          >
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default MobileOptimizedCard
