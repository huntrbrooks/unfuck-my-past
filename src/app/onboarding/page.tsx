'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Onboarding } from '@/onboarding'
import Image from 'next/image'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [hasExisting, setHasExisting] = React.useState(false)
  type OnboardingSafety = Record<string, any>
  interface OnboardingPayload {
    ageBracket?: string | string[]
    tone: string
    voice: string
    rawness: string | string[]
    depth: string | string[]
    learning: string
    engagement: string | string[]
    goals: string[]
    experience: string
    timeCommitment: string
    locationPermission: boolean
    safety: OnboardingSafety
    // Extended personalization fields
    primaryFocus?: string
    timePerDay?: string
    attentionSpan?: string
    inputMode?: string
    flags?: string[]
    scheduleNote?: string | string[]
    stressLevel?: string
    sleepQuality?: string
    rumination?: string
    topicsToAvoid?: string[]
    triggerWords?: string | string[]
    challenges: string[]
    challengeOther: string | string[]
    freeNote: string | string[]
    finalNote?: string | string[]
    anonymizedDataOK?: boolean
    exportPromiseShown?: boolean
    // Enhanced preferences for AI
    enhancedTone: string[]
    enhancedGuideStyle: string[]
    enhancedLearningStyle: string[]
    enhancedExperienceLevel: string[]
    enhancedTimeCommitment: string[]
  }
  const [pendingData, setPendingData] = React.useState<OnboardingPayload | null>(null)

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const submitOnboarding = async (transformedData: OnboardingPayload) => {
    try {
      // Send to your existing API
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData)
      })
      
      if (response.ok) {
        console.log('✅ Onboarding API call successful, redirecting to diagnostic with loader...')
        
        // Set localStorage flag as fallback detection mechanism
        localStorage.setItem('just-completed-onboarding', 'true')
        
        // Add a smooth fade-out transition before redirecting
        const onboardingContainer = document.querySelector('.onboarding-container')
        if (onboardingContainer) {
          onboardingContainer.classList.add('opacity-0', 'transition-opacity', 'duration-500')
        }
        
        // Redirect after a brief delay to allow smooth transition
        setTimeout(() => {
          router.push('/diagnostic?generating=true')
        }, 300) // Short delay for smooth transition
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('There was an error saving your preferences. Please try again.')
    } finally {
      setPendingData(null)
      setConfirmOpen(false)
    }
  }

  const handleComplete = async (payload: Record<string, string | string[] | undefined>) => {
    try {
      // Helpers
      const toLower = (v: string | undefined) => (v || '').toString().toLowerCase();
      const firstOf = (v: string | string[] | undefined, fallback: string) => Array.isArray(v) ? (v[0] || fallback) : (v || fallback);
      const mapGuideStyle = (v: string) => v.replace(/-style/i, '').toLowerCase();
      const mapTime = (v: string) => {
        const s = v.toLowerCase();
        if (s.includes('5')) return '5min';
        if (s.includes('15')) return '15min';
        if (s.includes('30')) return '30min';
        if (s.includes('60') || s.includes('1 hour') || s.includes('1hour')) return '1hour';
        return '15min';
      };

      // Transform to match existing API structure while preserving richer data
      const transformedData: OnboardingPayload = {
        ageBracket: '',
        tone: firstOf(payload.tone, 'gentle'),
        voice: mapGuideStyle(firstOf(payload.guideStyle, 'friend')),
        rawness: firstOf(payload.strength, 'moderate'),
        depth: firstOf(payload.depth, 'moderate'),
        learning: toLower(firstOf(payload.learningStyle, 'text')),
        engagement: firstOf(payload.engagement, 'passive'),
        goals: Array.isArray(payload.primaryGoals) ? payload.primaryGoals as string[] : [firstOf(payload.primaryGoals, 'growth')],
        experience: 'beginner',
        timeCommitment: mapTime(firstOf(payload.timePerDay, '15 minutes')),
        locationPermission: false,
        safety: {
          consentToProceed: firstOf(payload.consentToProceed, 'Agree') === 'Agree',
          agreeDisclaimer: firstOf(payload.agreeDisclaimer, 'Agree') === 'Agree',
          topicsToAvoid: Array.isArray(payload.topicsToAvoid) ? payload.topicsToAvoid : (payload.topicsToAvoid ? [payload.topicsToAvoid as string] : []),
          triggerWords: firstOf(payload.triggerWords, ''),
          flags: Array.isArray(payload.flags) ? payload.flags : (payload.flags ? [payload.flags as string] : []),
          primaryFocus: firstOf(payload.primaryFocus, ''),
          attentionSpan: firstOf(payload.attentionSpan, ''),
          inputMode: firstOf(payload.inputMode, ''),
          baselines: {
            stress: firstOf(payload.stressLevel, ''),
            sleep: firstOf(payload.sleepQuality, ''),
            rumination: firstOf(payload.rumination, '')
          },
          anonymizedDataOK: firstOf(payload.anonymizedDataOK as any, 'No') === 'Yes',
          exportPromiseShown: firstOf(payload.exportPromiseShown as any, 'Yes') === 'Yes'
        },
        // Additional fields for analytics/AI
        primaryFocus: firstOf(payload.primaryFocus, ''),
        timePerDay: firstOf(payload.timePerDay, ''),
        attentionSpan: firstOf(payload.attentionSpan, ''),
        inputMode: firstOf(payload.inputMode, ''),
        flags: Array.isArray(payload.flags) ? payload.flags as string[] : (payload.flags ? [payload.flags as string] : []),
        scheduleNote: firstOf(payload.scheduleNote, ''),
        stressLevel: firstOf(payload.stressLevel, ''),
        sleepQuality: firstOf(payload.sleepQuality, ''),
        rumination: firstOf(payload.rumination, ''),
        topicsToAvoid: Array.isArray(payload.topicsToAvoid) ? payload.topicsToAvoid as string[] : (payload.topicsToAvoid ? [payload.topicsToAvoid as string] : []),
        triggerWords: firstOf(payload.triggerWords, ''),
        challenges: Array.isArray(payload.challenges) ? payload.challenges as string[] : [firstOf(payload.challenges, '')],
        challengeOther: firstOf(payload.challengeOther, ''),
        freeNote: firstOf(payload.finalNote ?? payload.freeNote, ''),
        finalNote: firstOf(payload.finalNote, ''),
        anonymizedDataOK: firstOf(payload.anonymizedDataOK as any, 'No') === 'Yes',
        exportPromiseShown: firstOf(payload.exportPromiseShown as any, 'Yes') === 'Yes',
        // Enhanced preferences for AI
        enhancedTone: Array.isArray(payload.tone) ? (payload.tone as string[]) : [firstOf(payload.tone, 'gentle')],
        enhancedGuideStyle: Array.isArray(payload.guideStyle) ? (payload.guideStyle as string[]) : [firstOf(payload.guideStyle, 'friend')],
        enhancedLearningStyle: Array.isArray(payload.learningStyle) ? (payload.learningStyle as string[]) : [firstOf(payload.learningStyle, 'text')],
        enhancedExperienceLevel: ['beginner'],
        enhancedTimeCommitment: [mapTime(firstOf(payload.timePerDay, '15 minutes'))]
      }

      console.log('Enhanced onboarding data for AI:', transformedData)

      // If this is a redo, show themed confirmation and queue the payload
      if (hasExisting) {
        setPendingData(transformedData)
        setConfirmOpen(true)
        return
      }

      await submitOnboarding(transformedData)
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

  // Check if user has existing diagnostics to decide whether to prompt
  React.useEffect(() => {
    (async () => {
      if (!user) return
      try {
        const res = await fetch('/api/diagnostic/responses')
        if (res.ok) {
          const data = await res.json()
          setHasExisting((data.responses?.length || 0) > 0)
        }
      } catch {}
    })()
  }, [user])

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
    <div className="onboarding-container min-h-screen bg-background transition-opacity duration-500">
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="glass-card border border-border/50 shadow-2xl w-full max-w-md mx-4">
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="relative">
                  <Image 
                    src="/Line_art3-01.png" 
                    alt="warning art" 
                    width={64} 
                    height={64} 
                    className="w-16 h-auto drop-shadow-[0_0_18px_#ff6600] animate-float" 
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold key-info neon-heading mb-2 [text-shadow:0_0_28px_rgba(204,255,0,0.9),0_0_56px_rgba(204,255,0,0.6),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)] [-webkit-text-stroke:1px_rgba(0,0,0,0.25)]">
                Already Completed Onboarding
              </h3>

              {/* Message */}
              <div className="bg-muted/20 rounded-lg p-4 mb-6 border border-border/30">
                <p className="text-foreground text-sm leading-relaxed">
                  <strong>Redo onboarding will overwrite your master prompt and related questions.</strong>
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  This will update your personalization settings and regenerate your diagnostic questions based on your new preferences.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="neon-cta flex-1 py-3 px-6 text-base font-semibold"
                  onClick={() => {
                    if (pendingData) {
                      submitOnboarding(pendingData)
                    } else {
                      setConfirmOpen(false)
                    }
                  }}
                >
                  Continue & Overwrite
                </button>
                <button
                  className="flex-1 py-3 px-6 text-base font-medium rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 transition-colors"
                  onClick={() => router.push('/dashboard')}
                >
                  Keep Current Settings
                </button>
              </div>

              {/* Info note */}
              <p className="text-muted-foreground text-xs mt-4">
                You can always update your preferences later in the dashboard
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-6xl mx-auto pt-28 pb-16 px-4 sm:pt-20 sm:pb-16 sm:px-6 lg:pt-16 lg:px-8">
          <div className="text-center">
            <div className="relative mb-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="block animate-float">
                <Image src="/Line_art-02.png" alt="left art" width={135} height={270} className="w-24 sm:w-[135px] h-auto drop-shadow-[0_0_20px_rgba(0,229,255,0.85)]" />
              </div>
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 text-[var(--neon-cta,#ccff00)] [text-shadow:0_0_28px_rgba(204,255,0,0.9),0_0_56px_rgba(204,255,0,0.65),1px_1px_0_rgba(0,0,0,0.65),-1px_-1px_0_rgba(0,0,0,0.65)] [-webkit-text-stroke:1px_rgba(0,0,0,0.35)] sm:whitespace-nowrap">
                  You came here for answers.
                </h1>
                <p className="text-lg sm:text-2xl font-semibold text-[var(--neon-cta,#ccff00)] [text-shadow:0_0_18px_rgba(204,255,0,0.7),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)] [-webkit-text-stroke:0.5px_rgba(0,0,0,0.25)]">
                  Let’s start by asking the right questions.
                </p>
              </div>
              <div className="hidden sm:block animate-float-delayed">
                <Image src="/Line_art2-04.png" alt="right art" width={135} height={270} className="w-[135px] h-auto drop-shadow-[0_0_20px_rgba(255,0,128,0.85)]" />
              </div>
            </div>
            <p className="responsive-body text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              First things first: we need to know how you want this to hit. Tough love or gentle push? Raw truth or soft landing? You choose, we adapt.
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
          <div id="onboarding-card-top" className="relative bg-background rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
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
