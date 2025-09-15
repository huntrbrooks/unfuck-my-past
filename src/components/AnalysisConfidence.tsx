'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Loader2,
  RefreshCw,
  Send,
  ChevronRight,
  Sparkles
} from 'lucide-react'

interface MissingDataItem {
  category: string
  description: string
  importance: 'high' | 'medium' | 'low'
}

interface FollowUpQuestion {
  id: string
  question: string
  category: string
  placeholder: string
  importance: 'high' | 'medium' | 'low'
  context?: string
}

interface AnalysisConfidenceProps {
  initialConfidence: number
  diagnosticResponses: any[]
  userProfile: any
  onDataEnhanced?: (enhancedData: any) => void
  onConfidenceUpdate?: (newConfidence: number) => void
  onRegenerated?: () => void
  onGenerateImprovedReport?: () => void
}

export default function AnalysisConfidence({
  initialConfidence,
  diagnosticResponses,
  userProfile,
  onDataEnhanced,
  onConfidenceUpdate,
  onRegenerated,
  onGenerateImprovedReport
}: AnalysisConfidenceProps) {
  const [confidence, setConfidence] = useState(initialConfidence)
  const [missingData, setMissingData] = useState<MissingDataItem[]>([])
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [questionsGenerated, setQuestionsGenerated] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [round, setRound] = useState(0)
  const [answeredInRound, setAnsweredInRound] = useState(0)

  useEffect(() => {
    // Analyze missing data on mount
    analyzeMissingData()
  }, [])

  const analyzeMissingData = async (): Promise<{ missingData: MissingDataItem[]; confidence: number }> => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/diagnostic/analyze-confidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosticResponses,
          userProfile
        })
      })

      if (!response.ok) throw new Error('Failed to analyze confidence')
      
      const data = await response.json()
      const nextMissing = Array.isArray(data.missingData) ? data.missingData : []
      const nextConfidence = typeof data.confidence === 'number' ? data.confidence : initialConfidence
      setMissingData(nextMissing)
      setConfidence(nextConfidence)
      
      if (onConfidenceUpdate) {
        onConfidenceUpdate(nextConfidence)
      }
      return { missingData: nextMissing, confidence: nextConfidence }
    } catch (error) {
      console.error('Error analyzing confidence:', error)
      // Set default missing data
      const fallback: MissingDataItem[] = [
        { 
          category: 'Coping Mechanisms', 
          description: 'No detail on how you currently manage your urges',
          importance: 'high'
        },
        { 
          category: 'Communication Patterns', 
          description: 'Unclear how you communicate your boundaries',
          importance: 'high'
        },
        { 
          category: 'Support System', 
          description: 'Limited information about your support network',
          importance: 'medium'
        },
        { 
          category: 'Daily Routines', 
          description: 'Missing details about your daily habits and routines',
          importance: 'medium'
        }
      ]
      setMissingData(fallback)
      return { missingData: fallback, confidence }
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFollowUpQuestions = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/diagnostic/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missingData,
          diagnosticResponses,
          userProfile
        })
      })

      if (!response.ok) throw new Error('Failed to generate questions')
      
      const data = await response.json()
      setFollowUpQuestions(data.questions || [])
      setQuestionsGenerated(true)
      setShowQuestions(true)
      setCurrentQuestionIndex(0)
      setAnsweredInRound(0)
    } catch (error) {
      console.error('Error generating questions:', error)
      // Set fallback questions
      setFollowUpQuestions([
        {
          id: 'coping-1',
          question: 'When you feel overwhelmed or triggered, what specific strategies do you currently use to manage those feelings?',
          category: 'Coping Mechanisms',
          placeholder: 'Describe your current coping strategies (e.g., breathing exercises, going for a walk, calling a friend, etc.)',
          importance: 'high',
          context: 'Understanding your existing coping mechanisms helps us build on what already works for you.'
        },
        {
          id: 'boundaries-1',
          question: 'How do you typically communicate your boundaries to others, and what challenges do you face in maintaining them?',
          category: 'Communication Patterns',
          placeholder: 'Share how you set and communicate boundaries, and any difficulties you experience...',
          importance: 'high',
          context: 'Boundary setting is crucial for healing. Knowing your current approach helps us strengthen this skill.'
        },
        {
          id: 'support-1',
          question: 'Who in your life provides emotional support, and how comfortable are you reaching out when you need help?',
          category: 'Support System',
          placeholder: 'Describe your support network and your comfort level with seeking help...',
          importance: 'medium',
          context: 'A strong support system accelerates healing. This helps us understand your current resources.'
        },
        {
          id: 'routines-1',
          question: 'What does a typical day look like for you, including any self-care practices or rituals you maintain?',
          category: 'Daily Routines',
          placeholder: 'Walk us through your typical day, highlighting any self-care activities...',
          importance: 'medium',
          context: 'Daily routines provide structure for healing work. Understanding yours helps us integrate practices effectively.'
        }
      ])
      setQuestionsGenerated(true)
      setShowQuestions(true)
      setCurrentQuestionIndex(0)
      setAnsweredInRound(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const triggerRegenerationAndMaybeNextRound = async () => {
    if (isImproving) return
    try {
      setIsImproving(true)
      // Ask parent to regenerate the report; support both sync and async callbacks
      const maybe = onGenerateImprovedReport && onGenerateImprovedReport()
      if (maybe && typeof (maybe as any).then === 'function') {
        await (maybe as any)
      }
      // Let parent know to refresh any dependent data
      onRegenerated && onRegenerated()
    } finally {
      setIsImproving(false)
      // Prepare next round if needed
      const next = await analyzeMissingData()
      // Reset flags so the Improve button can reappear if the user pauses, but auto-continue if needed
      setQuestionsGenerated(false)
      setShowQuestions(false)
      setUserAnswer('')
      setCurrentQuestionIndex(0)
      setAnsweredInRound(0)
      setRound(prev => prev + 1)
      // If we still haven't reached target confidence and there are gaps, auto-generate the next round
      if ((next?.confidence ?? confidence) < 95) {
        try {
          if (Array.isArray(next?.missingData) && next.missingData.length > 0) {
            await generateFollowUpQuestions()
          }
        } catch {}
      }
    }
  }

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return

    setIsSubmitting(true)
    const currentQuestion = followUpQuestions[currentQuestionIndex]
    const updatedAnswers = { ...answers, [currentQuestion.id]: userAnswer }
    setAnswers(updatedAnswers)

    try {
      // Save the answer to enhance diagnostic data
      const response = await fetch('/api/diagnostic/enhance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          answer: userAnswer,
          category: currentQuestion.category,
          existingResponses: diagnosticResponses
        })
      })

      if (!response.ok) throw new Error('Failed to save answer')
      
      const data = await response.json()

      // Re-analyze true confidence from server after persisting answer
      try {
        const answeredMeta = Object.entries(updatedAnswers).map(([id]) => {
          const fq = followUpQuestions.find(q => q.id === id)
          return { id, category: fq?.category }
        })
        const analyze = await fetch('/api/diagnostic/analyze-confidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diagnosticResponses, userProfile, followUps: answeredMeta })
        })
        if (analyze.ok) {
          const a = await analyze.json()
          const newConfidence = Math.max(0, Math.min(100, Math.round(a?.confidence ?? initialConfidence)))
          setConfidence(newConfidence)
          if (onConfidenceUpdate) onConfidenceUpdate(newConfidence)
          // Update missing data in state to inform next round
          if (Array.isArray(a?.missingData)) {
            setMissingData(a.missingData)
          }
        }
      } catch {}

      // Move to next question or complete
      if (currentQuestionIndex < followUpQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setUserAnswer('')
        setAnsweredInRound(prev => prev + 1)
      } else {
        // All questions answered
        if (onDataEnhanced) {
          onDataEnhanced({
            enhancedResponses: data.enhancedResponses,
            additionalAnswers: updatedAnswers
          })
        }
        setShowQuestions(false)
        setAnsweredInRound(prev => prev + 1)
        // Auto-regenerate after completing a round of four, then continue if < 95%
        await triggerRegenerationAndMaybeNextRound()
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipQuestion = () => {
    if (currentQuestionIndex < followUpQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setUserAnswer('')
      setAnsweredInRound(prev => prev + 1)
    } else {
      setShowQuestions(false)
      setAnsweredInRound(prev => prev + 1)
      // If a user skips to the end of a round, still trigger regeneration
      triggerRegenerationAndMaybeNextRound()
    }
  }

  const handleGenerateImproved = async () => {
    if (isImproving) return
    await triggerRegenerationAndMaybeNextRound()
  }

  const getConfidenceLevel = (conf: number) => {
    if (conf >= 85) return { label: 'HIGH', color: 'text-green-500' }
    if (conf >= 70) return { label: 'MODERATE', color: 'text-yellow-500' }
    if (conf >= 50) return { label: 'FAIR', color: 'text-orange-500' }
    return { label: 'LOW', color: 'text-red-500' }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const confidenceLevel = getConfidenceLevel(confidence)

  return (
    <div className="space-y-6">
      {/* Main Confidence Card */}
      <Card className="relative overflow-hidden border-2 border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl neon-glow-purple">Analysis Confidence</CardTitle>
            </div>
            <Badge variant="outline" className={`text-lg px-4 py-1 ${confidenceLevel.color} justify-center text-center`}>
              {confidenceLevel.label} ({confidence}%)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-6">
          {/* Confidence Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Confidence based on available prognostic data</span>
              <span>{confidence}%</span>
            </div>
            <Progress value={confidence} className="h-3" />
          </div>

          {/* Missing Data Section */}
          {missingData.length > 0 && !showQuestions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Missing data:</h3>
              </div>
              <ul className="space-y-2">
                {missingData.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Badge variant={getImportanceColor(item.importance)} className="mt-0.5">
                      {item.importance}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {!questionsGenerated && (
                <Button 
                  onClick={generateFollowUpQuestions}
                  disabled={isGenerating}
                  className="w-full neon-cta"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing gaps...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Improve Confidence Rating
                    </>
                  )}
                </Button>
              )}

              {/* Removed 'Answer More Questions' per product spec */}
            </div>
          )}

          {/* Follow-up Questions Section */}
          {showQuestions && followUpQuestions.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Follow-up Question {currentQuestionIndex + 1} of {followUpQuestions.length}
                  </h3>
                  <Badge variant="outline">
                    {followUpQuestions[currentQuestionIndex].category}
                  </Badge>
                </div>
                <Progress 
                  value={(currentQuestionIndex / followUpQuestions.length) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground">
                    {followUpQuestions[currentQuestionIndex].question}
                  </p>
                  {followUpQuestions[currentQuestionIndex].context && (
                    <p className="text-sm text-muted-foreground italic">
                      {followUpQuestions[currentQuestionIndex].context}
                    </p>
                  )}
                </div>

                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={followUpQuestions[currentQuestionIndex].placeholder}
                  className="min-h-[120px] resize-none"
                  disabled={isSubmitting}
                />

                <div className="flex gap-3">
                  <Button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || isSubmitting}
                    className="flex-1 neon-cta"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit & Continue
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={skipQuestion}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Skip
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {questionsGenerated && !showQuestions && Object.keys(answers).length > 0 && (
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Data Enhanced!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've answered {Object.keys(answers).length} follow-up questions. 
                    Your report and healing plan will now be more personalized and accurate.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  onClick={handleGenerateImproved}
                  disabled={isImproving}
                  className="w-full neon-cta"
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating improved report...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate improved report
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
