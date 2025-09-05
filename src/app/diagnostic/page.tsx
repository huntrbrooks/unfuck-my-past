'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Mic, Pencil, CheckCircle, Bot, Brain, Target, Sparkles } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import VoiceRecorder from '../../components/VoiceRecorder'
import QuestionGenerationLoader from '../../components/QuestionGenerationLoader'
import { DiagnosticQuestion } from '../../lib/diagnostic-questions'

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

  useEffect(() => {
    // Check if we're coming from onboarding with generating=true
    console.log('🔍 DIAGNOSTIC PAGE: useEffect running')
    console.log('🔍 Search params object:', searchParams)
    
    const isGenerating = searchParams.get('generating') === 'true'
    console.log('🔍 isGenerating:', isGenerating)
    
    if (isGenerating) {
      console.log('🎯 ONBOARDING FLOW: Starting beautiful loader progression')
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
      // Load questions on component mount
      if (questions.length === 0 && !isLoadingQuestions && !loading) {
        console.log('Loading questions on mount...')
        loadQuestions()
      }
    }
  }, []) // run once on mount; we manually clear the URL below

  // Show loader if we're generating questions
  useEffect(() => {
    if (isGeneratingQuestions) {
      setShowLoader(true)
    }
  }, [isGeneratingQuestions])

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
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
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
        console.log('🎯 Questions loaded, but letting loader complete its natural progression')
        
        // DON'T jump to step 5 - let the interval naturally progress through all steps
        // The loader will automatically hide after 20 seconds (when it reaches step 5)
        
        // Questions are ready, but we'll wait for the full 20-second progression
        // The timeout in useEffect will handle hiding the loader after 20 seconds
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
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

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
                      setShowReadyPrompt(false)
                      setShowLoader(false)
                      setIsGeneratingQuestions(false)
                    }}
                  >
                    Yes, let’s start
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-background py-8">
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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <Brain className="h-8 w-8 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
            </div>
            <div>
              <h1 className="responsive-heading neon-heading key-info">Personal Diagnostic</h1>
              <p className="responsive-body text-muted-foreground">Your journey to self-discovery starts here</p>
            </div>
          </div>
        </div>

        <Card className="glass-card border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} variant="gradient" className="h-3" />
            </div>

            {/* Question */}
            <div className="mb-8">
              {currentQuestion ? (
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
                  <div className="flex items-start gap-3 mb-4">
                    <Target className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-3 text-foreground">{currentQuestion.question}</h2>
                      {currentQuestion.followUp && (
                        <p className="text-muted-foreground italic">💡 {currentQuestion.followUp}</p>
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
              <div className="mb-8">
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={currentResponse === option ? "default" : "outline"}
                      className={`w-full justify-start p-4 h-auto text-left transition-all duration-200 ${
                        currentResponse === option 
                          ? 'bg-primary hover:bg-primary/90 border-primary shadow-lg scale-[1.02]' 
                          : 'hover:bg-accent hover:border-accent-foreground/20'
                      }`}
                      onClick={() => setCurrentResponse(option)}
                      disabled={generatingInsight}
                    >
                      <div className="flex items-center gap-3">
                        {currentResponse === option && (
                          <CheckCircle className="h-5 w-5 text-primary-foreground" />
                        )}
                        <span className="text-base">{option}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8">
                {/* Input Mode Toggle */}
                <div className="mb-6">
                  <div className="flex rounded-xl p-1">
                    <Button
                      variant={inputMode === 'text' ? 'cta' : 'ghost'}
                      onClick={() => setInputMode('text')}
                      disabled={generatingInsight}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Type
                    </Button>
                    <Button
                      variant={inputMode === 'voice' ? 'cta' : 'ghost'}
                      onClick={() => setInputMode('voice')}
                      disabled={generatingInsight}
                      className="flex-1 flex items-center gap-2"
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
                  <div className="mb-6">
                    <Textarea
                      placeholder="Share your thoughts here... Be as open and honest as you feel comfortable with."
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      disabled={generatingInsight}
                      className="min-h-[120px] text-base resize-none"
                    />
                  </div>
                )}

                {/* Current Response Display */}
                {currentResponse && (
                  <div className="mb-6">
                    <div className="bg-accent/50 border border-accent/20 rounded-xl p-4">
                      <h4 className="font-semibold text-accent-foreground mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Your Response:
                      </h4>
                      <p className="text-accent-foreground/80">{currentResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Previous Insights - Updated to show only 1 */}
            {responses.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Latest AI Insight
                </h3>
                <div className="space-y-4">
                  {responses.slice(-1).map((response, index) => (
                    <Card key={index} className="feature-card border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="glass" className="text-xs">
                            <Bot className="h-4 w-4 text-primary" />
                            Powered by AI
                          </Badge>
                        </div>
                        <p className="text-foreground">{response.insight}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0 || generatingInsight}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleSubmitResponse}
                disabled={!currentResponse.trim() || generatingInsight}
                variant={!currentResponse.trim() || generatingInsight ? undefined : 'cta'}
                className={`flex items-center gap-2`}
              >
                {generatingInsight ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    {currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
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
