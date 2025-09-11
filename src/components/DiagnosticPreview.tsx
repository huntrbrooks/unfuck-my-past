'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, Target, Sparkles, Clock, Heart } from 'lucide-react'
import { Preview } from '@/lib/previewSchema'
import { formatMicroAction, teaserLine } from '@/lib/previewCopy'
import { usePreviewAnalytics } from '@/hooks/useAnalytics'

interface DiagnosticPreviewProps {
  questions: { id: string; prompt: string }[]
  answers: { id: string; text: string }[]
  onPurchaseReport: () => void
  onStartProgram: () => void
  onError?: () => void
}

export default function DiagnosticPreview({ 
  questions, 
  answers, 
  onPurchaseReport, 
  onStartProgram,
  onError
}: DiagnosticPreviewProps) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { trackPreviewGenerated, trackCTAClick } = usePreviewAnalytics()

  useEffect(() => {
    generatePreview()
  }, [])

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const generatePreview = async () => {
    try {
      setLoading(true)
      setError('')

      // Fast path: try cached preview first for instant paint
      try {
        const controller = new AbortController()
        const t = setTimeout(() => controller.abort(), 5000)
        const cached = await fetch('/api/diagnostic/preview', { method: 'GET', signal: controller.signal })
        clearTimeout(t)
        if (cached.ok) {
          const data = await cached.json()
          if (data && data.diagnosticSummary) {
            console.log('✅ Loaded cached preview')
            setPreview(data)
            trackPreviewGenerated(data)
            setLoading(false)
            return
          }
        }
      } catch {
        // ignore cache miss/timeouts
      }

      // Validate we have sufficient data
      if (!answers || answers.length < 3) {
        throw new Error('Need at least 3 answers to generate preview')
      }
      
      if (!questions || questions.length === 0) {
        throw new Error('No questions available for preview generation')
      }

      console.log('🔄 DiagnosticPreview: Generating preview with:', {
        questionsCount: questions.length,
        answersCount: answers.length
      })

      const maxAttempts = 3
      let response: Response | null = null
      let lastError: unknown = null
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)
          response = await fetch('/api/diagnostic/preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questions,
              answers,
              miniSummaries: [], // Could be populated from existing insights
              crisisNow: false
            }),
            signal: controller.signal
          })
          clearTimeout(timeoutId)

          // Retry on transient 5xx errors
          if (!response.ok && response.status >= 500 && attempt < maxAttempts) {
            const backoff = 300 * Math.pow(2, attempt - 1)
            await sleep(backoff)
            continue
          }

          break
        } catch (e) {
          lastError = e
          if (attempt < maxAttempts) {
            const backoff = 300 * Math.pow(2, attempt - 1)
            await sleep(backoff)
            continue
          }
        }
      }

      if (!response) {
        throw lastError instanceof Error ? lastError : new Error('Failed to generate preview')
      }

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        console.error('❌ DiagnosticPreview API error:', {
          status: response.status,
          error: errorData
        })
        
        // Provide specific error messages based on status
        let errorMessage
        if (response.status === 400) {
          errorMessage = errorData.error || 'Invalid data provided for preview generation'
        } else if (response.status === 401) {
          errorMessage = 'Please sign in to generate your diagnostic preview'
        } else if (response.status === 422) {
          errorMessage = 'There was an issue processing your responses. Please try again.'
        } else if (response.status === 500) {
          errorMessage = 'Our analysis system is temporarily unavailable. Please try again in a moment.'
        } else {
          errorMessage = errorData.error || `Failed to generate preview (${response.status})`
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ DiagnosticPreview: Preview generated successfully')
      setPreview(data)
      
      // Track preview generation
      trackPreviewGenerated(data)
      
      console.log('✅ DiagnosticPreview: Preview generated successfully - content preview:', {
        hasDiagnosticSummary: !!data.diagnosticSummary,
        insightsCount: data.insights?.length || 0,
        hasConfidence: !!data.confidence,
        hasTeaser: !!data.teaser
      })
    } catch (err) {
      console.error('Error generating preview:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate diagnostic preview'
      setError(errorMessage)
      
      // Call onError callback to trigger fallback to legacy summary
      if (onError) {
        console.log('🔄 DiagnosticPreview: Calling onError callback')
        onError()
      }
    } finally {
      setLoading(false)
    }
  }

  // Replaced micro-action "Try Now" with navigation to Program page via onStartProgram

  const handleCTAClick = () => {
    // Track analytics event
    trackCTAClick(10)
    onPurchaseReport()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Generating your diagnostic preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Card className="feature-card border-0 shadow-[0_0_18px_rgba(239,68,68,0.25)]">
          <CardContent className="p-6">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Generate Preview</h3>
            <p className="text-muted-foreground mb-4 text-sm">{error}</p>
            <p className="text-muted-foreground mb-6 text-xs">Don't worry - your free summary is still available below.</p>
            <Button onClick={generatePreview} variant="outline" size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!preview) return null

  return (
    <div className="space-y-8">
      {/* Diagnostic Summary */}
      <Card className="feature-card border-0 shadow-[0_0_18px_rgba(204,255,0,0.25)]">
        <CardHeader className="bg-background border-b border-border/50 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Target className="hidden sm:block h-6 w-6 text-primary" />
            <CardTitle className="text-lg sm:text-xl font-semibold neon-heading">Diagnostic Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed text-base sm:text-lg tracking-wide">
              {preview.diagnosticSummary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="space-y-6">
        {preview.insights.map((insight, index) => (
          <Card key={index} className="feature-card border-0 shadow-[0_0_18px_rgba(0,229,255,0.25)]">
            <CardHeader className="bg-background border-b border-border/50 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="hidden sm:block h-6 w-6 text-accent-foreground" />
                  <CardTitle className="text-lg sm:text-xl font-semibold neon-heading">
                    Insight {index + 1}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {insight.tags.join(', ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* What We Saw */}
              <div>
                <h4 className="font-semibold mb-2 text-[#ff1aff] [text-shadow:0_0_12px_rgba(255,26,255,0.8)]">What We Saw</h4>
                <p className="text-foreground leading-relaxed">{insight.whatWeSaw}</p>
              </div>

              {/* Evidence */}
              {insight.evidenceQuote && (
                <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                  <div className="flex items-start gap-2">
                    <blockquote className="text-foreground italic">
                      "{insight.evidenceQuote}"
                    </blockquote>
                  </div>
                </div>
              )}

              {/* Why It Matters */}
              <div>
                <h4 className="font-semibold mb-2 text-cyan-300 [text-shadow:0_0_12px_rgba(0,229,255,0.9)]">Why It Matters</h4>
                <p className="text-foreground leading-relaxed">{insight.whyItMatters}</p>
              </div>

              {/* Micro Action */}
              <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-300 [text-shadow:0_0_12px_rgba(251,146,60,0.9)]">
                      <Clock className="h-4 w-4" />
                      Micro Action
                    </h4>
                    <p className="text-foreground leading-relaxed">
                      {formatMicroAction(
                        insight.microAction, 
                        15, // Default minutes per day
                        'gentle' as any, 
                        'moderate' as any
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={onStartProgram}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 border-2 border-[#ff1a1a]/40 bg-[#ff1a1a]/10 text-[#ff1a1a] hover:bg-[#ff1a1a]/20 [text-shadow:0_0_10px_rgba(255,26,26,0.8)] shadow-[0_0_18px_rgba(255,26,26,0.35)]"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confidence */}
      <Card className="feature-card border-0 shadow-[0_0_18px_rgba(255,193,7,0.25)]">
        <CardHeader className="bg-background border-b border-border/50 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="hidden sm:block h-6 w-6 text-warning" />
            <CardTitle className="text-lg sm:text-xl font-semibold neon-heading">Analysis Confidence</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <Badge 
              variant="outline"
              className="text-sm border-2 border-[#ff1a1a]/40 bg-[#ff1a1a]/10 text-[#ff1a1a] shadow-[0_0_16px_rgba(255,26,26,0.45)]"
            >
              {preview.confidence.score >= 0.8 ? 'HIGH' : preview.confidence.score >= 0.6 ? 'MEDIUM' : 'LOW'} ({Math.round(preview.confidence.score * 100)}%)
            </Badge>
            <div className="flex-1">
              <p className="text-foreground leading-relaxed mb-2">Confidence based on available diagnostic data.</p>
              {preview.confidence.missingData.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Missing data:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {preview.confidence.missingData.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teaser text only (CTAs removed as requested) */}
      <Card className="feature-card border-0 shadow-[0_0_18px_rgba(255,26,255,0.25)]">
        <CardContent className="p-6 text-center">
          <p className="text-foreground leading-relaxed text-lg">
            {teaserLine(
              'core',
              'gentle' as any
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
