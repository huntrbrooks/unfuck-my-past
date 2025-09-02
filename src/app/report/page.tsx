'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, AlertTriangle, CheckCircle } from 'lucide-react'
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
  }, [])

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
      
      let bgColor = 'bg-blue-50'
      let borderColor = 'border-blue-200'
      let textColor = 'text-blue-600'
      
      if (title.includes('Executive Summary')) {
        bgColor = 'bg-purple-50'
        borderColor = 'border-purple-200'
        textColor = 'text-purple-600'
      } else if (title.includes('Trauma Analysis')) {
        bgColor = 'bg-red-50'
        borderColor = 'border-red-200'
        textColor = 'text-red-600'
      } else if (title.includes('Toxicity Score')) {
        bgColor = 'bg-orange-50'
        borderColor = 'border-orange-200'
        textColor = 'text-orange-600'
      } else if (title.includes('Strengths')) {
        bgColor = 'bg-green-50'
        borderColor = 'border-green-200'
        textColor = 'text-green-600'
      } else if (title.includes('Most Important to Address')) {
        bgColor = 'bg-yellow-50'
        borderColor = 'border-yellow-200'
        textColor = 'text-yellow-600'
      } else if (title.includes('Behavioral Patterns')) {
        bgColor = 'bg-indigo-50'
        borderColor = 'border-indigo-200'
        textColor = 'text-indigo-600'
      } else if (title.includes('Healing Roadmap')) {
        bgColor = 'bg-teal-50'
        borderColor = 'border-teal-200'
        textColor = 'text-teal-600'
      } else if (title.includes('Actionable Recommendations')) {
        bgColor = 'bg-pink-50'
        borderColor = 'border-pink-200'
        textColor = 'text-pink-600'
      } else if (title.includes('Resources')) {
        bgColor = 'bg-gray-50'
        borderColor = 'border-gray-200'
        textColor = 'text-gray-600'
      }
      
      return (
        <div key={index} className={`${bgColor} p-6 rounded-lg border ${borderColor} mb-6`}>
          <h3 className={`font-bold text-lg mb-4 ${textColor} border-b ${borderColor} pb-2`}>
            {title}
          </h3>
          <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
            {content.split('\n').map((line, lineIndex) => {
              if (line.trim().startsWith('•')) {
                return (
                  <div key={lineIndex} className="flex items-start gap-2">
                    <span className={`${textColor} mt-1`}>•</span>
                    <span>{line.substring(1).trim()}</span>
                  </div>
                )
              } else if (line.trim().match(/^\d+\./)) {
                // Handle numbered roadmap items
                return (
                  <div key={lineIndex} className="flex items-start gap-2">
                    <span className={`${textColor} font-bold`}>{line.match(/^\d+\./)?.[0]}</span>
                    <span>{line.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                )
              } else if (line.trim() && !line.trim().startsWith('#')) {
                return <div key={lineIndex} className="font-medium text-gray-800">{line.trim()}</div>
              }
              return null
            })}
          </div>
        </div>
      )
    })
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking your access...</p>
        </div>
      </div>
    )
  }

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Your Comprehensive Diagnostic Report</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Unlock your personalized trauma analysis, healing roadmap, and actionable recommendations
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Complete Diagnostic Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">What's Included:</h3>
                <ul className="text-left space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Executive Summary & Trauma Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Toxicity Score Assessment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Personal Strengths & Growth Areas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Behavioral Pattern Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Custom Healing Roadmap
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Actionable Recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Resources & Next Steps
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">$9.99</div>
                <p className="text-gray-600 mb-6">One-time purchase • Lifetime access</p>
                
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
        <div className="text-center max-w-md">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Your Comprehensive Diagnostic Report</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Based on your {questionCount} diagnostic responses
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/api/export'
                link.download = 'diagnostic-report.pdf'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-8 border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
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
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Report Not Available</h3>
              <p className="text-muted-foreground mb-4">
                Your comprehensive diagnostic report is not available. Please ensure you have completed the diagnostic process.
              </p>
              <Button onClick={() => router.push('/diagnostic')}>
                Complete Diagnostic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
