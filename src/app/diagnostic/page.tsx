'use client'

import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, ProgressBar, Button, Form, Alert, ButtonGroup } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'
import SkeletonCard from '../../components/SkeletonCard'
import VoiceRecorder from '../../components/VoiceRecorder'
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
  const [questionsLoaded, setQuestionsLoaded] = useState(false)

  useEffect(() => {
    // Only load questions if we don't have any, we're not already loading, and we haven't loaded them yet
    if (questions.length === 0 && !isLoadingQuestions && !loading && !questionsLoaded) {
      console.log('Initial load: questions.length =', questions.length, 'isLoadingQuestions =', isLoadingQuestions, 'loading =', loading, 'questionsLoaded =', questionsLoaded)
      loadQuestions()
    }
  }, [questions.length, isLoadingQuestions, loading, questionsLoaded])

  useEffect(() => {
    console.log('Questions state changed:', {
      questionsLength: questions.length,
      currentQuestionIndex,
      currentQuestion: questions[currentQuestionIndex],
      isLoadingQuestions,
      loading
    })
  }, [questions, currentQuestionIndex, isLoadingQuestions, loading])

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
        throw new Error(errorData.error || 'Failed to load questions')
      }
      
      const data = await response.json()
      console.log('API Response data:', data)
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions available. Please try again.')
      }
      
      // Only update questions if we don't have any or if we're getting new ones
      if (questions.length === 0 || (data.questions.length > 0 && data.questions.length >= questions.length)) {
        console.log('Updating questions:', questions.length, '->', data.questions.length)
        setQuestions(data.questions)
        setUserPreferences(data.userPreferences)
        setQuestionsLoaded(true) // Mark questions as loaded
      } else {
        console.log('Skipping question update: current =', questions.length, 'new =', data.questions.length)
      }
      console.log('Successfully loaded questions:', data.questions.length, 'isPersonalized:', data.isPersonalized)
      console.log('First question:', data.questions[0])
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
        return
      }

      const data = await response.json()
      console.log('Personalized questions generated:', data)
      
      // Reload questions to get the personalized ones
      await loadQuestions()
    } catch (error) {
      console.error('Error generating personalized questions:', error)
    }
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
      
      // Redirect to results page with summary
      router.push(`/diagnostic/results?summary=${encodeURIComponent(summaryData.summary)}`)
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
    error
  })

  if (loading && questions.length === 0) {
    return (
      <>
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-5">
                  <LoadingSpinner 
                    size="lg" 
                    text="Loading your personalized questions..." 
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <div className="d-flex gap-2">
                  <Button variant="outline-danger" onClick={loadQuestions}>
                    Try Again
                  </Button>
                  <Button variant="outline-primary" onClick={generatePersonalizedQuestions}>
                    Generate Personalized Questions
                  </Button>
                  <Button variant="outline-secondary" onClick={testAIServices}>
                    Test AI Services
                  </Button>
                  {error.includes('sign in') && (
                    <Button variant="primary" onClick={() => router.push('/sign-in?redirect=/diagnostic')}>
                      Sign In
                    </Button>
                  )}
                </div>
              </Alert>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  // If we have no questions and no error, show a message
  if (!loading && questions.length === 0 && !error) {
    return (
      <>
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="warning">
                <Alert.Heading>No Questions Available</Alert.Heading>
                <p>No diagnostic questions were found. This might be because:</p>
                <ul>
                  <li>You haven't completed the onboarding process</li>
                  <li>The AI service failed to generate questions</li>
                  <li>There was an issue loading your personalized questions</li>
                </ul>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" onClick={loadQuestions}>
                    Try Loading Again
                  </Button>
                  <Button variant="outline-secondary" onClick={generatePersonalizedQuestions}>
                    Generate New Questions
                  </Button>
                </div>
              </Alert>
            </Col>
          </Row>
        </Container>
      </>
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
                    <small className="text-muted">Question {currentQuestionIndex + 1} of {questions.length}</small>
                    <small className="text-muted">{Math.round(progress)}% complete</small>
                  </div>
                  <ProgressBar now={progress} className="mb-3" />
                </div>

                {/* Question */}
                <div className="mb-4">
                  {currentQuestion ? (
                    <>
                      <h3 className="mb-3">{currentQuestion.question}</h3>
                      {currentQuestion.followUp && (
                        <p className="text-muted mb-3">{currentQuestion.followUp}</p>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <LoadingSpinner size="md" text="Loading question..." />
                    </div>
                  )}
                </div>

                {/* Response Options or Text/Voice Input */}
                {currentQuestion?.options ? (
                  <div className="mb-4">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={currentResponse === option ? "primary" : "outline-primary"}
                        className="w-100 text-start p-3 mb-2"
                        onClick={() => setCurrentResponse(option)}
                        disabled={generatingInsight}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4">
                    {/* Input Mode Toggle */}
                    <div className="mb-3">
                      <ButtonGroup className="w-100">
                        <Button
                          variant={inputMode === 'text' ? 'primary' : 'outline-primary'}
                          onClick={() => setInputMode('text')}
                          disabled={generatingInsight}
                        >
                          <i className="bi bi-pencil me-2"></i>
                          Type
                        </Button>
                        <Button
                          variant={inputMode === 'voice' ? 'primary' : 'outline-primary'}
                          onClick={() => setInputMode('voice')}
                          disabled={generatingInsight}
                        >
                          <i className="bi bi-mic me-2"></i>
                          Voice
                        </Button>
                      </ButtonGroup>
                    </div>

                    {/* Voice Input */}
                    {inputMode === 'voice' && (
                      <div className="mb-3">
                        <VoiceRecorder
                          onTranscription={handleVoiceTranscription}
                          onError={handleVoiceError}
                          disabled={generatingInsight}
                          placeholder="Click to start recording your response..."
                          className="mb-3"
                          allowEdit={true}
                        />
                        {voiceError && (
                          <Alert variant="danger" dismissible onClose={() => setVoiceError(null)}>
                            {voiceError}
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* Text Input */}
                    {inputMode === 'text' && (
                      <Form.Group>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          placeholder="Share your thoughts here..."
                          value={currentResponse}
                          onChange={(e) => setCurrentResponse(e.target.value)}
                          disabled={generatingInsight}
                        />
                      </Form.Group>
                    )}

                    {/* Current Response Display */}
                    {currentResponse && (
                      <div className="mt-3">
                        <Alert variant="info">
                          <strong>Your Response:</strong>
                          <div className="mt-2">{currentResponse}</div>
                        </Alert>
                      </div>
                    )}
                  </div>
                )}

                {/* Previous Insights */}
                {responses.length > 0 && (
                  <div className="mb-4">
                    <h5 className="mb-3">Previous Insights</h5>
                    {responses.slice(-2).map((response, index) => (
                      <Card key={index} className="mb-3 border-left-primary">
                        <Card.Body>
                          <p className="text-muted mb-2">
                            <small>Powered by {response.model}</small>
                          </p>
                          <p className="mb-0">{response.insight}</p>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0 || generatingInsight}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={handleSubmitResponse}
                    disabled={!currentResponse.trim() || generatingInsight}
                  >
                    {generatingInsight ? (
                      <>
                        <LoadingSpinner size="sm" text="Analyzing..." />
                      </>
                    ) : currentQuestionIndex === questions.length - 1 ? (
                      'Complete Assessment'
                    ) : (
                      'Next Question'
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
