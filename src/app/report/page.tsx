'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle, CheckCircle, Brain, Target, Sparkles, Heart, BookOpen, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'

interface DiagnosticResult {
  question: string
  response: string
  insight: string
  timestamp: string
}

export default function ReportPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [keyInsights, setKeyInsights] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [comprehensiveReport, setComprehensiveReport] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [paymentFormLoading, setPaymentFormLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAccess = async () => {
    try {
      setCheckingAccess(true)
      
      // Check if user has purchased the diagnostic report
      const response = await fetch('/api/payments/user-purchases')
      if (response.ok) {
        const data = await response.json()
        const hasDiagnosticAccess = data.some((purchase: any) => 
          purchase.product === 'diagnostic'
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

      // Load summary and key insights
      const summaryResponse = await fetch('/api/diagnostic/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData.summary || '')
        setKeyInsights(summaryData.keyInsights || '')
      }

      // Load comprehensive report
      const reportResponse = await fetch('/api/diagnostic/comprehensive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setComprehensiveReport(reportData.report || '')
      }
    } catch (err) {
      console.error('Error loading report data:', err)
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseReport = async () => {
    try {
      setGeneratingReport(true)
      
      // Get the PaymentForm component reference to call onLoadingComplete
      const paymentForm = document.querySelector('[data-payment-form]') as any
      
      // Check if report already exists (it should have been generated during payment)
      const existingReportResponse = await fetch('/api/diagnostic/comprehensive-report', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (existingReportResponse.ok) {
        const reportData = await existingReportResponse.json()
        if (reportData.report) {
          setComprehensiveReport(reportData.report)
          setPaymentSuccess(true)
          setShowPaywall(false)
          setHasAccess(true)
          setGeneratingReport(false)
          setPaymentFormLoading(false)
          return
        }
      }
      
      // If no existing report, generate a new one
      const reportResponse = await fetch('/api/diagnostic/comprehensive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setComprehensiveReport(reportData.report || '')
        setPaymentSuccess(true)
        setShowPaywall(false)
        setHasAccess(true)
        setPaymentFormLoading(false)
      } else {
        throw new Error('Failed to generate report')
      }
    } catch (err) {
      console.error('Error generating report:', err)
      setError('Failed to generate comprehensive report')
    } finally {
      setGeneratingReport(false)
      setPaymentFormLoading(false)
    }
  }

  const formatReportContent = (content: string) => {
    if (!content) return null

    const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n')
      const title = lines[0].trim()
      const content = lines.slice(1).join('\n').trim()
      
      if (!content) return null
      
      return (
        <Card key={index} variant="feature" className="mb-6 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-foreground">
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
              {content.split('\n').map((line, lineIndex) => {
                if (line.trim().startsWith('•')) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span className="text-foreground">{line.substring(1).trim()}</span>
                    </div>
                  )
                } else if (line.trim().match(/^\d+\./)) {
                  // Handle numbered roadmap items
                  return (
                    <div key={lineIndex} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                      <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                        {line.match(/^\d+\./)?.[0]}
                      </Badge>
                      <span className="text-foreground font-medium">{line.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  )
                } else if (line.trim() && !line.trim().startsWith('#')) {
                  return (
                    <div key={lineIndex} className="p-3 rounded-lg bg-background border border-border/50">
                      <span className="text-foreground font-medium">{line.trim()}</span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </CardContent>
        </Card>
      )
    })
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="glass" className="max-w-md mx-auto text-center p-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-muted-foreground">Checking your access...</p>
        </Card>
      </div>
    )
  }

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-6">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h1 className="responsive-heading text-foreground mb-4">Your Comprehensive Diagnostic Report</h1>
            <p className="responsive-body text-muted-foreground mb-8">
              Unlock your personalized trauma analysis, healing roadmap, and actionable recommendations
            </p>
          </div>
          
          <Card variant="modern" className="max-w-2xl mx-auto">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  📊
                </div>
                Complete Diagnostic Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-foreground">What's Included:</h3>
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
                
                <PaymentForm
                  productType="diagnostic"
                  amount={999}
                  onSuccess={handlePurchaseReport}
                  onCancel={() => router.push('/dashboard')}
                  setPaymentFormLoading={setPaymentFormLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="glass" className="max-w-md mx-auto text-center p-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Generating Your Report</h3>
          <p className="text-muted-foreground mb-4">Our AI is analyzing your responses and creating your personalized comprehensive report...</p>
          <div className="w-full bg-muted rounded-full h-3 mb-4">
            <div className="bg-primary h-3 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-6">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="responsive-heading text-foreground mb-4">Your Comprehensive Diagnostic Report</h1>
          <p className="responsive-body text-muted-foreground mb-6">
            Based on your {questionCount} diagnostic responses
          </p>
          
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
              variant="primary"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {error && (
          <Card variant="destructive" className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {comprehensiveReport && (
          <div className="space-y-8">
            {formatReportContent(comprehensiveReport)}
          </div>
        )}

        {!comprehensiveReport && !loading && (
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/20 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Report Not Available</h3>
              <p className="text-muted-foreground mb-6">
                Your comprehensive diagnostic report is not available. Please ensure you have completed the diagnostic process.
              </p>
              <Button variant="primary" onClick={() => router.push('/diagnostic')}>
                Complete Diagnostic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
