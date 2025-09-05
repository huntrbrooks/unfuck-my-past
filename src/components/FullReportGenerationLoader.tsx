'use client'

import React from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Sparkles, 
  Target, 
  Heart, 
  Zap, 
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FullReportGenerationLoaderProps {
  currentStep?: number
  totalSteps?: number
  isGenerating?: boolean
}

export default function FullReportGenerationLoader({ 
  currentStep = 1,
  totalSteps = 5,
  isGenerating = true
}: FullReportGenerationLoaderProps) {
  const progress = (currentStep / totalSteps) * 100

  const steps = [
    {
      icon: Brain,
      title: 'Aggregating your responses',
      description: 'Collecting answers and insights for analysis',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Target,
      title: 'Deriving key insights',
      description: 'Identifying patterns, themes, and priorities',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Heart,
      title: 'Comprehensive analysis',
      description: 'Applying trauma‑informed logic to your data',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Structuring the report',
      description: 'Building sections and actionable recommendations',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Star,
      title: 'Finalising & saving',
      description: 'Preparing your full diagnostic report',
      color: 'from-red-500 to-rose-500'
    }
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-float glow-box-lime">
              <Sparkles className="h-10 w-10 glow-lime spin-slow" />
            </div>
            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full animate-float glow-box-cyan [animation-delay:0.5s]" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full animate-float glow-box-pink [animation-delay:1s]" />
          </div>
          
          <h1 className="text-3xl font-bold key-info neon-heading">
            Creating Your Full Diagnostic Report
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We’re analysing your responses to produce a comprehensive, personalised report
          </p>
        </div>

        {/* Progress */}
        <Card className="glass-card border-0 bg-[#0a0a0a] shadow-[0_0_18px_rgba(204,255,0,0.25)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Progress
              </CardTitle>
              <Badge variant="glass" size="lg">
                Step {currentStep} of {totalSteps}
              </Badge>
            </div>
            
            <Progress 
              value={progress} 
              variant="gradient" 
              size="lg" 
              className="h-3 mb-4" 
            />
            
            <div className="text-center text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index + 1 === currentStep
            const isCompleted = index + 1 < currentStep
            const isPending = index + 1 > currentStep
            
            return (
              <Card 
                key={index}
                className={cn(
                  'border-0 transition-all duration-500',
                  isActive ? 'glass-card shadow-glow' : 'modern-card',
                  isCompleted ? 'opacity-60' : '',
                  isPending ? 'opacity-40' : ''
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                      isActive ? 'scale-110' : '',
                      isCompleted ? '' : '',
                      isPending ? '' : ''
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 glow-lime lime-color" />
                      ) : (
                        <Icon className={cn('h-6 w-6 transition-all duration-300', isActive ? 'glow-lime lime-color' : 'text-muted-foreground')} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          'font-semibold transition-colors duration-300',
                          isActive ? 'text-foreground' : 'text-muted-foreground',
                          isCompleted ? 'text-success' : '',
                          isPending ? 'text-muted-foreground/50' : ''
                        )}>
                          {step.title}
                        </h3>
                        {isActive && (
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                            <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
                            <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                      <p className={cn('text-sm transition-colors duration-300', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                        {step.description}
                      </p>
                    </div>
                    
                    {isActive && (
                      <ArrowRight className="h-5 w-5 text-primary animate-pulse" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Status Message */}
        <Card className="glass-card border-0 text-center bg-[#0a0a0a] shadow-[0_0_18px_rgba(204,255,0,0.25)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                {isGenerating ? 'Generating full report…' : 'Final checks…'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              This usually takes 20–60 seconds. Please don’t refresh the page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


