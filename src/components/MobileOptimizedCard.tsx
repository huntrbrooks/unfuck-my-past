'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'

interface MobileOptimizedCardProps {
  className?: string
  variant?: 'default' | 'glass' | 'feature' | 'modern'
  title?: string
  description?: string
  children?: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  onClick?: () => void
  interactive?: boolean
}

export default function MobileOptimizedCard({
  className,
  variant = 'default',
  title,
  description,
  children,
  icon,
  badge,
  onClick,
  interactive = false
}: MobileOptimizedCardProps) {
  const variantClasses = {
    default: 'bg-card border border-border/50',
    glass: 'glass-card border-white/20',
    feature: 'feature-card border-border/20',
    modern: 'modern-card border-0'
  }

  const interactiveClasses = interactive ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : ''

  return (
    <Card 
      className={cn(
        'rounded-xl overflow-hidden',
        variantClasses[variant],
        interactiveClasses,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        {(title || icon || badge) && (
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {icon && (
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <CardTitle className="text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-2">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {badge && (
              <div className="flex-shrink-0 ml-2">
                {badge}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {children && (
          <div className="space-y-3">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized mobile card variants
export function MobileFeatureCard({ 
  className, 
  title, 
  description, 
  icon, 
  children, 
  onClick 
}: Omit<MobileOptimizedCardProps, 'variant'>) {
  return (
    <MobileOptimizedCard
      variant="feature"
      className={cn('group', className)}
      title={title}
      description={description}
      icon={icon}
      onClick={onClick}
      interactive={!!onClick}
    >
      {children}
    </MobileOptimizedCard>
  )
}

export function MobileGlassCard({ 
  className, 
  title, 
  description, 
  icon, 
  children, 
  onClick 
}: Omit<MobileOptimizedCardProps, 'variant'>) {
  return (
    <MobileOptimizedCard
      variant="glass"
      className={cn('backdrop-blur-sm', className)}
      title={title}
      description={description}
      icon={icon}
      onClick={onClick}
      interactive={!!onClick}
    >
      {children}
    </MobileOptimizedCard>
  )
}

export function MobileStatsCard({ 
  className, 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  onClick 
}: {
  className?: string
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  onClick?: () => void
}) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground'
  }

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }

  return (
    <MobileOptimizedCard
      variant="modern"
      className={cn('text-center', className)}
      onClick={onClick}
      interactive={!!onClick}
    >
      {icon && (
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      
      <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
        {value}
      </CardTitle>
      
      <CardDescription className="text-sm sm:text-base text-muted-foreground mb-2">
        {title}
      </CardDescription>
      
      {subtitle && (
        <p className="text-xs text-muted-foreground">
          {subtitle}
        </p>
      )}
      
      {trend && (
        <div className={cn('flex items-center justify-center gap-1 mt-2 text-sm', trendColors[trend])}>
          <span className="text-lg">{trendIcons[trend]}</span>
          <span className="font-medium">
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </span>
        </div>
      )}
    </MobileOptimizedCard>
  )
}
