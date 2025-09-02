'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Onboarding } from '@/onboarding'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const handleComplete = async (payload: Record<string, any>) => {
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
        // Redirect to diagnostic with enhanced user preferences
        router.push('/diagnostic')
      } else {
        throw new Error('Failed to save onboarding data')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      // You can add error handling UI here if needed
    }
  }

  const handleChange = (partial: Record<string, any>) => {
    // Optional: Save progress or analytics
    console.log('Onboarding progress:', partial)
    
    // You can add progress saving logic here
    // localStorage.setItem('onboarding-progress', JSON.stringify(partial))
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your Healing Journey</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's personalize your experience so we can guide you in the most effective way possible.
          </p>
        </div>
        
        <Onboarding 
          onComplete={handleComplete}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}
