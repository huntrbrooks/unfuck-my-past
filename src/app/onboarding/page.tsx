'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react'

interface OnboardingData {
  ageBracket: string
  tone: string
  voice: string
  rawness: string
  depth: string
  learning: string
  engagement: string
  goals: string[]
  experience: string
  timeCommitment: string
  locationPermission: boolean
  safety: {
    crisisSupport: boolean
    contentWarnings: boolean
    skipTriggers: boolean
  }
}

export default function Onboarding() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionProgress, setSubmissionProgress] = useState(0)
  
  const [formData, setFormData] = useState<OnboardingData>({
    ageBracket: '',
    tone: 'gentle',
    voice: 'friend',
    rawness: 'moderate',
    depth: 'moderate',
    learning: 'text',
    engagement: 'passive',
    goals: [],
    experience: 'beginner',
    timeCommitment: '15min',
    locationPermission: false,
    safety: {
      crisisSupport: false,
      contentWarnings: true,
      skipTriggers: true
    }
  })

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('') // Clear any previous errors
  }

  const handleSafetyChange = (field: keyof OnboardingData['safety'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      safety: {
        ...prev.safety,
        [field]: value
      }
    }))
    setError('') // Clear any previous errors
  }

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
    setError('') // Clear any previous errors
  }

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
      setError('') // Clear errors when moving to next step
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('') // Clear errors when moving to previous step
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    // Validate required fields
    if (!formData.ageBracket) {
      setError('Please select your age bracket')
      return
    }
    
    if (formData.goals.length === 0) {
      setError('Please select at least one goal')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSubmissionProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSubmissionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        }),
      })

      clearInterval(progressInterval)
      setSubmissionProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }

             // Add a longer delay to give GPT-4.1 time to analyze and generate questions
       await new Promise(resolve => setTimeout(resolve, 3000))
       
       router.push('/diagnostic?generating=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setSubmissionProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of 6
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 6) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / 6) * 100} className="w-full" />
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Progress */}
        {isSubmitting && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                 <h3 className="text-lg font-semibold mb-2">Processing Your Preferences</h3>
                 <p className="text-gray-600 mb-4">
                   Analyzing your responses with GPT-4.1 and generating personalized questions...
                 </p>
                <Progress value={submissionProgress} className="w-full mb-2" />
                <p className="text-sm text-gray-500">{submissionProgress}% complete</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'How would you like to communicate?'}
              {currentStep === 3 && 'What are your goals?'}
              {currentStep === 4 && 'What\'s your experience level?'}
              {currentStep === 5 && 'Location & Personalization'}
              {currentStep === 6 && 'Safety & Preferences'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Age Bracket */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What age bracket do you fall into?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['18-25', '26-35', '36-45', '46-55', '56-65', '65+'].map(age => (
                      <Button
                        key={age}
                        variant={formData.ageBracket === age ? 'default' : 'outline'}
                        onClick={() => handleInputChange('ageBracket', age)}
                        className="capitalize"
                      >
                        {age}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Communication Preferences */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Communication Tone
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['gentle', 'direct', 'coaching', 'casual'].map(tone => (
                      <Button
                        key={tone}
                        variant={formData.tone === tone ? 'default' : 'outline'}
                        onClick={() => handleInputChange('tone', tone)}
                        className="capitalize"
                      >
                        {tone}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Voice Style
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['friend', 'mentor', 'therapist', 'coach'].map(voice => (
                      <Button
                        key={voice}
                        variant={formData.voice === voice ? 'default' : 'outline'}
                        onClick={() => handleInputChange('voice', voice)}
                        className="capitalize"
                      >
                        {voice}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Content Intensity
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['mild', 'moderate', 'intense'].map(rawness => (
                      <Button
                        key={rawness}
                        variant={formData.rawness === rawness ? 'default' : 'outline'}
                        onClick={() => handleInputChange('rawness', rawness)}
                        className="capitalize"
                      >
                        {rawness}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Exploration Depth
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['surface', 'moderate', 'deep', 'profound'].map(depth => (
                      <Button
                        key={depth}
                        variant={formData.depth === depth ? 'default' : 'outline'}
                        onClick={() => handleInputChange('depth', depth)}
                        className="capitalize"
                      >
                        {depth}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What are your primary goals? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'healing', 'growth', 'self-discovery', 'trauma-recovery',
                      'relationships', 'confidence', 'peace', 'purpose'
                    ].map(goal => (
                      <Button
                        key={goal}
                        variant={formData.goals.includes(goal) ? 'default' : 'outline'}
                        onClick={() => handleGoalToggle(goal)}
                        className="capitalize"
                      >
                        {goal.replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Learning Style
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['text', 'interactive', 'visual', 'audio'].map(learning => (
                      <Button
                        key={learning}
                        variant={formData.learning === learning ? 'default' : 'outline'}
                        onClick={() => handleInputChange('learning', learning)}
                        className="capitalize"
                      >
                        {learning}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Engagement Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['passive', 'moderate', 'active'].map(engagement => (
                      <Button
                        key={engagement}
                        variant={formData.engagement === engagement ? 'default' : 'outline'}
                        onClick={() => handleInputChange('engagement', engagement)}
                        className="capitalize"
                      >
                        {engagement}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Experience Level
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'beginner', label: 'Beginner - New to healing work' },
                      { value: 'intermediate', label: 'Intermediate - Some experience' },
                      { value: 'experienced', label: 'Experienced - Regular practice' }
                    ].map(exp => (
                      <Button
                        key={exp.value}
                        variant={formData.experience === exp.value ? 'default' : 'outline'}
                        onClick={() => handleInputChange('experience', exp.value)}
                        className="w-full justify-start text-left h-auto p-4"
                      >
                        <div>
                          <div className="font-medium capitalize">{exp.value}</div>
                          <div className="text-sm opacity-80">{exp.label}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Time Commitment
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['5min', '15min', '30min', '60min'].map(time => (
                      <Button
                        key={time}
                        variant={formData.timeCommitment === time ? 'default' : 'outline'}
                        onClick={() => handleInputChange('timeCommitment', time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Location & Personalization */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Location Access for Weather Personalization
                  </label>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Personalized Weather Insights</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Allow location access to get personalized weather recommendations for your healing practice. 
                          This will enhance your daily program with weather-specific guidance and seasonal practices.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant={formData.locationPermission ? 'default' : 'outline'}
                            onClick={() => handleInputChange('locationPermission', true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Enable Location Access
                          </Button>
                          <Button
                            variant={!formData.locationPermission ? 'default' : 'outline'}
                            onClick={() => handleInputChange('locationPermission', false)}
                          >
                            Skip for Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Safety */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Safety Preferences
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Content Warnings</div>
                        <div className="text-sm text-gray-600">Get warned about potentially triggering content</div>
                      </div>
                      <Button
                        variant={formData.safety.contentWarnings ? 'default' : 'outline'}
                        onClick={() => handleSafetyChange('contentWarnings', !formData.safety.contentWarnings)}
                        size="sm"
                      >
                        {formData.safety.contentWarnings ? 'On' : 'Off'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Skip Triggers</div>
                        <div className="text-sm text-gray-600">Skip content that might be triggering</div>
                      </div>
                      <Button
                        variant={formData.safety.skipTriggers ? 'default' : 'outline'}
                        onClick={() => handleSafetyChange('skipTriggers', !formData.safety.skipTriggers)}
                        size="sm"
                      >
                        {formData.safety.skipTriggers ? 'On' : 'Off'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Crisis Support</div>
                        <div className="text-sm text-gray-600">Access to crisis resources if needed</div>
                      </div>
                      <Button
                        variant={formData.safety.crisisSupport ? 'default' : 'outline'}
                        onClick={() => handleSafetyChange('crisisSupport', !formData.safety.crisisSupport)}
                        size="sm"
                      >
                        {formData.safety.crisisSupport ? 'On' : 'Off'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button onClick={nextStep} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || formData.goals.length === 0}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
