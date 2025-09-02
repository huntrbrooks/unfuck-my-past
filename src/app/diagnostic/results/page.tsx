'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'

interface DiagnosticResult {
  question: string
  response: string
  insight: string
  timestamp: string
}

export default function DiagnosticResults() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [keyInsights, setKeyInsights] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [showProgramPaywall, setShowProgramPaywall] = useState(false)
  const [comprehensiveReport, setComprehensiveReport] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      
      // Load diagnostic responses
      const responsesResponse = await fetch('/api/diagnostic/responses')
      if (responsesResponse.ok) {
        const data = await responsesResponse.json()
        console.log('Diagnostic responses loaded:', data)
        setResults(data.responses || [])
        setQuestionCount(data.responses?.length || 0)
      } else {
        console.error('Failed to load responses:', responsesResponse.status)
      }

      // Also try to get question count from diagnostic questions API
      try {
        const questionsResponse = await fetch('/api/diagnostic/questions')
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json()
          if (questionsData.questions && questionsData.questions.length > 0) {
            setQuestionCount(questionsData.questions.length)
          }
        }
      } catch (questionsErr) {
        console.log('Could not fetch questions count, using responses count')
      }

      // Force regenerate summary and key insights by making a POST request
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
      } else {
        console.error('Failed to load summary:', summaryResponse.status)
      }
    } catch (err) {
      console.error('Error loading results:', err)
      setError('Failed to load diagnostic results')
    } finally {
      setLoading(false)
    }
  }

  const handleStartProgram = () => {
    setShowProgramPaywall(true)
  }

  const handleViewReport = () => {
    setShowPaywall(true)
  }

  const handlePurchaseReport = async () => {
    try {
      setGeneratingReport(true)
      
      // Generate comprehensive report
      const response = await fetch('/api/diagnostic/comprehensive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setComprehensiveReport(data.report)
        setPaymentProcessing(false)
        setPaymentSuccess(true)
      } else {
        throw new Error('Failed to generate report')
      }
    } catch (err) {
      setError('Failed to generate comprehensive report')
      setPaymentProcessing(false)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handlePaymentSuccess = (productType: 'diagnostic' | 'program') => {
    setPaymentProcessing(true)
    setShowPaywall(false)
    setShowProgramPaywall(false)
    
    if (productType === 'diagnostic') {
      handlePurchaseReport()
    } else if (productType === 'program') {
      // Simulate processing time for program access
      setTimeout(() => {
        setPaymentProcessing(false)
        setPaymentSuccess(true)
        setTimeout(() => {
          router.push('/program')
        }, 3000)
      }, 2000)
    }
  }

  const formatReportContent = (content: string) => {
    const sections = {
      executiveSummary: '',
      traumaAnalysis: '',
      toxicityScore: '',
      strengths: '',
      mostImportant: '',
      behavioralPatterns: '',
      healingRoadmap: '',
      actionableRecommendations: '',
      resources: ''
    }

    const lines = content.split('\n')
    let currentSection = ''
    
    for (const line of lines) {
      // Check for section headers
      if (line.includes('🎯 EXECUTIVE SUMMARY')) {
        currentSection = 'executiveSummary'
      } else if (line.includes('🧠 TRAUMA ANALYSIS')) {
        currentSection = 'traumaAnalysis'
      } else if (line.includes('📊 TOXICITY SCORE ASSESSMENT')) {
        currentSection = 'toxicityScore'
      } else if (line.includes('💪 HOW TO LEAN INTO YOUR STRENGTHS')) {
        currentSection = 'strengths'
      } else if (line.includes('🚨 MOST IMPORTANT TO ADDRESS')) {
        currentSection = 'mostImportant'
      } else if (line.includes('🔄 BEHAVIORAL PATTERNS')) {
        currentSection = 'behavioralPatterns'
      } else if (line.includes('🛣️ HEALING ROADMAP')) {
        currentSection = 'healingRoadmap'
      } else if (line.includes('⚡ ACTIONABLE RECOMMENDATIONS')) {
        currentSection = 'actionableRecommendations'
      } else if (line.includes('📚 RESOURCES AND NEXT STEPS')) {
        currentSection = 'resources'
      } else if (currentSection && line.trim()) {
        if (currentSection in sections) {
          sections[currentSection as keyof typeof sections] += line + '\n'
        }
      }
    }

    // Ensure all sections have content
    Object.keys(sections).forEach(key => {
      const sectionKey = key as keyof typeof sections
      if (!sections[sectionKey]) {
        sections[sectionKey] = 'Content not available'
      }
    })

    return `
      <div class="space-y-8">
        <!-- Executive Summary -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-purple-200 pb-2">
            <span class="text-2xl">🎯</span>
            Executive Summary
          </h2>
          <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.executiveSummary.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-purple-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🎯')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Trauma Analysis -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-blue-200 pb-2">
            <span class="text-2xl">🧠</span>
            Trauma Analysis
          </h2>
          <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.traumaAnalysis.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-blue-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🧠')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Toxicity Score Assessment -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-red-200 pb-2">
            <span class="text-2xl">📊</span>
            Toxicity Score Assessment
          </h2>
          <div class="bg-red-50 p-6 rounded-lg border border-red-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.toxicityScore.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-red-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('📊')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- How to Lean Into Your Strengths -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-green-200 pb-2">
            <span class="text-2xl">💪</span>
            How to Lean Into Your Strengths
          </h2>
          <div class="bg-green-50 p-6 rounded-lg border border-green-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.strengths.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-green-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('💪')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Most Important to Address -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-orange-200 pb-2">
            <span class="text-2xl">🚨</span>
            Most Important to Address
          </h2>
          <div class="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.mostImportant.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-orange-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🚨')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Behavioral Patterns -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-indigo-200 pb-2">
            <span class="text-2xl">🔄</span>
            Behavioral Patterns
          </h2>
          <div class="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.behavioralPatterns.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-indigo-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🔄')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Healing Roadmap -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-teal-200 pb-2">
            <span class="text-2xl">🛣️</span>
            Healing Roadmap
          </h2>
          <div class="bg-teal-50 p-6 rounded-lg border border-teal-200">
            <div class="space-y-4">
              ${sections.healingRoadmap.split('\n').map((line, index) => {
                if (line.trim().match(/^\d+\./)) {
                  const match = line.match(/^\d+/)
                  if (match) {
                    return `<div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-200">
                      <div class="flex-shrink-0 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm">${match[0]}</div>
                      <div class="flex-1 text-gray-700">${line.replace(/^\d+\.\s*/, '')}</div>
                    </div>`
                  }
                } else if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2 ml-4"><span class="text-teal-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🛣️')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Actionable Recommendations -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-yellow-200 pb-2">
            <span class="text-2xl">⚡</span>
            Actionable Recommendations
          </h2>
          <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.actionableRecommendations.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-yellow-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('⚡')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Resources and Next Steps -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2 border-b-2 border-pink-200 pb-2">
            <span class="text-2xl">📚</span>
            Resources and Next Steps
          </h2>
          <div class="bg-pink-50 p-6 rounded-lg border border-pink-200">
            <div class="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
              ${sections.resources.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-pink-600 mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('📚')) {
                  return `<div class="font-medium text-gray-800">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>
      </div>
    `
  }

  const exportToPDF = async () => {
    try {
      const response = await fetch('/api/diagnostic/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report: comprehensiveReport,
          summary: summary,
          keyInsights: keyInsights
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'comprehensive-diagnostic-report.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to generate PDF')
      }
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your diagnostic results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-semibold text-red-700">Error</h2>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/diagnostic')} className="w-full">
              Return to Diagnostic
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900">Diagnostic Complete!</h1>
          </div>
          <p className="text-gray-600 text-lg">
            You've completed {questionCount > 0 ? questionCount : results.length || 'your'} diagnostic questions. Here's what we found:
          </p>
        </div>

        {/* Progress Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Questions Completed</span>
                <Badge variant="secondary">{questionCount > 0 ? questionCount : results.length}</Badge>
              </div>
              <Progress value={100} className="w-full" />
              <p className="text-sm text-gray-600">
                All diagnostic questions have been completed successfully.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Diagnostic Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">{summary}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Insights */}
        {keyInsights && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keyInsights.split('\n').filter(line => line.trim()).map((insight, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                    <p className="text-gray-700 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleStartProgram}
            className="h-16 text-lg flex items-center gap-3"
          >
            <ArrowRight className="h-5 w-5" />
            Start Your 30-Day Healing Program
          </Button>
          
          <Button 
            onClick={handleViewReport}
            variant="outline"
            className="h-16 text-lg"
          >
            View Full Diagnostic Report
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Your personalized healing journey is ready to begin. 
            The program has been tailored based on your diagnostic responses.
          </p>
        </div>
      </div>

      {/* Diagnostic Report Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Diagnostic Report</h2>
                <p className="text-gray-600">
                  Get your complete trauma analysis, personality profile, and personalized healing roadmap.
                </p>
              </div>
              <PaymentForm
                productType="diagnostic"
                amount={1000} // $10.00 in cents
                onSuccess={() => handlePaymentSuccess('diagnostic')}
                onCancel={() => setShowPaywall(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 30-Day Program Paywall Modal */}
      {showProgramPaywall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">30-Day Healing Program</h2>
                <p className="text-gray-600">
                  Access your personalized 30-day healing journey with daily tasks, journaling, and AI guidance.
                </p>
              </div>
              <PaymentForm
                productType="program"
                amount={2995} // $29.95 in cents
                onSuccess={() => handlePaymentSuccess('program')}
                onCancel={() => setShowProgramPaywall(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Processing Modal */}
      {paymentProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
              <p className="text-gray-600 mb-4">Please wait while we securely process your payment...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for investing in your healing journey. Your comprehensive diagnostic report is being generated with deep insights and personalized recommendations.
              </p>
              <Button 
                onClick={() => setPaymentSuccess(false)}
                className="w-full"
              >
                Continue to Your Report
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comprehensive Report Display */}
      {comprehensiveReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🔍</div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Comprehensive Diagnostic Report</CardTitle>
                    <p className="text-purple-100 mt-1">Your personalized trauma analysis & healing roadmap</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => exportToPDF()}
                    variant="secondary"
                    size="sm"
                    className="bg-white text-purple-600 hover:bg-purple-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save PDF
                  </Button>
                  <Button 
                    onClick={() => setComprehensiveReport('')}
                    variant="outline"
                    size="sm"
                    className="border-white text-white hover:bg-white hover:text-purple-600"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatReportContent(comprehensiveReport) }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}