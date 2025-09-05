'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Onboarding } from '@/onboarding'
import { Heart, Sparkles, Target, Brain, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [hasExisting, setHasExisting] = React.useState(false)

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
      // If this is a redo and user opted out, do nothing
      if (hasExisting && !confirm('Redo onboarding will overwrite your master prompt and related questions. Continue?')) {
        router.push('/dashboard')
        return
      }

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

  // Check if user has existing diagnostics to decide whether to prompt
  React.useEffect(() => {
    (async () => {
      if (!user) return
      try {
        const res = await fetch('/api/diagnostic/responses')
        if (res.ok) {
          const data = await res.json()
          setHasExisting((data.responses?.length || 0) > 0)
          if ((data.responses?.length || 0) > 0) setConfirmOpen(true)
        }
      } catch {}
    })()
  }, [user])

  return (
    <div className="min-h-screen bg-background">
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="rounded-xl glass-card shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">You already completed onboarding</h3>
              <p className="text-muted-foreground mb-6">
                Redoing onboarding will update your master prompt and overwrite previously generated diagnostic questions.
              </p>
              <div className="flex gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-primary text-primary-foreground font-medium flex-1"
                  onClick={() => setConfirmOpen(false)}
                >
                  Proceed
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 border border-border bg-background text-foreground flex-1"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Floating Icons (glow + slow spin) */}
            <div className="relative mb-8">
              <div className="absolute -top-4 -left-4 p-3 animate-float">
                <Heart className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
              </div>
              <div className="absolute -top-2 -right-4 p-3 animate-float-delayed">
                <Sparkles className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
              </div>
              <div className="absolute -bottom-4 left-1/4 p-3 animate-float-slow">
                <Target className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ff6600)' }} />
              </div>
              <div className="absolute -bottom-2 right-1/4 p-3 animate-float-delayed-slow">
                <Brain className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ff1aff)' }} />
              </div>
            </div>

            <h1 className="responsive-heading neon-heading key-info mb-6">
              Welcome to Your Healing Journey
            </h1>
            <p className="responsive-body text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Let&apos;s personalize your experience so we can guide you in the most effective way possible. 
              This will help us create a tailored healing path just for you.
            </p>

            {/* Progress Indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium key-info">Personalization in progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative">
          {/* Background Elements */}
          <div className="absolute inset-0 rounded-3xl opacity-0"></div>
          
          {/* Main Content */}
          <div className="relative bg-background rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Header Bar */}
            <div className="bg-background border-b border-border/50 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold key-info">Personalization Setup</h2>
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
          <div className="inline-flex items-center gap-2 px-6 py-3">
            <Sparkles className="h-4 w-4 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
            <span className="text-sm key-info">Your responses help us create a truly personalized experience</span>
          </div>
        </div>
      </div>
    </div>
  )
}
