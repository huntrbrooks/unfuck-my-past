'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Onboarding } from '@/onboarding'
import { Heart, Sparkles, Target, Brain, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const handleComplete = async (payload: Record<string, string | string[] | undefined>) => {
    try {
      // Transform the new onboarding data to match your existing API structure
      const transformedData = {
        ageBracket: payload.ageBracket || '',
        tone: Array.isArray(payload.tone) ? payload.tone[0] || 'gentle' : payload.tone || 'gentle',
        voice: Array.isArray(payload.guideStyle) ? payload.guideStyle[0] || 'friend' : payload.guideStyle || 'friend',
        rawness: payload.strength || 'moderate',
        depth: payload.depth || 'moderate',
        learning: Array.isArray(payload.learningStyle) ? payload.learningStyle[0] || 'text' : payload.learningStyle || 'text',
        engagement: payload.engagement || 'passive',
        goals: Array.isArray(payload.primaryGoals) ? payload.primaryGoals : [payload.primaryGoals || 'growth'],
        experience: Array.isArray(payload.experienceLevel) ? payload.experienceLevel[0] || 'beginner' : payload.experienceLevel || 'beginner',
        timeCommitment: Array.isArray(payload.timeCommitment) ? payload.timeCommitment[0] || '15min' : payload.timeCommitment || '15min',
        locationPermission: false, // Default to false, can be updated later
        safety: {
          crisisSupport: false,
          contentWarnings: true,
          skipTriggers: true
        },
        // New fields for better AI personalization
        challenges: Array.isArray(payload.challenges) ? payload.challenges : [payload.challenges || ''],
        challengeOther: payload.challengeOther || '',
        freeNote: payload.freeNote || '',
        // Enhanced preferences for AI
        enhancedTone: Array.isArray(payload.tone) ? payload.tone : [payload.tone || 'gentle'],
        enhancedGuideStyle: Array.isArray(payload.guideStyle) ? payload.guideStyle : [payload.guideStyle || 'friend'],
        enhancedLearningStyle: Array.isArray(payload.learningStyle) ? payload.learningStyle : [payload.learningStyle || 'text'],
        enhancedExperienceLevel: Array.isArray(payload.experienceLevel) ? payload.experienceLevel : [payload.experienceLevel || 'beginner'],
        enhancedTimeCommitment: Array.isArray(payload.timeCommitment) ? payload.timeCommitment : [payload.timeCommitment || '15min']
      }

      console.log('Enhanced onboarding data for AI:', transformedData)

      // Send to your existing API
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData)
      })
      
      if (response.ok) {
        // Redirect to diagnostic with generating parameter to show proper loading state
        router.push('/diagnostic?generating=true')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('There was an error saving your preferences. Please try again.')
    }
  }

  const handleChange = (partial: Record<string, string | string[] | undefined>) => {
    // Optional: Save progress or analytics
    console.log('Onboarding progress:', partial)
    
    // You can add progress saving logic here
    // localStorage.setItem('onboarding-progress', JSON.stringify(partial))
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10"></div>
        <div className="relative max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Floating Icons */}
            <div className="relative mb-8">
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

            <h1 className="responsive-heading text-foreground mb-6">
              Welcome to Your Healing Journey
            </h1>
            <p className="responsive-body text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Let&apos;s personalize your experience so we can guide you in the most effective way possible. 
              This will help us create a tailored healing path just for you.
            </p>

            {/* Progress Indicator */}
            <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-4 py-2 border border-accent/30">
              <div className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-accent-foreground">
                Personalization in progress
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl blur-3xl opacity-30"></div>
          
          {/* Main Content */}
          <div className="relative bg-background/80 backdrop-blur-sm rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Personalization Setup</h2>
                  <p className="text-sm text-muted-foreground">Let&apos;s get to know you better</p>
                </div>
              </div>
            </div>

            {/* Form Container */}
            <div className="p-8">
              <Onboarding 
                onComplete={handleComplete}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-6 py-3 border border-border/50">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Your responses help us create a truly personalized experience
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
