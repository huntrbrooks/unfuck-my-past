'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle, CheckCircle, Brain, Target, Sparkles, Heart, BookOpen, TrendingUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'
import FullReportGenerationLoader from '@/components/FullReportGenerationLoader'
import LoadingSpinner from '@/components/LoadingSpinner'
import Image from 'next/image'


export default function ReportPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comprehensiveReport, setComprehensiveReport] = useState('')
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [paymentFormLoading, setPaymentFormLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [results, setResults] = useState<any[]>([])
  const [summary, setSummary] = useState('')
  const [keyInsights, setKeyInsights] = useState('')
  const [showThankYou, setShowThankYou] = useState(false)
  const [showFinalising, setShowFinalising] = useState(false)
  const [finalisingStartedAt, setFinalisingStartedAt] = useState<number | null>(null)
  const [loaderStep, setLoaderStep] = useState(1)
  const [loaderDone, setLoaderDone] = useState(false)
  const [generationDone, setGenerationDone] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  // Safety timeout: if finalising takes too long, stop loader and show error
  useEffect(() => {
    if (!showFinalising) return
    const timeoutId = setTimeout(() => {
      setShowFinalising(false)
      setGeneratingReport(false)
      setError('Report generation is taking longer than expected. Please try again or refresh the page.')
    }, 60000)
    return () => clearTimeout(timeoutId)
  }, [showFinalising])

  // Multi-step loader: 5 stages, 5s each (25s total)
  useEffect(() => {
    if (!showFinalising) return
    console.log('🎯 Starting loader progression')
    setLoaderStep(1)
    setLoaderDone(false)
    setGenerationDone(false)
    const interval = setInterval(() => {
      setLoaderStep(prev => {
        const next = prev >= 5 ? 5 : prev + 1
        console.log('🎯 Loader step:', next)
        return next
      })
    }, 5000)
    const timer = setTimeout(() => {
      console.log('🎯 Loader progression complete - setting loaderDone to true')
      setLoaderStep(5)
      setLoaderDone(true)
      clearInterval(interval)
    }, 25000)
    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [showFinalising])

  // When both generation and loader are done, show completion prompt
  useEffect(() => {
    console.log('🎯 Checking completion state:', { showFinalising, loaderDone, generationDone })
    if (showFinalising && loaderDone && generationDone) {
      console.log('🎯 Both loader and generation complete - showing completion prompt')
      setTimeout(() => {
        setShowFinalising(false)
        setShowThankYou(false)
        setShowCompletion(true)
      }, 500) // Small delay to ensure smooth transition
    }
  }, [showFinalising, loaderDone, generationDone])
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAccess = async () => {
    try {
      setCheckingAccess(true)
      
      // First check if report already exists (bypass paywall if so)
      const reportCheck = await fetch('/api/diagnostic/comprehensive-report', { method: 'GET' })
      if (reportCheck.ok) {
        const reportData = await reportCheck.json()
        if (reportData.report) {
          console.log('🎯 Found existing report - bypassing paywall')
          setHasAccess(true)
          setShowPaywall(false)
          loadReportData()
          return
        }
      }
      
      // Check if user has purchased the diagnostic report
      const response = await fetch('/api/payments/user-purchases')
      if (response.ok) {
        const data = await response.json()
        const hasDiagnosticAccess = Array.isArray(data) && data.some((purchase: { product: string; active: boolean }) => 
          purchase.product === 'diagnostic' && purchase.active === true
        )
        
        if (hasDiagnosticAccess) {
          setHasAccess(true)
          loadReportData()
        } else {
          setHasAccess(false)
          setShowPaywall(true)
        }
      } else {
        setHasAccess(false)
        setShowPaywall(true)
      }
    } catch (err) {
      console.error('Error checking access:', err)
      setHasAccess(false)
      setShowPaywall(true)
    } finally {
      setCheckingAccess(false)
    }
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      // Load diagnostic responses
      const responsesResponse = await fetch('/api/diagnostic/responses')
      if (responsesResponse.ok) {
        const data = await responsesResponse.json()
        setResults(data.responses || [])
        setQuestionCount(data.responses?.length || 0)
      }

      // Load existing summary and key insights (do not regenerate)
      try {
        const summaryResponse = await fetch('/api/diagnostic/summary', { method: 'GET' })
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          setSummary(summaryData.summary || '')
          setKeyInsights(summaryData.keyInsights || '')
        }
      } catch {}

      // Load existing comprehensive report only
      try {
        const reportResponse = await fetch('/api/diagnostic/comprehensive-report', { method: 'GET' })
        if (reportResponse.ok) {
          const reportData = await reportResponse.json()
          setComprehensiveReport(reportData.report || '')
        }
      } catch {}
    } catch (err) {
      console.error('Error loading report data:', err)
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const generateFullReport = async () => {
    try {
      console.log('🎯 Starting report generation...')
      setGeneratingReport(true)
      setError('')
      setLoaderStep(2)
      
      // Check if report already exists first
      const existingReportResponse = await fetch('/api/diagnostic/comprehensive-report', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (existingReportResponse.ok) {
        const reportData = await existingReportResponse.json()
        if (reportData.report) {
          console.log('🎯 Found existing report, using it')
          setComprehensiveReport(reportData.report)
          setPaymentSuccess(true)
          setShowPaywall(false)
          setHasAccess(true)
          setGenerationDone(true)
          return
        }
      }
      
      console.log('🎯 No existing report, generating new one...')
      setLoaderStep(3)
      
      // Generate a new report
      const reportResponse = await fetch('/api/diagnostic/comprehensive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('🎯 Report API response status:', reportResponse.status)
      
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        console.log('🎯 Report data received:', !!reportData.report)
        setLoaderStep(4)
        setComprehensiveReport(reportData.report || '')
        setPaymentSuccess(true)
        setShowPaywall(false)
        setHasAccess(true)
        setLoaderStep(5)
        setGenerationDone(true)
        console.log('🎯 Report generation complete')
        console.log('🎯 Setting generationDone to true')
        // Force a small delay to ensure state updates are processed
        setTimeout(() => {
          console.log('🎯 Final state check - loaderDone:', loaderDone, 'generationDone:', true)
        }, 100)
      } else {
        const errorData = await reportResponse.text()
        console.error('🎯 Report API error:', errorData)
        throw new Error(`Failed to generate report: ${reportResponse.status}`)
      }
    } catch (err) {
      console.error('🎯 Error generating report:', err)
      setError(`Failed to generate comprehensive report: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setShowFinalising(false)
      setShowThankYou(false)
    } finally {
      setGeneratingReport(false)
      setPaymentFormLoading(false)
    }
  }

  const handlePurchaseReport = async () => {
    await generateFullReport()
  }

  const formatReportContent = (content: string) => {
    if (!content) return null

    const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
    
    const glowClasses = ['neon-heading', 'neon-glow-cyan', 'neon-glow-pink', 'neon-glow-orange'] as const
    const pickGlow = (title: string, fallbackIndex: number) => {
      // New deterministic mapping with distinct colors per known section
      const mapping: Array<{ re: RegExp; cls: string }> = [
        { re: /Executive Summary/i, cls: 'neon-heading' },                 // lime
        { re: /Trauma Analysis/i, cls: 'neon-glow-orange' },               // orange
        { re: /Toxicity Score/i, cls: 'neon-glow-pink' },                  // pink
        { re: /Strengths/i, cls: 'neon-glow-cyan' },                       // cyan
        { re: /Most Important/i, cls: 'neon-glow-purple' },                // purple
        { re: /Behavioral Patterns/i, cls: 'neon-glow-blue' },             // blue
        { re: /Healing Roadmap/i, cls: 'neon-heading' },                   // lime
        { re: /Actionable Recommendations/i, cls: 'neon-glow-red' },       // red
        { re: /Resources/i, cls: 'neon-glow-teal' },                       // teal
      ]
      const found = mapping.find(m => m.re.test(title))
      if (found) return found.cls
      let hash = 0
      for (let i = 0; i < title.length; i++) hash = (hash << 5) - hash + title.charCodeAt(i)
      const idx = Math.abs(hash + fallbackIndex) % glowClasses.length
      return glowClasses[idx]
    }

    return sections.map((section, index) => {
      const lines = section.trim().split('\n')
      const title = lines[0].trim()
      const content = lines.slice(1).join('\n').trim()
      
      if (!content) return null
      const glowClass = pickGlow(title, index)
      
      const forcePlainWhite = /Executive Summary|Trauma Analysis|Toxicity Score/i.test(title)

      return (
        <Card key={index} className="feature-card mb-6 overflow-hidden bg-background border-0">
          <CardHeader className="bg-background">
            <CardTitle className={`flex items-center gap-3 text-foreground ${glowClass}`}>
              {title.includes('Executive Summary') && <Brain className="w-5 h-5 text-primary" />}
              {title.includes('Trauma Analysis') && <Target className="w-5 h-5 text-destructive" />}
              {title.includes('Toxicity Score') && <TrendingUp className="w-5 h-5 text-warning" />}
              {title.includes('Strengths') && <Sparkles className="w-5 h-5 text-success" />}
              {title.includes('Most Important to Address') && <AlertTriangle className="w-5 h-5 text-warning" />}
              {title.includes('Behavioral Patterns') && <Brain className="w-5 h-5 text-primary" />}
              {title.includes('Healing Roadmap') && <Heart className="w-5 h-5 text-primary" />}
              {title.includes('Actionable Recommendations') && <Target className="w-5 h-5 text-success" />}
              {title.includes('Resources') && <BookOpen className="w-5 h-5 text-muted-foreground" />}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              {(() => {
                const linesArr = content.split('\n')
                // find last plain paragraph to glow hot pink (disabled for forced plain white sections)
                let lastPlainIndex = -1
                if (!forcePlainWhite) {
                  for (let i = linesArr.length - 1; i >= 0; i--) {
                    const t = linesArr[i].trim()
                    if (!t) continue
                    if (t.startsWith('•')) continue
                    if (/^\d+\./.test(t)) continue
                    if (t.startsWith('#')) continue
                    lastPlainIndex = i
                    break
                  }
                }
                return linesArr.map((line, lineIndex) => {
                  if (line.trim().startsWith('•')) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span className="text-foreground">{line.substring(1).trim()}</span>
                      </div>
                    )
                  } else if (line.trim().match(/^\d+\./)) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                        <Badge variant="outline" className="text-primary border-0 bg-primary/10">
                          {line.match(/^\d+\./)?.[0]}
                        </Badge>
                        <span className="text-foreground font-medium">{line.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    )
                  } else if (line.trim() && !line.trim().startsWith('#')) {
                    const isLastPlain = !forcePlainWhite && lineIndex === lastPlainIndex
                    return (
                      <div key={lineIndex} className="p-3 rounded-lg bg-background">
                        <span className={isLastPlain ? 'font-medium text-[#ff1aff]' : 'text-foreground font-medium'} style={isLastPlain ? { textShadow: '0 0 10px #ff1aff, 0 0 20px #ff1aff' } : undefined}>{line.trim()}</span>
                      </div>
                    )
                  }
                  return null
                })
              })()}
            </div>
          </CardContent>
        </Card>
      )
    })
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking your access..." />
      </div>
    )
  }

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
              <Brain className="w-10 h-10 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
            </div>
            <h1 className="responsive-heading neon-heading mb-4">Your Comprehensive Diagnostic Report</h1>
            <p className="responsive-body text-muted-foreground mb-8">
              Unlock your personalized trauma analysis, healing roadmap, and actionable recommendations
            </p>
          </div>
          
          <Card className="modern-card max-w-2xl mx-auto">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 neon-heading">
                <span>📊</span>
                Complete Diagnostic Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-foreground">What&apos;s Included:</h3>
                <div className="grid gap-3 text-left">
                  {[
                    { icon: Brain, text: 'Executive Summary & Trauma Analysis', color: 'text-primary' },
                    { icon: TrendingUp, text: 'Toxicity Score Assessment', color: 'text-warning' },
                    { icon: Sparkles, text: 'Personal Strengths & Growth Areas', color: 'text-success' },
                    { icon: Target, text: 'Behavioral Pattern Analysis', color: 'text-primary' },
                    { icon: Heart, text: 'Custom Healing Roadmap', color: 'text-primary' },
                    { icon: Target, text: 'Actionable Recommendations', color: 'text-success' },
                    { icon: BookOpen, text: 'Resources & Next Steps', color: 'text-muted-foreground' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <CheckCircle className={`w-5 h-5 text-green-500 flex-shrink-0`} />
                      <span className="text-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">$9.99</div>
                <p className="text-muted-foreground mb-6">One-time purchase • Lifetime access</p>
                
                {paymentSuccess ? (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Payment successful</h3>
                    <p className="text-muted-foreground mb-6">You now have access to the full report.</p>
                    <Button
                      size="lg"
                      onClick={handlePurchaseReport}
                      disabled={generatingReport}
                    >
                      {generatingReport ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating report...
                        </>
                      ) : (
                        'Generate Full Trauma & Avoidance Report'
                      )}
                    </Button>
                  </div>
                ) : (
                  <PaymentForm
                    productName="Complete Diagnostic Report"
                    amount={999}
                    onSuccess={async () => {
                      console.log('🎯 Payment success - starting loader immediately')
                      // Hide paywall and start the 5-stage loader immediately
                      setShowPaywall(false)
                      setPaymentSuccess(true)
                      setHasAccess(true)
                      setShowThankYou(false)
                      setLoaderStep(1)
                      setShowFinalising(true)
                      setGeneratingReport(true)
                      setFinalisingStartedAt(Date.now())
                      console.log('🎯 States set - should show loader now')
                      // Begin generating report immediately (no await to prevent blocking)
                      generateFullReport()
                    }}
                    onCancel={() => router.push('/dashboard')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    // While loading, still show the new 5-stage loader if we are finalising/generating
    if (showFinalising || generatingReport) {
      return (
        <FullReportGenerationLoader
          currentStep={loaderStep}
          totalSteps={5}
          isGenerating={true}
          // steps prop removed; component defines its own steps copy
        />
      )
    }
    // Otherwise a neutral placeholder
    return (<div className="min-h-screen bg-background" />)
  }

  return (
    <div className="min-h-screen bg-background">
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur">
          <Card className="max-w-md w-full border-0 shadow-xl glass-card">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">Thank you for your support</h3>
              <p className="text-muted-foreground mb-6">
                We pride ourselves on delivering a meaningful and insightful service. Your support helps us keep improving and continue helping people worldwide.
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Finalising your report…</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {showFinalising && (
        <FullReportGenerationLoader
          currentStep={loaderStep}
          totalSteps={5}
          isGenerating={true}
        />
      )}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur">
          <Card className="max-w-md w-full border-0 shadow-xl glass-card text-center">
            <CardContent className="p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-semibold neon-heading mb-2">Full Comprehensive Report Complete</h3>
              <p className="text-muted-foreground mb-6">
                Thank you for your support and trust in our service. Your investment helps us continue improving and supporting people on their healing journeys worldwide. You are incredibly important to us.
              </p>
              <Button className="neon-cta" onClick={() => {
                console.log('🎯 View Report clicked - closing completion modal')
                setShowCompletion(false)
                setLoading(false)
              }}>
                View Report
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8 pt-10 sm:pt-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 animate-float">
            <Image src="/Line_art3-03.png" alt="report art" width={80} height={80} className="w-20 h-auto drop-shadow-[0_0_18px_#22c55e]" />
          </div>
          <h1 className="responsive-heading neon-heading key-info mb-2 [text-shadow:0_0_28px_rgba(204,255,0,0.9),0_0_56px_rgba(204,255,0,0.6),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)] [-webkit-text-stroke:1px_rgba(0,0,0,0.25)]">Here’s Why Your Past Is Fucked</h1>
          <p className="responsive-body text-foreground mb-2">We dug into your answers... Our thoughts on what’s holding you back.</p>
          <p className="responsive-body text-muted-foreground mb-6">Based on your {questionCount} diagnostic responses</p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/api/export'
                link.download = 'diagnostic-report.txt'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              variant="cta"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-8 border border-destructive/30 rounded-xl shadow-[0_0_14px_rgba(239,68,68,0.25)] bg-background">
            <div className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {comprehensiveReport && (
          <div className="space-y-8">
            {formatReportContent(comprehensiveReport)}
          </div>
        )}

        {!comprehensiveReport && !loading && (
          <Card className="glass-card bg-background shadow-[0_0_18px_rgba(255,102,0,0.25)]">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Report Not Available</h3>
              <p className="text-muted-foreground mb-6">
                Your comprehensive diagnostic report is not available. Please ensure you have completed the diagnostic process.
              </p>
              <Button className="neon-cta" onClick={() => router.push('/diagnostic')}>
                Complete Diagnostic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
