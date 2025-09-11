'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Mic, Pencil, CheckCircle, Bot, Target, Sparkles, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '../../components/LoadingSpinner'
import VoiceRecorder from '../../components/VoiceRecorder'
import QuestionGenerationLoader from '../../components/QuestionGenerationLoader'
import { DiagnosticQuestion } from '../../lib/diagnostic-questions'
type HSIQuestion = { id: number; text: string }

interface DiagnosticResponse {
  question: DiagnosticQuestion
  response: string
  insight: string
  model: string
  timestamp: string
}

export default function Diagnostic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<DiagnosticResponse[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [error, setError] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  // Removed userPreferences state as it's not currently used
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [loaderStep, setLoaderStep] = useState(1)
  const [showReadyPrompt, setShowReadyPrompt] = useState(false)
  // HSI (Hidden Struggles Index) state
  const [hsiQuestions, setHsiQuestions] = useState<HSIQuestion[]>([])
  const [hsiAnswers, setHsiAnswers] = useState<Record<number, boolean>>({})
  const [hsiSaving, setHsiSaving] = useState(false)
  const [hsiSaved, setHsiSaved] = useState(false)
  const [hsiError, setHsiError] = useState<string | null>(null)
  const [collapsedOptions, setCollapsedOptions] = useState<Record<number, boolean>>({})

  useEffect(() => {
    // Check if we're coming from onboarding with generating=true
    console.log('🔍 DIAGNOSTIC PAGE: useEffect running')
    console.log('🔍 Search params object:', searchParams)
    console.log('🔍 Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
    
    // Try multiple ways to detect the generating parameter
    const isGeneratingFromParams = searchParams.get('generating') === 'true'
    const isGeneratingFromURL = typeof window !== 'undefined' ? window.location.search.includes('generating=true') : false
    const isGeneratingFromHash = typeof window !== 'undefined' ? window.location.hash.includes('generating=true') : false
    const isGenerating = isGeneratingFromParams || isGeneratingFromURL || isGeneratingFromHash
    
    console.log('🔍 isGeneratingFromParams:', isGeneratingFromParams)
    console.log('🔍 isGeneratingFromURL:', isGeneratingFromURL) 
    console.log('🔍 isGeneratingFromHash:', isGeneratingFromHash)
    console.log('🔍 isGenerating (final):', isGenerating)
    
    if (isGenerating) {
      console.log('🎯 ONBOARDING FLOW: Starting beautiful loader progression')
      // Mark that we've detected the onboarding completion
      if (typeof window !== 'undefined') {
        localStorage.setItem('just-completed-onboarding', 'true')
      }
      
      // Add smooth fade-in transition for the diagnostic page
      const diagnosticContainer = document.querySelector('.diagnostic-container')
      if (diagnosticContainer) {
        diagnosticContainer.classList.add('opacity-0')
        setTimeout(() => {
          diagnosticContainer.classList.remove('opacity-0')
          diagnosticContainer.classList.add('opacity-100', 'transition-opacity', 'duration-500')
        }, 100) // Brief delay to ensure smooth transition
      }
      
      // Clear any existing questions to ensure loader shows
      setQuestions([])
      setError('')
      setIsGeneratingQuestions(true)
      setShowLoader(true)
      setLoaderStep(1)
      
      // Start loader step progression over 20 seconds (4 seconds per step)
      const stepInterval = setInterval(() => {
        setLoaderStep(prev => {
          const nextStep = prev < 5 ? prev + 1 : prev
          console.log('🎯 Advancing loader step from', prev, 'to', nextStep)
          return nextStep
        })
      }, 4000) // 4 seconds per step for 5 steps = 20 seconds total
      
      // Create ref object to pass to generatePersonalizedQuestions
      const stepIntervalRef = { current: stepInterval }
      generatePersonalizedQuestions(stepIntervalRef)
      
      // Clean up the URL
      window.history.replaceState({}, '', '/diagnostic')
      
      // Hide loader after exactly 20 seconds (when progression completes)
      const loaderTimeout = setTimeout(() => {
        console.log('🎯 20-second progression complete, prompting to begin')
        setShowReadyPrompt(true)
        clearInterval(stepInterval)
      }, 20000) // 20 second progression
      
      // Fallback timeout in case something goes wrong with question generation
      const fallbackTimeout = setTimeout(() => {
        console.log('⚠️ Fallback: Generation took too long, trying to load existing questions...')
        setShowLoader(false)
        setIsGeneratingQuestions(false)
        clearInterval(stepInterval)
        loadQuestions()
      }, 60000) // 60 second fallback timeout
      
      return () => {
        clearTimeout(loaderTimeout)
        clearTimeout(fallbackTimeout)
        clearInterval(stepInterval)
      }
    } else {
      console.log('🔍 NOT generating - normal page load')
      
      // Check if user just completed onboarding (fallback mechanism)
      const checkRecentOnboarding = async () => {
        try {
          // First check localStorage for recent completion
          const justCompleted = typeof window !== 'undefined' ? localStorage.getItem('just-completed-onboarding') : null
          if (justCompleted === 'true') {
            console.log('🎯 Fallback detection: Found localStorage flag, starting loader...')
            localStorage.removeItem('just-completed-onboarding') // Clear the flag
            
            setQuestions([])
            setError('')
            setIsGeneratingQuestions(true)
            setShowLoader(true)
            setLoaderStep(1)
            
            const stepInterval = setInterval(() => {
              setLoaderStep(prev => prev < 5 ? prev + 1 : prev)
            }, 4000)
            
            const stepIntervalRef = { current: stepInterval }
            generatePersonalizedQuestions(stepIntervalRef)
            
            setTimeout(() => {
              setShowReadyPrompt(true)
              clearInterval(stepInterval)
            }, 20000)
            
            return
          }
          
          // Then check API status as secondary fallback
          const onboardingResponse = await fetch('/api/onboarding')
          if (onboardingResponse.ok) {
            const questionsResponse = await fetch('/api/diagnostic/questions')
            
            // If user has onboarding data but no questions, they likely just finished onboarding
            if (!questionsResponse.ok && questionsResponse.status === 429) {
              console.log('🎯 FALLBACK: User has onboarding but questions are generating - starting loader')
              setQuestions([])
              setError('')
              setIsGeneratingQuestions(true)
              setShowLoader(true)
              setLoaderStep(1)
              
              const stepInterval = setInterval(() => {
                setLoaderStep(prev => prev < 5 ? prev + 1 : prev)
              }, 4000)
              
              const stepIntervalRef = { current: stepInterval }
              generatePersonalizedQuestions(stepIntervalRef)
              
              setTimeout(() => {
                setShowReadyPrompt(true)
                clearInterval(stepInterval)
              }, 20000)
              
              return
            }
          }
        } catch (error) {
          console.log('Could not check onboarding status:', error)
        }
      }
      
      // Load questions on component mount
      if (questions.length === 0 && !isLoadingQuestions && !loading) {
        console.log('Loading questions on mount...')
        checkRecentOnboarding().then(() => {
          // Only load questions if we didn't start the loader
          if (!showLoader) {
            loadQuestions()
          }
        })
      }
    }
  }, []) // run once on mount; we manually clear the URL below

  // Show loader if we're generating questions
  useEffect(() => {
    if (isGeneratingQuestions) {
      setShowLoader(true)
    }
  }, [isGeneratingQuestions])

  // Auto-mark multiple-choice blocks as closed for answered questions
  useEffect(() => {
    setCollapsedOptions(prev => {
      if (responses.length === 0) return prev
      const next = { ...prev }
      for (let i = 0; i < responses.length; i++) {
        next[i] = true
      }
      return next
    })
  }, [responses.length])

  const loadQuestions = async (retryCount = 0) => {
    // Prevent multiple simultaneous requests
    if (isLoadingQuestions) {
      console.log('Questions already loading, skipping duplicate request')
      return
    }
    
    setIsLoadingQuestions(true)
    setLoading(true)
    setError('')
    
    try {
      console.log('Loading diagnostic questions...')
      const response = await fetch('/api/diagnostic/questions')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error('Please sign in to access your personalized diagnostic questions')
        }
        if (response.status === 429) {
          // If it's a 429 error and we haven't retried too many times, retry after a delay
          if (retryCount < 3) {
            console.log(`Questions are being generated, retrying in ${(retryCount + 1) * 2} seconds...`)
            setError(`Questions are being personalized for you, please wait...`)
            setTimeout(() => {
              loadQuestions(retryCount + 1)
            }, (retryCount + 1) * 2000) // 2s, 4s, 6s delays
            return
          }
          throw new Error('Questions are taking longer than expected to generate. Please try refreshing the page.')
        }
        throw new Error(errorData.error || 'Failed to load questions')
      }

      const data = await response.json()
      console.log('Questions loaded:', data.questions?.length || 0)
      // Client-side dedupe by text to prevent accidental duplicates in UI
      const deduped = Array.isArray(data.questions) ? dedupeQuestionsByText(data.questions) : []
      if (deduped.length > 0) {
        setQuestions(deduped)
        // Load HSI questions if provided; otherwise fetch separately
        if (data.hsi?.questions && Array.isArray(data.hsi.questions)) {
          setHsiQuestions(data.hsi.questions as HSIQuestion[])
        } else {
          try { await loadHSIQuestions() } catch {}
        }
        // setUserPreferences(data.userPreferences) // Currently unused
      } else {
        throw new Error('No questions found. Please try generating personalized questions.')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      setError(error instanceof Error ? error.message : 'Failed to load questions')
    } finally {
      setIsLoadingQuestions(false)
      setLoading(false)
    }
  }

  async function loadHSIQuestions() {
    try {
      const r = await fetch('/api/diagnostic/hsi')
      if (r.ok) {
        const j = await r.json()
        if (Array.isArray(j.questions)) setHsiQuestions(j.questions as HSIQuestion[])
      }
    } catch (e) {
      // best-effort; ignore
    }
  }

  function dedupeQuestionsByText(qs: DiagnosticQuestion[]): DiagnosticQuestion[] {
    const seen = new Set<string>()
    const out: DiagnosticQuestion[] = []
    for (const q of qs) {
      const norm = (q.question || '').toLowerCase().replace(/\s+/g, ' ').replace(/[\.,!?;:()\[\]\-_'"`]/g, '').trim()
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        out.push(q)
      }
    }
    return out
  }

  function toggleHSI(id: number, value: boolean) {
    setHsiAnswers(prev => ({ ...prev, [id]: value }))
    setHsiSaved(false)
    setHsiError(null)
  }

  async function saveHSI() {
    try {
      setHsiSaving(true)
      setHsiError(null)
      const trueIds = Object.entries(hsiAnswers).filter(([,v]) => !!v).map(([k]) => Number(k))
      const r = await fetch('/api/diagnostic/hsi', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ trueIds }) })
      if (!r.ok) {
        const j = await r.json().catch(()=>({}))
        throw new Error(j.error || 'Failed to save')
      }
      setHsiSaved(true)
    } catch (e) {
      setHsiError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setHsiSaving(false)
    }
  }

  const generatePersonalizedQuestions = async (stepIntervalRef?: { current: NodeJS.Timeout | null }) => {
    setLoading(true)
    setError('')
    
    try {
      // Re-engage paywall by clearing previous diagnostic data and deactivating prior diagnostic purchase
      try {
        await fetch('/api/diagnostic/reset', { method: 'POST' })
      } catch {}

      const response = await fetch('/api/diagnostic/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate questions')
      }

      const data = await response.json()
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        // setUserPreferences(data.userPreferences) // Currently unused
        setError('')
        console.log('🎯 Questions loaded successfully:', data.questions.length, 'questions')
        
        // Clear the step interval since questions are ready
        if (stepIntervalRef?.current) {
          clearInterval(stepIntervalRef.current)
          stepIntervalRef.current = null
        }
        
        // Jump to final step and show ready prompt immediately
        setLoaderStep(5)
        setTimeout(() => {
          setShowReadyPrompt(true)
        }, 1000) // Small delay for visual effect
      } else {
        throw new Error('No questions were generated. Please try again.')
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate questions')
      // Hide loader on error (but let the interval continue in case user retries)
      setShowLoader(false)
      setIsGeneratingQuestions(false)
    } finally {
      setLoading(false)
    }
  }

  // Wrapper for button clicks
  const handleGenerateQuestions = () => {
    generatePersonalizedQuestions()
  }

  // These functions are used by QuestionGenerationLoader when it's properly configured
  // const handleQuestionsReady = () => {
  //   setShowLoader(false)
  //   setIsGeneratingQuestions(false)
  //   loadQuestions()
  // }

  // const handleRetryGeneration = () => {
  //   setShowLoader(false)
  //   setIsGeneratingQuestions(false)
  //   generatePersonalizedQuestions()
  // }

  const testAIServices = async () => {
    try {
      const message = await fetch('/api/diagnostic/test-ai', {
        method: 'POST',
      }).then(res => res.json()).then(data => data.message)
      
      alert(message)
    } catch (error) {
      console.error('Error testing AI services:', error)
      alert('Failed to test AI services')
    }
  }

  const handleSubmitResponse = async () => {
    if (!currentResponse.trim()) return

    setGeneratingInsight(true)
    try {
      const currentQuestion = questions[currentQuestionIndex]
      
      const response = await fetch('/api/diagnostic/insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          response: currentResponse,
          useClaude: false // Use OpenAI only for now
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate insight')
      }

      const insightData = await response.json()
      
      const newResponse: DiagnosticResponse = {
        question: currentQuestion,
        response: currentResponse,
        insight: insightData.insight,
        model: insightData.model,
        timestamp: insightData.timestamp
      }

      setResponses([...responses, newResponse])
      setCurrentResponse('')
      
      if (currentQuestionIndex < questions.length - 1) {
        // Auto-close options for the completed question (if it was multiple-choice)
        setCollapsedOptions(prev => ({ ...prev, [currentQuestionIndex]: true }))
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // All questions answered, generate summary
        await generateSummary()
      }
    } catch (error) {
      setError('Failed to generate insight. Please try again.')
      console.error('Error generating insight:', error)
    } finally {
      setGeneratingInsight(false)
    }
  }

  const handleVoiceTranscription = (transcript: string) => {
    setCurrentResponse(transcript)
    setVoiceError(null)
  }

  const handleVoiceError = (error: string) => {
    setVoiceError(error)
  }

  const generateSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/diagnostic/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const summaryData = await response.json()
      
      if (!summaryData.summary) {
        throw new Error('No summary generated. Please try again.')
      }
      
      // Redirect to results page
      router.push('/diagnostic/results')
    } catch (error) {
      setError(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error generating summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = responses.length
  let progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0
  if (generatingInsight && currentQuestionIndex === questions.length - 1) {
    progress = 100
  }

  console.log('🔍 Diagnostic page state:', {
    questionsLength: questions.length,
    currentQuestionIndex,
    currentQuestion: currentQuestion?.question,
    loading,
    error,
    isLoadingQuestions,
    showLoader,
    isGeneratingQuestions,
    loaderStep
  })

  // Mobile-only auto scroll to the top of the question card when questions load or index changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (questions.length === 0) return
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    if (!isMobile) return
    const target = document.getElementById('diagnostic-question-top')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [questions.length, currentQuestionIndex])

  // Show the beautiful loader when generating questions (HIGHEST PRIORITY)
  if (showLoader) {
    console.log('🎯 RENDERING: Beautiful loader with step', loaderStep)
    return (
      <>
        <QuestionGenerationLoader
          currentStep={loaderStep}
          totalSteps={5}
          isGenerating={isGeneratingQuestions}
        />

        {showReadyPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="rounded-xl glass-card shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 neon-heading">Preference analysis complete</h3>
                <p className="text-muted-foreground mb-6">Are you ready to begin?</p>
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      console.log('🎯 User clicked "Yes, let\'s start" - beginning diagnostic')
                      setShowReadyPrompt(false)
                      setShowLoader(false)
                      setIsGeneratingQuestions(false)
                      // If we don't have questions loaded yet, try to load them
                      if (questions.length === 0) {
                        console.log('🔄 No questions loaded, attempting to load...')
                        loadQuestions()
                      }
                    }}
                  >
                    Yes, let's start
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      // Persist a simple flag locally so the nav can route to questions next visit
                      try {
                        localStorage.setItem('uyp_has_ready_questions', 'true')
                      } catch {}
                      setShowReadyPrompt(false)
                      setShowLoader(false)
                      setIsGeneratingQuestions(false)
                      // Stay on page; user can return later via Continue Journey
                    }}
                  >
                    Continue later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (loading && questions.length === 0) {
    console.log('🔄 RENDERING: Basic loading spinner (should not happen when coming from onboarding)')
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8">
              <LoadingSpinner 
                size="lg" 
                text="Loading your personalized questions..." 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <h3 className="text-lg font-semibold text-destructive">Error</h3>
                </div>
                <p className="text-destructive/80 mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => loadQuestions()}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleGenerateQuestions}>
                    Generate Personalized Questions
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      // Ask for confirmation before clearing data
                      const proceed = confirm('Are you sure you want to proceed? If yes, all previous diagnostic data will be deleted and payment will be required again.')
                      if (!proceed) return
                      try {
                        const res = await fetch('/api/diagnostic/reset', { method: 'POST' })
                        if (!res.ok) throw new Error('Reset failed')
                        // After reset, send user to dashboard
                        router.push('/dashboard')
                      } catch (e) {
                        setError('Failed to reset previous data. Please try again.')
                      }
                    }}
                  >
                    Start Fresh
                  </Button>
                  <Button variant="outline" onClick={testAIServices}>
                    Test AI Services
                  </Button>
                  {error.includes('sign in') && (
                    <Button onClick={() => router.push('/sign-in?redirect=/diagnostic')}>
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // If we have no questions and no error, show a message
  if (!loading && questions.length === 0 && !error && !showLoader && !showReadyPrompt) {
    return (
      <div className="min-h-screen-dvh bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-6">
                  <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
                  <h2 className="responsive-heading mb-4 neon-heading">No Questions Available</h2>
                  <p className="responsive-body text-muted-foreground mb-6">No diagnostic questions were found. This might be because:</p>
                  <ul className="text-left text-muted-foreground mb-6 space-y-2">
                    <li>• You haven&apos;t completed the onboarding process</li>
                    <li>• The AI service failed to generate questions</li>
                    <li>• There was an issue loading your personalized questions</li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => loadQuestions()}>
                    Try Loading Again
                  </Button>
                  <Button variant="outline" onClick={handleGenerateQuestions}>
                    Generate New Questions
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      const proceed = confirm('Are you sure you want to proceed? If yes, all previous diagnostic data will be deleted and payment will be required again.')
                      if (!proceed) return
                      try {
                        const res = await fetch('/api/diagnostic/reset', { method: 'POST' })
                        if (!res.ok) throw new Error('Reset failed')
                        router.push('/dashboard')
                      } catch (e) {
                        setError('Failed to reset previous data. Please try again.')
                      }
                    }}
                  >
                    Start Fresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="diagnostic-container min-h-screen-dvh bg-background py-8 transition-opacity duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative mb-4 flex items-center justify-center gap-4 sm:gap-6">
            <div className="hidden md:block animate-float">
              <Image src="/Line_art2-01.png" alt="diagnostic emblem left" width={96} height={96} className="w-16 sm:w-24 h-auto drop-shadow-[0_0_18px_#ff1aff]" />
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold neon-heading [text-shadow:0_0_28px_rgba(204,255,0,0.9),0_0_56px_rgba(204,255,0,0.6),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)] [-webkit-text-stroke:1px_rgba(0,0,0,0.25)] leading-tight">
                Digging Into Your Shit
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2 px-4 sm:px-0 leading-relaxed">
                This is where we stop the guesswork and start uncovering what's really holding you back.
              </p>
            </div>
            <div className="hidden md:block animate-float-delayed">
              <Image src="/Line_art3-01.png" alt="diagnostic emblem right" width={96} height={96} className="w-16 sm:w-24 h-auto drop-shadow-[0_0_18px_#ff9900]" />
            </div>
          </div>
        </div>

        <Card className="bg-background border border-border/50 shadow-2xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Progress */}
            <div className="mb-6 sm:mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs sm:text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} variant="default" glow className="h-2 sm:h-3" />
            </div>

            {/* Question */}
            <div className="mb-6 sm:mb-8" id="diagnostic-question-top">
              {currentQuestion ? (
                <div className="bg-background rounded-xl p-4 sm:p-6 border border-border/50">
                  <div className="flex items-start gap-3 mb-4">
                    <Target className="hidden sm:block h-5 w-5 sm:h-6 sm:w-6 text-[#ff1aff] mt-1 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 8px #ff1aff)' }} />
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-semibold mb-3 text-foreground leading-relaxed">{currentQuestion.question}</h2>
                      {currentQuestion.followUp && (
                        <p className="text-sm sm:text-base text-muted-foreground italic">💡 {currentQuestion.followUp}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <LoadingSpinner size="md" text="Loading question..." />
                </div>
              )}
            </div>

            {/* Response Options or Text/Voice Input */}
            {currentQuestion?.options && currentQuestion.options.length > 0 ? (
              <div className="mb-6 sm:mb-8">
                {(() => {
                  const isAnswered = currentQuestionIndex < responses.length
                  const isCollapsed = (collapsedOptions[currentQuestionIndex] ?? isAnswered) === true
                  const toggle = () => setCollapsedOptions(prev => ({ ...prev, [currentQuestionIndex]: !isCollapsed }))
                  return (
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Options</h3>
                      <button
                        type="button"
                        onClick={toggle}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        aria-controls="mc-options"
                      >
                        {isCollapsed ? 'Show' : 'Hide'}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                      </button>
                    </div>
                  )
                })()}
                {(() => {
                  const isAnswered = currentQuestionIndex < responses.length
                  const isCollapsed = (collapsedOptions[currentQuestionIndex] ?? isAnswered) === true
                  if (isCollapsed) return null
                  return (
                    <div id="mc-options" className="space-y-2 sm:space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={currentResponse === option ? "default" : "outline"}
                      className={`w-full justify-start p-3 sm:p-4 h-auto text-left transition-all duration-200 ${
                        currentResponse === option 
                          ? 'bg-primary hover:bg-primary/90 border-primary shadow-lg scale-[1.02]' 
                          : 'hover:bg-accent hover:border-accent-foreground/20'
                      }`}
                      onClick={() => setCurrentResponse(option)}
                      disabled={generatingInsight}
                    >
                      <div className="flex items-center gap-3">
                        {currentResponse === option && (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                        )}
                        <span className="text-sm sm:text-base leading-relaxed">{option}</span>
                      </div>
                    </Button>
                  ))}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="mb-6 sm:mb-8">
                {/* Input Mode Toggle */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex rounded-xl p-1 bg-muted/50">
                    <Button
                      variant={inputMode === 'text' ? 'cta' : 'ghost'}
                      onClick={() => setInputMode('text')}
                      disabled={generatingInsight}
                      className="flex-1 flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Pencil className="h-4 w-4" />
                      Type
                    </Button>
                    <Button
                      variant={inputMode === 'voice' ? 'cta' : 'ghost'}
                      onClick={() => setInputMode('voice')}
                      disabled={generatingInsight}
                      className="flex-1 flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Mic className="h-4 w-4" />
                      Voice
                    </Button>
                  </div>
                </div>

                {/* Voice Input */}
                {inputMode === 'voice' && (
                  <div className="mb-6">
                    <VoiceRecorder
                      key={`voice-${currentQuestionIndex}`}
                      onTranscription={handleVoiceTranscription}
                      onError={handleVoiceError}
                      disabled={generatingInsight}
                      placeholder="Click to start recording your response..."
                      className="mb-4"
                      allowEdit={true}
                    />
                    {voiceError && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          <p className="text-destructive/80">{voiceError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Input */}
                {inputMode === 'text' && (
                  <div className="mb-4 sm:mb-6">
                    <Textarea
                      placeholder="Share your thoughts here... Be as open and honest as you feel comfortable with."
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      disabled={generatingInsight}
                      className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
                    />
                  </div>
                )}

                {/* Current Response Display */}
                {currentResponse && (
                  <div className="mb-4 sm:mb-6">
                    <div className="bg-accent/50 border border-accent/20 rounded-xl p-3 sm:p-4">
                      <h4 className="font-semibold text-accent-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <Sparkles className="h-4 w-4" />
                        Your Response:
                      </h4>
                      <p className="text-accent-foreground/80 text-sm sm:text-base leading-relaxed">{currentResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Previous Insights - Updated to show only 1 */}
            {responses.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Latest AI Insight
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {responses.slice(-1).map((response, index) => (
                    <Card key={index} className="feature-card border-l-4 border-l-primary">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="glass" className="text-xs">
                            <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            Powered by AI
                          </Badge>
                        </div>
                        <p className="text-foreground text-sm sm:text-base leading-relaxed">{response.insight}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Struggles Index (separate, not counted in progress) */}
            {hsiQuestions.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Hidden Struggles Index (True/False)</h3>
                <div className="space-y-2">
                  {hsiQuestions.map((q) => {
                    const val = !!hsiAnswers[q.id]
                    return (
                      <div key={q.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-xl p-3">
                        <div className="text-sm sm:text-base leading-relaxed">{q.text}</div>
                        <div className="flex gap-2">
                          <Button
                            variant={val ? 'cta' : 'outline'}
                            onClick={() => toggleHSI(q.id, true)}
                            size="sm"
                          >True</Button>
                          <Button
                            variant={!val ? 'default' : 'outline'}
                            onClick={() => toggleHSI(q.id, false)}
                            size="sm"
                          >False</Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Button onClick={saveHSI} disabled={hsiSaving} variant={hsiSaved ? 'secondary' : 'cta'}>
                    {hsiSaving ? 'Saving…' : hsiSaved ? 'Saved' : 'Save HSI'}
                  </Button>
                  {hsiError && <span className="text-sm text-destructive">{hsiError}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">These don’t count toward your question progress. They help refine your report.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0 || generatingInsight}
                className="flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleSubmitResponse}
                disabled={!currentResponse.trim() || generatingInsight}
                variant={!currentResponse.trim() || generatingInsight ? undefined : 'cta'}
                className="flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
              >
                {generatingInsight ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                    <span className="sm:hidden">Analyzing</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      {currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
                    </span>
                    <span className="sm:hidden">
                      {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
