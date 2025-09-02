'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Mic, Pencil, CheckCircle, Bot } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import SkeletonCard from '../../components/SkeletonCard'
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
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<DiagnosticResponse[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [error, setError] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    // Check if we're coming from onboarding with generating=true
    const urlParams = new URLSearchParams(window.location.search)
    const isGenerating = urlParams.get('generating') === 'true'
    
    if (isGenerating) {
      setIsGeneratingQuestions(true)
      setShowLoader(true)
      generatePersonalizedQuestions()
      // Clean up the URL
      window.history.replaceState({}, '', '/diagnostic')
    } else {
      // Load questions on component mount
      if (questions.length === 0 && !isLoadingQuestions && !loading) {
        console.log('Loading questions on mount...')
        loadQuestions()
      }
    }
  }, [])

  // Show loader if we're generating questions
  useEffect(() => {
    if (isGeneratingQuestions) {
      setShowLoader(true)
    }
  }, [isGeneratingQuestions])

  const loadQuestions = async () => {
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
          throw new Error('Questions are being generated, please wait a moment and try again')
        }
        throw new Error(errorData.error || 'Failed to load questions')
      }
      
      const data = await response.json()
      console.log('API Response data:', data)
      console.log('Questions in response:', data.questions?.length || 0)
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions available. Please try again.')
      }
      
      // Update questions state
      console.log('Setting questions:', data.questions.length)
      setQuestions(data.questions)
      setUserPreferences(data.userPreferences)
      console.log('Questions state updated successfully')
      console.log('Successfully loaded questions:', data.questions.length, 'isPersonalized:', data.isPersonalized)
    } catch (error) {
      setError(`Failed to load diagnostic questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
      setIsLoadingQuestions(false)
    }
  }

  const generatePersonalizedQuestions = async () => {
    try {
      setIsGeneratingQuestions(true)
      setShowLoader(true)
      console.log('Generating personalized questions...')
      
      const response = await fetch('/api/diagnostic/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to generate personalized questions:', errorData)
        throw new Error('Failed to generate questions')
      }

      const data = await response.json()
      console.log('Personalized questions generated:', data)
      
      // Wait a bit to show the completion state
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reload questions to get the personalized ones
      await loadQuestions()
    } catch (error) {
      setError(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error generating personalized questions:', error)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const handleQuestionsReady = () => {
    setShowLoader(false)
    loadQuestions()
  }

  const handleRetryGeneration = () => {
    setShowLoader(false)
    setIsGeneratingQuestions(false)
    generatePersonalizedQuestions()
  }

  const testAIServices = async () => {
    try {
      console.log('Testing AI services...')
      const response = await fetch('/api/test-ai')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to test AI services:', errorData)
        return
      }

      const data = await response.json()
      console.log('AI services test results:', data)
      
      // Show results in alert
      const results = data.results
      const message = `
AI Services Test Results:

OpenAI: ${results.openai.available ? '✅ Working' : '❌ Failed'}
${results.openai.error ? `Error: ${results.openai.error}` : ''}
${results.openai.response ? `Response: ${results.openai.response}` : ''}

Claude: ${results.claude.available ? '✅ Working' : '❌ Failed'}
${results.claude.error ? `Error: ${results.claude.error}` : ''}
${results.claude.response ? `Response: ${results.claude.response}` : ''}
      `.trim()
      
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

  console.log('Diagnostic page state:', {
    questionsLength: questions.length,
    currentQuestionIndex,
    currentQuestion: currentQuestion?.question,
    loading,
    error,
    isLoadingQuestions
  })

  if (loading && questions.length === 0) {
          return (
        <>
         <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
           <div className="max-w-2xl w-full">
             <Card className="border-0 shadow-xl">
               <CardContent className="p-8">
                 <LoadingSpinner 
                   size="lg" 
                   text="Loading your personalized questions..." 
                 />
               </CardContent>
             </Card>
           </div>
         </div>
        </>
      )
  }

  if (error) {
          return (
        <>
         <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
           <div className="max-w-2xl w-full">
             <Card className="border-0 shadow-xl">
               <CardContent className="p-8">
                 <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                   <div className="flex items-center gap-3 mb-4">
                     <AlertTriangle className="h-6 w-6 text-red-600" />
                     <h3 className="text-lg font-semibold text-red-800">Error</h3>
                   </div>
                   <p className="text-red-700 mb-6">{error}</p>
                   <div className="flex flex-col sm:flex-row gap-3">
                     <Button variant="outline" onClick={loadQuestions}>
                       Try Again
                     </Button>
                     <Button variant="outline" onClick={generatePersonalizedQuestions}>
                       Generate Personalized Questions
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
        </>
      )
  }

  // Show the beautiful loader when generating questions
  if (showLoader) {
    return (
      <QuestionGenerationLoader
        isGenerating={isGeneratingQuestions}
        onQuestionsReady={handleQuestionsReady}
        onRetry={handleRetryGeneration}
      />
    )
  }

  // If we have no questions and no error, show a message
  if (!loading && questions.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-6">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h2>
                  <p className="text-gray-600 mb-6">No diagnostic questions were found. This might be because:</p>
                  <ul className="text-left text-gray-600 mb-6 space-y-2">
                    <li>• You haven't completed the onboarding process</li>
                    <li>• The AI service failed to generate questions</li>
                    <li>• There was an issue loading your personalized questions</li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={loadQuestions}>
                    Try Loading Again
                  </Button>
                  <Button variant="outline" onClick={generatePersonalizedQuestions}>
                    Generate New Questions
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
      <>
       <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <Card className="border-0 shadow-xl">
             <CardContent className="p-8">
               {/* Progress */}
               <div className="mb-8">
                 <div className="flex justify-between items-center mb-3">
                   <span className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</span>
                   <span className="text-sm text-gray-600">{Math.round(progress)}% complete</span>
                 </div>
                 <Progress value={progress} className="h-2" />
               </div>

               {/* Question */}
               <div className="mb-8">
                 {currentQuestion ? (
                   <>
                     <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentQuestion.question}</h2>
                     {currentQuestion.followUp && (
                       <p className="text-lg text-gray-600 mb-4">{currentQuestion.followUp}</p>
                     )}
                   </>
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
                         className={`w-full justify-start p-4 h-auto text-left ${
                           currentResponse === option 
                             ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                             : 'hover:bg-gray-50'
                         }`}
                         onClick={() => setCurrentResponse(option)}
                         disabled={generatingInsight}
                       >
                         <div className="flex items-center gap-3">
                           {currentResponse === option && (
                             <CheckCircle className="h-5 w-5 text-white" />
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
                     <div className="flex bg-gray-100 rounded-lg p-1">
                       <Button
                         variant={inputMode === 'text' ? 'default' : 'ghost'}
                         onClick={() => setInputMode('text')}
                         disabled={generatingInsight}
                         className="flex-1 flex items-center gap-2"
                       >
                         <Pencil className="h-4 w-4" />
                         Type
                       </Button>
                       <Button
                         variant={inputMode === 'voice' ? 'default' : 'ghost'}
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
                         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                           <div className="flex items-center gap-3">
                             <AlertTriangle className="h-5 w-5 text-red-600" />
                             <p className="text-red-800">{voiceError}</p>
                           </div>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Text Input */}
                   {inputMode === 'text' && (
                     <div className="mb-6">
                       <Textarea
                         placeholder="Share your thoughts here..."
                         value={currentResponse}
                         onChange={(e) => setCurrentResponse(e.target.value)}
                         disabled={generatingInsight}
                         className="min-h-[120px] text-base"
                       />
                     </div>
                   )}

                   {/* Current Response Display */}
                   {currentResponse && (
                     <div className="mb-6">
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                         <h4 className="font-semibold text-blue-900 mb-2">Your Response:</h4>
                         <p className="text-blue-800">{currentResponse}</p>
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {/* Previous Insights - Updated to show only 1 */}
               {responses.length > 0 && (
                 <div className="mb-8">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Insights</h3>
                   <div className="space-y-4">
                     {responses.slice(-1).map((response, index) => (
                       <Card key={index} className="border-l-4 border-l-green-500">
                         <CardContent className="p-4">
                           <div className="flex items-center gap-2 mb-2">
                             <Badge variant="secondary" className="text-xs">
                               <Bot className="h-4 w-4 text-gray-500" />
                               Powered by AI
                             </Badge>
                           </div>
                           <p className="text-gray-700">{response.insight}</p>
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
                   className="flex items-center gap-2"
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
      </>
    )
}
