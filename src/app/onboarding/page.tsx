'use client'

import React, { useState } from 'react'
import { Container, Row, Col, Card, ProgressBar, Button, Form, Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

interface OnboardingData {
  tone: string
  voice: string
  rawness: string
  depth: string
  learning: string
  engagement: string
  safety: {
    crisisSupport: boolean
    contentWarnings: boolean
    skipTriggers: boolean
  }
  goals: string[]
  experience: string
  timeCommitment: string
}

const onboardingSteps = [
  {
    id: 1,
    title: "What's your communication style?",
    question: "How do you prefer to be spoken to?",
    options: [
      { value: "direct", label: "Direct & straight to the point" },
      { value: "gentle", label: "Gentle & supportive" },
      { value: "raw", label: "Raw & unfiltered" },
      { value: "analytical", label: "Analytical & detailed" }
    ],
    field: "tone"
  },
  {
    id: 2,
    title: "Your learning preference",
    question: "How do you learn best?",
    options: [
      { value: "visual", label: "Visual examples & diagrams" },
      { value: "text", label: "Written explanations" },
      { value: "audio", label: "Voice recordings" },
      { value: "interactive", label: "Interactive exercises" }
    ],
    field: "learning"
  },
  {
    id: 3,
    title: "Content intensity",
    question: "How raw can we get?",
    options: [
      { value: "mild", label: "Keep it light & positive" },
      { value: "moderate", label: "Some real talk, but balanced" },
      { value: "intense", label: "Go deep, no sugar coating" },
      { value: "extreme", label: "Maximum intensity, full truth" }
    ],
    field: "rawness"
  },
  {
    id: 4,
    title: "Exploration depth",
    question: "How deep do you want to go?",
    options: [
      { value: "surface", label: "Surface level insights" },
      { value: "moderate", label: "Moderate depth" },
      { value: "deep", label: "Deep psychological work" },
      { value: "profound", label: "Profound transformation" }
    ],
    field: "depth"
  },
  {
    id: 5,
    title: "Engagement style",
    question: "How do you like to engage?",
    options: [
      { value: "passive", label: "Read & reflect quietly" },
      { value: "active", label: "Active participation" },
      { value: "challenging", label: "Challenge me & push back" },
      { value: "collaborative", label: "Work together as partners" }
    ],
    field: "engagement"
  },
  {
    id: 6,
    title: "Voice preference",
    question: "What voice resonates with you?",
    options: [
      { value: "therapist", label: "Professional therapist" },
      { value: "friend", label: "Supportive friend" },
      { value: "coach", label: "Tough love coach" },
      { value: "mentor", label: "Wise mentor" }
    ],
    field: "voice"
  },
  {
    id: 7,
    title: "Safety & support",
    question: "What safety measures do you need?",
    options: [
      { value: "crisisSupport", label: "Crisis support resources" },
      { value: "contentWarnings", label: "Content warnings" },
      { value: "skipTriggers", label: "Skip triggering content" }
    ],
    field: "safety",
    multiSelect: true
  },
  {
    id: 8,
    title: "Your goals",
    question: "What are you hoping to achieve?",
    options: [
      { value: "healing", label: "Heal from past trauma" },
      { value: "growth", label: "Personal growth" },
      { value: "clarity", label: "Gain clarity & understanding" },
      { value: "change", label: "Change behavior patterns" }
    ],
    field: "goals",
    multiSelect: true
  },
  {
    id: 9,
    title: "Your experience",
    question: "What's your experience with self-help?",
    options: [
      { value: "beginner", label: "New to this journey" },
      { value: "some", label: "Some experience" },
      { value: "experienced", label: "Experienced with therapy/self-help" },
      { value: "advanced", label: "Advanced practitioner" }
    ],
    field: "experience"
  },
  {
    id: 10,
    title: "Time commitment",
    question: "How much time can you commit?",
    options: [
      { value: "5min", label: "5 minutes per day" },
      { value: "15min", label: "15 minutes per day" },
      { value: "30min", label: "30 minutes per day" },
      { value: "1hour", label: "1 hour per day" }
    ],
    field: "timeCommitment"
  }
]

export default function Onboarding() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    // Try to restore onboarding data from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('onboardingData')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Ensure goals is always an array
          if (parsed.goals && !Array.isArray(parsed.goals)) {
            parsed.goals = Object.values(parsed.goals)
          }
          return parsed
        } catch (e) {
          console.error('Failed to parse stored onboarding data:', e)
        }
      }
    }
    
    return {
      tone: '',
      voice: '',
      rawness: '',
      depth: '',
      learning: '',
      engagement: '',
      safety: {
        crisisSupport: false,
        contentWarnings: false,
        skipTriggers: false
      },
      goals: [],
      experience: '',
      timeCommitment: ''
    }
  })

  const currentStepData = onboardingSteps[currentStep]
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100

  const handleOptionSelect = (value: string) => {
    if (currentStepData.multiSelect) {
      // Handle multi-select fields
      if (currentStepData.field === 'safety') {
        setOnboardingData(prev => ({
          ...prev,
          safety: {
            ...prev.safety,
            [value]: !prev.safety[value as keyof typeof prev.safety]
          }
        }))
      } else if (currentStepData.field === 'goals') {
        setOnboardingData(prev => ({
          ...prev,
          goals: prev.goals.includes(value) 
            ? prev.goals.filter(g => g !== value)
            : [...prev.goals, value]
        }))
      }
    } else {
      // Handle single-select fields
      setOnboardingData(prev => ({
        ...prev,
        [currentStepData.field]: value
      }))
    }
  }

  const handleNext = () => {
    console.log('Current step data:', currentStepData)
    console.log('Current onboarding data:', onboardingData)
    
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save onboarding data and proceed to diagnostic
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    // Debug: Log the data being sent
    console.log('Onboarding data being sent:', JSON.stringify(onboardingData, null, 2))
    
    // Check if user is signed in
    if (!isSignedIn) {
      // Store onboarding data in localStorage temporarily
      localStorage.setItem('onboardingData', JSON.stringify(onboardingData))
      // Redirect to sign in
      router.push('/sign-in?redirect=/onboarding')
      return
    }

    try {
      setLoading(true)
      
      // Save onboarding data to database
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }

      // Clear any stored onboarding data
      localStorage.removeItem('onboardingData')
      
      // Generate personalized diagnostic questions (non-blocking)
      fetch('/api/diagnostic/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(questionsResponse => {
        if (questionsResponse.ok) {
          console.log('Personalized questions generated successfully')
        } else {
          console.log('Failed to generate personalized questions, will use fallback')
        }
      })
      .catch(error => {
        console.log('Error generating personalized questions:', error)
      })
      
      // Redirect to diagnostic immediately (don't wait for questions generation)
      router.push('/diagnostic')
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      setError(`Error: ${error instanceof Error ? error.message : 'Failed to save onboarding data'}`)
    } finally {
      setLoading(false)
    }
  }

  // Clear any corrupted localStorage data on component mount
  React.useEffect(() => {
    const stored = localStorage.getItem('onboardingData')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.goals && !Array.isArray(parsed.goals)) {
          // Clear corrupted data
          localStorage.removeItem('onboardingData')
          console.log('Cleared corrupted onboarding data from localStorage')
        }
      } catch (e) {
        // Clear invalid data
        localStorage.removeItem('onboardingData')
        console.log('Cleared invalid onboarding data from localStorage')
      }
    }
  }, [])

  const isOptionSelected = (value: string) => {
    if (currentStepData.multiSelect) {
      if (currentStepData.field === 'safety') {
        return onboardingData.safety[value as keyof typeof onboardingData.safety]
      } else if (currentStepData.field === 'goals') {
        return onboardingData.goals.includes(value)
      }
      return false
    } else {
      return onboardingData[currentStepData.field as keyof OnboardingData] === value
    }
  }

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5">
                {/* Progress */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Step {currentStep + 1} of {onboardingSteps.length}</small>
                    <small className="text-muted">{Math.round(progress)}% complete</small>
                  </div>
                  <ProgressBar now={progress} className="mb-3" />
                </div>

                {/* Error Display */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                    {error}
                  </Alert>
                )}

                {/* Step Content */}
                <div className="text-center mb-4">
                  <h2 className="h3 mb-3">{currentStepData.title}</h2>
                  <p className="text-muted mb-4">{currentStepData.question}</p>
                </div>

                {/* Options */}
                <div className="mb-4">
                  {currentStepData.options.map((option) => (
                    <div key={option.value} className="mb-3">
                      <Button
                        variant={isOptionSelected(option.value) ? "primary" : "outline-primary"}
                        className="w-100 text-start p-3"
                        onClick={() => handleOptionSelect(option.value)}
                      >
                        {option.label}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    Back
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={
                      loading ||
                      (currentStepData.multiSelect 
                        ? (currentStepData.field === 'safety' && !(onboardingData.safety.crisisSupport || onboardingData.safety.contentWarnings || onboardingData.safety.skipTriggers)) ||
                          (currentStepData.field === 'goals' && onboardingData.goals.length === 0)
                        : !onboardingData[currentStepData.field as keyof OnboardingData])
                    }
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {currentStep === onboardingSteps.length - 1 ? 'Completing...' : 'Loading...'}
                      </>
                    ) : (
                      currentStep === onboardingSteps.length - 1 ? 'Complete' : 'Next'
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}
