'use client'

import React from 'react'
import { Onboarding } from '@/onboarding'
import { Heart, Sparkles, Target, Brain } from 'lucide-react'

export default function OnboardingTestPage() {
  const handleComplete = (payload: Record<string, string | string[] | undefined>) => {
    console.log('Onboarding completed with:', payload)
    alert('Onboarding completed! Check console for data.')
  }

  const handleChange = (partial: Record<string, string | string[] | undefined>) => {
    console.log('Onboarding changed:', partial)
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          {/* Floating Elements */}
          <div className="relative mb-6">
            <div className="absolute -top-4 -left-4 p-3 rounded-full bg-primary/10 animate-float">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -top-2 -right-4 p-3 rounded-full bg-accent/10 animate-float-delayed">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="absolute -bottom-4 left-1/4 p-3 rounded-full bg-primary/10 animate-float-slow">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-2 right-1/4 p-3 rounded-full bg-accent/10 animate-float-delayed-slow">
              <Brain className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          
          <h1 className="responsive-heading text-foreground mb-4">New Onboarding Flow Test</h1>
          <p className="responsive-body text-muted-foreground">This is the new config-driven onboarding component</p>
        </div>
        
        <Onboarding 
          onComplete={handleComplete}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}
