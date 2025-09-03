'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, Download, Brain, Target, Sparkles, Heart, BookOpen, TrendingUp } from 'lucide-react'
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
  const router = useRouter()

  useEffect(() => {
    loadResults()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      } catch {
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
      // Generate comprehensive report
      const response = await fetch('/api/diagnostic/comprehensive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate comprehensive report')
      }

      const data = await response.json()
      setComprehensiveReport(data.report || '')
      setShowPaywall(false)
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate comprehensive report')
    }
  }

  const handlePaymentSuccess = async (type: 'diagnostic' | 'program') => {
    if (type === 'diagnostic') {
      await handlePurchaseReport()
    } else if (type === 'program') {
      router.push('/program')
    }
  }

  const formatReportContent = (report: string) => {
    // Parse the report content and format it for display
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

    // Simple parsing - in a real app, you'd want more robust parsing
    const lines = report.split('\n')
    let currentSection = ''
    
    lines.forEach(line => {
      if (line.includes('Executive Summary')) currentSection = 'executiveSummary'
      else if (line.includes('Trauma Analysis')) currentSection = 'traumaAnalysis'
      else if (line.includes('Toxicity Score')) currentSection = 'toxicityScore'
      else if (line.includes('Strengths')) currentSection = 'strengths'
      else if (line.includes('Most Important')) currentSection = 'mostImportant'
      else if (line.includes('Behavioral Patterns')) currentSection = 'behavioralPatterns'
      else if (line.includes('Healing Roadmap')) currentSection = 'healingRoadmap'
      else if (line.includes('Actionable Recommendations')) currentSection = 'actionableRecommendations'
      else if (line.includes('Resources')) currentSection = 'resources'
      else if (currentSection && line.trim()) {
        sections[currentSection as keyof typeof sections] += line + '\n'
      }
    })

    return `
      <div class="space-y-8">
        <!-- Executive Summary -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-primary/20 pb-2">
            <span class="text-2xl">🎯</span>
            Executive Summary
          </h2>
          <div class="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.executiveSummary.split('\n').map((line, _) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-primary mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🎯')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Trauma Analysis -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-destructive/20 pb-2">
            <span class="text-2xl">🧠</span>
            Trauma Analysis
          </h2>
          <div class="bg-destructive/5 p-6 rounded-lg border border-destructive/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.traumaAnalysis.split('\n').map((line, _) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-destructive mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🧠')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Toxicity Score Assessment -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-warning/20 pb-2">
            <span class="text-2xl">📊</span>
            Toxicity Score Assessment
          </h2>
          <div class="bg-warning/5 p-6 rounded-lg border border-warning/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.toxicityScore.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-warning mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('📊')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- How to Lean Into Your Strengths -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-success/20 pb-2">
            <span class="text-2xl">💪</span>
            How to Lean Into Your Strengths
          </h2>
          <div class="bg-success/5 p-6 rounded-lg border border-success/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.strengths.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-success mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('💪')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Most Important to Address -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-warning/20 pb-2">
            <span class="text-2xl">🚨</span>
            Most Important to Address
          </h2>
          <div class="bg-warning/5 p-6 rounded-lg border border-warning/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.mostImportant.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-warning mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🚨')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Behavioral Patterns -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-primary/20 pb-2">
            <span class="text-2xl">🔄</span>
            Behavioral Patterns
          </h2>
          <div class="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.behavioralPatterns.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-primary mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🔄')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Healing Roadmap -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-primary/20 pb-2">
            <span class="text-2xl">🛣️</span>
            Healing Roadmap
          </h2>
          <div class="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <div class="space-y-4">
              ${sections.healingRoadmap.split('\n').map((line, index) => {
                if (line.trim().match(/^\d+\./)) {
                  const match = line.match(/^\d+/)
                  if (match) {
                    return `<div class="flex items-start gap-3 p-3 bg-background rounded-lg border border-primary/20">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">${match[0]}</div>
                      <div class="flex-1 text-foreground">${line.replace(/^\d+\.\s*/, '')}</div>
                    </div>`
                  }
                } else if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2 ml-4"><span class="text-primary mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('🛣️')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Actionable Recommendations -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-success/20 pb-2">
            <span class="text-2xl">⚡</span>
            Actionable Recommendations
          </h2>
          <div class="bg-success/5 p-6 rounded-lg border border-success/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.actionableRecommendations.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-success mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('⚡')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
                }
                return null
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>

        <!-- Resources and Next Steps -->
        <div>
          <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-2 border-b-2 border-muted-foreground/20 pb-2">
            <span class="text-2xl">📚</span>
            Resources and Next Steps
          </h2>
          <div class="bg-muted/30 p-6 rounded-lg border border-muted-foreground/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.resources.split('\n').map((line, index) => {
                if (line.trim().startsWith('•')) {
                  return `<div class="flex items-start gap-2"><span class="text-muted-foreground mt-1">•</span><span>${line.substring(1).trim()}</span></div>`
                } else if (line.trim() && !line.trim().startsWith('📚')) {
                  return `<div class="font-medium text-foreground">${line.trim()}</div>`
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

      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'diagnostic-report.txt'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting report:', error)
      setError('Failed to export report')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Loading Your Results</h2>
                <p className="text-muted-foreground">Analyzing your diagnostic responses...</p>
              </div>
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
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Results</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={loadResults} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="responsive-heading text-foreground">Your Diagnostic Results</h1>
              <p className="responsive-body text-muted-foreground">Discover insights about yourself and your healing journey</p>
            </div>
          </div>
          
          {/* Progress Summary */}
          <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-4 py-2 border border-accent/30">
            <CheckCircle className="h-5 w-5 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">
              {questionCount} questions completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary Card */}
            {summary && (
              <Card className="feature-card border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl font-semibold text-foreground">Diagnostic Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed">{summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Insights Card */}
            {keyInsights && (
              <Card className="feature-card border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b border-accent/20">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-accent-foreground" />
                    <CardTitle className="text-xl font-semibold text-foreground">Key Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {keyInsights.split('\n').filter(line => line.trim()).map((insight, index) => (
                      <div key={index} className="border-l-4 border-accent pl-4 py-2">
                        <p className="text-foreground leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button 
                onClick={handleStartProgram}
variant="default"
                size="lg"
                className="h-16 text-lg flex items-center gap-3 group hover:scale-105 transition-transform duration-200"
              >
                <Heart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                Start Your 30-Day Healing Program
              </Button>
              
              <Button 
                onClick={handleViewReport}
                variant="outline"
                size="lg"
                className="h-16 text-lg group hover:scale-105 transition-transform duration-200"
              >
                <BookOpen className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                View Full Diagnostic Report
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Your personalized healing journey is ready to begin. 
                The program has been tailored based on your diagnostic responses.
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="feature-card border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold text-foreground">Your Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Questions Completed</span>
                    <Badge variant="success" className="text-xs">
                      {questionCount}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Insights Generated</span>
                    <Badge variant="info" className="text-xs">
                      {results.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <Badge variant="gradient" className="text-xs">
                      100%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b border-accent/20">
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-5 w-5 text-accent-foreground" />
                  <CardTitle className="text-lg font-semibold text-foreground">Next Steps</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• Review your diagnostic summary</p>
                  <p>• Explore key insights</p>
                  <p>• Start your healing program</p>
                  <p>• Get your full report</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Diagnostic Report Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="glass-card w-full max-w-md border-0 shadow-2xl">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="p-3 rounded-full bg-warning/10 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Comprehensive Diagnostic Report</h2>
                <p className="text-muted-foreground">
                  Get your complete trauma analysis, personality profile, and personalized healing roadmap.
                </p>
              </div>
              <PaymentForm
                productName="Comprehensive Diagnostic Report"
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="glass-card w-full max-w-md border-0 shadow-2xl">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="p-3 rounded-full bg-primary/10 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">30-Day Healing Program</h2>
                <p className="text-muted-foreground">
                  Access your personalized 30-day healing journey with daily tasks, journaling, and AI guidance.
                </p>
              </div>
              <PaymentForm
                productName="30-Day Healing Program"
                amount={2995} // $29.95 in cents
                onSuccess={() => handlePaymentSuccess('program')}
                onCancel={() => setShowProgramPaywall(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      

      {/* Comprehensive Report Display */}
      {comprehensiveReport && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="glass-card w-full max-w-5xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🔍</div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Comprehensive Diagnostic Report</CardTitle>
                    <p className="text-primary-foreground/80 mt-1">Your personalized trauma analysis & healing roadmap</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => exportToPDF()}
                    variant="secondary"
                    size="sm"
                    className="bg-background text-primary hover:bg-background/80"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save Report
                  </Button>
                  <Button 
                    onClick={() => setComprehensiveReport('')}
                    variant="outline"
                    size="sm"
                    className="border-background text-background hover:bg-background hover:text-primary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <div 
                  className="text-foreground leading-relaxed"
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