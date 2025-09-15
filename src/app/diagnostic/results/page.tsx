'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, Download, Target, Sparkles, Heart, BookOpen, TrendingUp } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import PaymentForm from '@/components/PaymentForm'
import FullReportGenerationLoader from '@/components/FullReportGenerationLoader'
import DiagnosticAnalysisLoader from '@/components/DiagnosticAnalysisLoader'
import DiagnosticCompletionPrompt from '@/components/DiagnosticCompletionPrompt'
import DiagnosticFreeCompletionPrompt from '@/components/DiagnosticFreeCompletionPrompt'
import DiagnosticPreview from '@/components/DiagnosticPreview'
import { useRequireOnboardingAndDiagnostic } from '@/hooks/use-access-guard'

interface DiagnosticResult {
  question: string
  response: string
  insight: string
  timestamp: string
}

export default function DiagnosticResults() {
  console.log('🔄 DiagnosticResults component rendering...')
  const { user, isLoaded } = useUser()
  const { checking, allowed } = useRequireOnboardingAndDiagnostic()
  console.log('👤 Auth state:', { isLoaded, hasUser: !!user })
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [keyInsights, setKeyInsights] = useState('')
  const [showProgramPaywall, setShowProgramPaywall] = useState(false)
  const [comprehensiveReport, setComprehensiveReport] = useState('')
  const [showAnalysisLoader, setShowAnalysisLoader] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(1)
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)
  const [showFreeCompletionPrompt, setShowFreeCompletionPrompt] = useState(false)
  const [poeticMessage, setPoeticMessage] = useState('')
  const [isPaidFlow, setIsPaidFlow] = useState(false)
  const [useStructuredPreview, setUseStructuredPreview] = useState(true)
  const [questions, setQuestions] = useState<{ id: string; prompt: string }[]>([])
  const [answers, setAnswers] = useState<{ id: string; text: string }[]>([])
  // removed test regeneration controls
  const [previewReady, setPreviewReady] = useState(false)
  const [backgroundPreviewStarted, setBackgroundPreviewStarted] = useState(false)
  const loaderFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const COMPLETION_SEEN_AT_KEY = 'uyp_completion_prompt_seen_at'

  // Derive a breakdown heading and items from keyInsights for display
  const breakdownData = React.useMemo(() => {
    const lines = (keyInsights || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    let heading = lines.length > 0 ? lines[0] : ''
    if (heading) {
      // Normalize wording: insights -> breakdowns (plural)
      heading = heading
        .replace(/insights?/gi, 'breakdowns')
        .replace(/breakdown\s+based/gi, 'breakdowns based')
        .replace(/\s*:\s*$/, ':')
    }

    // Clean bullet symbols from items and separate final footnote
    const cleaned = lines.slice(1).map(l => l.replace(/^(?:•|\*|-)\s*/, ''))
    const footnote = cleaned.length > 0 ? cleaned[cleaned.length - 1] : ''
    const items = cleaned.slice(0, Math.max(0, cleaned.length - 1))

    return { heading, items, footnote }
  }, [keyInsights])

  useEffect(() => {
    console.log('🔄 useEffect triggered:', { isLoaded, hasUser: !!user })
    if (isLoaded) {
      if (user) {
        console.log('✅ User authenticated, loading results...')
        loadResults()
      } else {
        // User not authenticated, show error message
        console.log('❌ User not authenticated')
        setError('Please sign in to view your prognostic results')
        setLoading(false)
      }
    } else {
      console.log('⏳ Clerk still loading...')
    }
  }, [isLoaded, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start/advance loader at 4s per step and keep at step 5 until preview is ready
  useEffect(() => {
    if (showAnalysisLoader) {
      // begin background generation as early as possible
      maybeStartBackgroundPreview()

      const stepInterval = setInterval(() => {
        setAnalysisStep(prev => (prev < 5 ? prev + 1 : prev))
      }, 4000) // 4 seconds per step

      // poll for preview readiness once per 2s
      const pollInterval = setInterval(async () => {
        if (previewReady) return
        try {
          const r = await fetch('/api/diagnostic/preview', { method: 'GET' })
          if (r.ok) {
            const data = await r.json()
            if (data && data.diagnosticSummary) {
              setPreviewReady(true)
            }
          }
        } catch {}
      }, 2000)

      // fallback: force completion after 45s even if cache polling misses readiness
      loaderFallbackTimerRef.current = setTimeout(() => {
        if (!previewReady) {
          setPreviewReady(true)
        }
      }, 45000)

      return () => {
        clearInterval(stepInterval)
        clearInterval(pollInterval)
        if (loaderFallbackTimerRef.current) {
          clearTimeout(loaderFallbackTimerRef.current)
          loaderFallbackTimerRef.current = null
        }
      }
    }
  }, [showAnalysisLoader])

  // Ensure background preview starts when data arrives while loader is visible
  useEffect(() => {
    if (showAnalysisLoader) {
      maybeStartBackgroundPreview()
    }
  }, [showAnalysisLoader, questions.length, answers.length])

  // When preview is ready and loader has reached the final stage, show the completion prompt
  useEffect(() => {
    if (showAnalysisLoader && previewReady && analysisStep >= 5) {
            generatePoeticMessage()
              setShowAnalysisLoader(false)
      if (isPaidFlow) setShowCompletionPrompt(true)
      else setShowFreeCompletionPrompt(true)
      if (loaderFallbackTimerRef.current) {
        clearTimeout(loaderFallbackTimerRef.current)
        loaderFallbackTimerRef.current = null
      }
    }
  }, [showAnalysisLoader, previewReady, analysisStep, isPaidFlow])

  const maybeStartBackgroundPreview = async () => {
    if (backgroundPreviewStarted) return
    if (!(questions.length > 0 && answers.length >= 3)) return
    setBackgroundPreviewStarted(true)
    // Ensure the proper analysis loader plays during generation for free flow
    if (!isPaidFlow && !showAnalysisLoader) {
      setAnalysisStep(1)
      setShowAnalysisLoader(true)
    }
    try {
      const resp = await fetch('/api/diagnostic/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers, miniSummaries: [], crisisNow: false })
      })
      if (resp.ok) setPreviewReady(true)
    } catch {}
  }

  const generatePoeticMessage = async () => {
    try {
      // Generate a poetic message based on user responses
      const responses = results.map(r => r.response).join(' ')
      const prompt = `Based on these diagnostic responses, create a poetic, inspiring 4-line message about resilience, transformation, and healing. Keep it personal and empowering: "${responses.substring(0, 500)}"`
      
      // For now, use a default poetic message
      // In production, you could call an AI API to generate personalized messages
      const messages = [
        `Through shadows deep, you've found your light,
Each scar a story of your fight.
The past has shaped but not defined—
A warrior's heart, a healing mind.`,
        
        `In broken places, strength takes root,
Your journey bears the sweetest fruit.
What tried to break you made you whole,
A phoenix rising, reclaimed soul.`,
        
        `Your wounds became your wisdom's door,
Each fall prepared you to soar more.
The darkness taught you how to shine,
Your story's power, now divine.`,
        
        `From ashes of what used to be,
You've written your recovery.
Each breath a victory hard-won,
Your healing journey's just begun.`
      ]
      
      // Select a random poetic message for variety
      const selectedMessage = messages[Math.floor(Math.random() * messages.length)]
      setPoeticMessage(selectedMessage)
    } catch (error) {
      console.error('Error generating poetic message:', error)
      // Fallback message
      setPoeticMessage(`Your story speaks of courage found in pain,
Of strength that rises from the deepest rain.
Each answer shared reveals a soul that's fighting,
A path ahead that's bright and full of lighting.`)
    }
  }

  const loadResults = async () => {
    try {
      console.log('🔄 Starting loadResults...')
      setLoading(true)
      setError('') // Clear any previous errors
      let hasSavedSummary = false
      
      // Load diagnostic responses
      console.log('🔄 Fetching diagnostic responses...')
      const responsesController = new AbortController()
      const responsesTimeout = setTimeout(() => responsesController.abort(), 12000)
      const responsesResponse = await fetch('/api/diagnostic/responses', {
        signal: responsesController.signal
      })
      clearTimeout(responsesTimeout)
      console.log('📡 Responses API status:', responsesResponse.status)
      if (responsesResponse.ok) {
        const data = await responsesResponse.json()
        console.log('Diagnostic responses loaded:', data)
        console.log('📊 Response data:', JSON.stringify(data, null, 2))
        setResults(data.responses || [])
        setQuestionCount(data.responses?.length || 0)
        
        // Format responses for structured preview
        const formattedAnswers = (data.responses || []).map((resp: any, index: number) => ({
          id: `q${index + 1}`,
          text: resp.response || ''
        }))
        setAnswers(formattedAnswers)
        console.log('📊 Formatted answers:', formattedAnswers.length)
        
        // Load existing summary first to determine if we should bypass the analysis loader on revisit
        try {
          console.log('🔄 Fetching prognostic summary (pre-check)...')
          const sController = new AbortController()
          const sTimeout = setTimeout(() => sController.abort(), 10000)
          const summaryResponse = await fetch('/api/diagnostic/summary', { method: 'GET', signal: sController.signal })
          clearTimeout(sTimeout)
          console.log('📡 Summary API status (pre-check):', summaryResponse.status)
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json()
            if ((summaryData.summary && summaryData.summary.length > 0) || (summaryData.keyInsights && summaryData.keyInsights.length > 0)) {
              hasSavedSummary = true
              setSummary(summaryData.summary || '')
              setKeyInsights(summaryData.keyInsights || '')
            }
          }
        } catch (error) {
          console.error('❌ Error pre-checking summary:', error)
        }

        // Decide whether to show analysis loader and begin preview generation (skip if saved summary exists)
        try {
          const latest = (data.responses || [])
            .map((r: { timestamp?: string }) => r?.timestamp)
            .filter(Boolean)
            .sort()
            .slice(-1)[0]
          let shouldShow = false
          if (typeof window !== 'undefined') {
            const lastSeen = localStorage.getItem(COMPLETION_SEEN_AT_KEY)
            if (!lastSeen && latest) shouldShow = true
            else if (lastSeen && latest) {
              shouldShow = new Date(latest).getTime() > new Date(lastSeen).getTime()
            }
          }
          if (shouldShow && !hasSavedSummary) {
            setIsPaidFlow(false) // This is the free diagnostic flow
            setShowAnalysisLoader(true)
            // Kick off background preview generation as soon as we have data
            setTimeout(() => { maybeStartBackgroundPreview() }, 0)
          }
        } catch {}
      } else {
        console.error('Failed to load responses:', responsesResponse.status)
        if (responsesResponse.status === 401) {
          // User not authenticated, show error message
          console.log('🚫 User not authenticated, setting error')
          setError('Please sign in to view your prognostic results')
          return
        } else {
          // Other error
          console.log('❌ Other error:', responsesResponse.status)
          setError(`Failed to load responses: ${responsesResponse.status}`)
          return
        }
      }

      // Also try to get question count from diagnostic questions API
      try {
        const qController = new AbortController()
        const qTimeout = setTimeout(() => qController.abort(), 10000)
        const questionsResponse = await fetch('/api/diagnostic/questions', { signal: qController.signal })
        clearTimeout(qTimeout)
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json()
          if (questionsData.questions && questionsData.questions.length > 0) {
            setQuestionCount(questionsData.questions.length)
            
            // Format questions for structured preview
            const formattedQuestions = questionsData.questions.map((q: any, index: number) => ({
              id: `q${index + 1}`,
              prompt: q.question || q.prompt || q.text || `Question ${index + 1}`
            }))
            setQuestions(formattedQuestions)
            console.log('📊 Formatted questions:', formattedQuestions.length)
            
            // Validate data consistency - use answers state since formattedAnswers might not be in scope
            const currentAnswerCount = answers.length
            if (formattedQuestions.length > 0 && currentAnswerCount >= 3) {
              console.log('✅ Sufficient data for structured preview')
              // If loader already showing, ensure background generation starts
              if (showAnalysisLoader) maybeStartBackgroundPreview()
            } else {
              console.log('⚠️ Insufficient data for structured preview:', {
                questions: formattedQuestions.length,
                answers: currentAnswerCount
              })
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch questions count, using responses count')
        console.error('Questions API error:', error)
      }

      // If no saved summary was found earlier, generate once then rely on stored data afterwards
      if (!hasSavedSummary) {
        try {
          console.log('🔄 No existing summary found, generating new one...')
          const rController = new AbortController()
          const rTimeout = setTimeout(() => rController.abort(), 15000)
          const regen = await fetch('/api/diagnostic/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: rController.signal })
          clearTimeout(rTimeout)
          console.log('📡 Summary generation status:', regen.status)
          if (regen.ok) {
            const regenData = await regen.json()
            console.log('✅ Summary generated:', { summary: !!regenData.summary, insights: !!regenData.keyInsights })
            setSummary(regenData.summary || '')
            setKeyInsights(regenData.keyInsights || '')
          } else {
            console.error('❌ Failed to generate summary:', regen.status)
          }
        } catch (error) {
          console.error('❌ Error generating summary:', error)
        }
      }
    } catch (err) {
      console.error('Error loading results:', err)
      setError('Failed to load diagnostic results')
    } finally {
      console.log('✅ loadResults completed, setting loading to false')
      console.log('📊 Final state summary:', {
        questionsLoaded: questions.length,
        answersLoaded: answers.length,
        useStructuredPreview,
        shouldShowStructured: useStructuredPreview && questions.length > 0 && answers.length > 0 && answers.length >= 3
      })
      setLoading(false)
    }
  }

  const handleStartProgram = () => {
    // Before showing the paywall, verify 30-day access window
    ;(async () => {
      try {
        const resp = await fetch('/api/payments/user-purchases')
        if (resp.ok) {
          const data = await resp.json()
          const hasRecentProgram = Array.isArray(data) && data.some((p: { product: string; active: boolean }) => p.product === 'program' && p.active)
          if (hasRecentProgram) {
            router.push('/program')
            return
          }
        }
      } catch {}
      setShowProgramPaywall(true)
    })()
  }

  const handleViewReport = async () => {
    router.push('/report')
  }

  const handleRegeneratePreview = async () => {
    // removed in production
  }

  const handlePurchaseReport = async () => {
    try {
      console.log('🎯 PAYMENT SUCCESS: Starting comprehensive report generation')
      
      // Start the analysis loader for paid flow
      setIsPaidFlow(true)
      setShowAnalysisLoader(true)
      setAnalysisStep(1)
      
      console.log('🎯 FULL REPORT LOADER: Started 5-stage progression')
      
      // Generate comprehensive report in the background
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
      
      console.log('🎯 COMPREHENSIVE REPORT: Generated successfully')
      
      // The analysis loader will handle the progression and show completion prompt
      // (handled by the useEffect that watches showAnalysisLoader)
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate comprehensive report')
      setShowAnalysisLoader(false)
    }
  }


  const handleProgramPaymentSuccess = async (paymentIntent?: { id: string; amount: number; status: string }) => {
    console.log('🎯 PROGRAM PAYMENT SUCCESS:', paymentIntent)
    router.push('/program')
  }

  const handleReadyToContinue = () => {
    setShowCompletionPrompt(false)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPLETION_SEEN_AT_KEY, new Date().toISOString())
      }
    } catch {}
    // Route to the report page to view the full diagnostic report (paid flow)
    router.push('/report')
  }

  const handleFreeCompletionContinue = () => {
    setShowFreeCompletionPrompt(false)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPLETION_SEEN_AT_KEY, new Date().toISOString())
      }
    } catch {}
    // Stay on results page to view free results (no routing needed)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatReportContent = (report: string) => {
    // Strip markdown bold/italics and normalize bullets
    const stripMd = (s: string) => s
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^\s*[-*]\s+/g, '• ')

    const mapHeaderToSection = (rawHeader: string): keyof typeof sections | '' => {
      const h = rawHeader.trim().toLowerCase()
      if (h.includes('executive summary')) return 'executiveSummary'
      if (h.includes('trauma analysis')) return 'traumaAnalysis'
      if (h.includes('toxicity score')) return 'toxicityScore'
      if (h.includes('confidence rating')) return 'toxicityScore'
      if (h.includes('how to lean into your strengths') || h === 'strengths' || h.includes('lean into your strengths')) return 'strengths'
      if (h.includes('most important to address') || h.includes('primary issue') || h.includes('key leverage point')) return 'mostImportant'
      if (h.includes('behavioral patterns') || h.includes('recurring loops')) return 'behavioralPatterns'
      if (h.includes('healing roadmap') || h === 'roadmap') return 'healingRoadmap'
      if (h.includes('actionable recommendations') || h.includes('quick action plan')) return 'actionableRecommendations'
      if (h.includes('resources and next steps') || h === 'resources' || h.includes('professional help')) return 'resources'
      return ''
    }

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

    const cleanReport = stripMd(report)
    const rawLines = cleanReport.split('\n')
    let currentSection: keyof typeof sections | '' = ''
    let previousLine = ''

    rawLines.forEach((rawLine) => {
      let line = stripMd(rawLine).replace(/\s+$/g, '')
      const lower = line.toLowerCase()

      // Detect underlined headers ("HEADER" then "=====")
      if (/^=+$/.test(lower.trim())) {
        const candidate = previousLine.trim()
        const mapped = mapHeaderToSection(candidate)
        if (mapped) {
          currentSection = mapped
          previousLine = ''
          return
        }
      }

      // Case-insensitive header detection (with or without emojis)
      const noEmoji = line.replace(/^[^\w\(\[]+\s*/, '')
      const mappedHeader = mapHeaderToSection(noEmoji)
      if (mappedHeader) {
        currentSection = mappedHeader
        previousLine = line
        return
      }

      if (!currentSection) {
        previousLine = line
        return
      }

      if (!line.trim()) {
        previousLine = line
        return
      }

      // Normalize roadmap inline arrows to numbered steps
      if (currentSection === 'healingRoadmap' && /\s→\s/.test(line)) {
        const parts = line.split(/\s→\s/).map(p => p.trim()).filter(Boolean)
        parts.forEach((p, idx) => {
          sections.healingRoadmap += `${idx + 1}. ${p}\n`
        })
        previousLine = line
        return
      }

      // Convert "1) text" to "1. text" for step rendering
      line = line.replace(/^(\d+)\)\s+/, '$1. ')

      // Ensure bullets are normalized
      if (/^\s*[-*]\s+/.test(line)) {
        line = line.replace(/^\s*[-*]\s+/, '• ')
      }

      sections[currentSection] += line + '\n'
      previousLine = line
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
              ${sections.executiveSummary.split('\n').map((line) => {
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
              ${sections.traumaAnalysis.split('\n').map((line) => {
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
              ${sections.toxicityScore.split('\n').map((line) => {
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
              ${sections.strengths.split('\n').map((line) => {
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
              ${sections.mostImportant.split('\n').map((line) => {
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
          <h2 class="text-xl font-bold mb-3 flex items-center gap-2 border-b-2 border-primary/20 pb-2 neon-glow-blue">
            <span class="text-2xl">🔄</span>
            Behavioral Patterns
          </h2>
          <div class="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.behavioralPatterns.split('\n').map((line) => {
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
          <h2 class="text-xl font-bold mb-3 flex items-center gap-2 border-b-2 border-primary/20 pb-2 neon-glow-green">
            <span class="text-2xl">🛣️</span>
            Healing Roadmap
          </h2>
          <div class="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <div class="space-y-4">
              ${sections.healingRoadmap.split('\n').map((line) => {
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
              ${sections.actionableRecommendations.split('\n').map((line) => {
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
          <h2 class="text-xl font-bold mb-3 flex items-center gap-2 border-b-2 border-muted-foreground/20 pb-2 neon-glow-teal">
            <span class="text-2xl">📚</span>
            Resources and Next Steps
          </h2>
          <div class="bg-muted/30 p-6 rounded-lg border border-muted-foreground/20">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-3">
              ${sections.resources.split('\n').map((line) => {
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

  // Show appropriate loader based on flow type
  if (showAnalysisLoader) {
    if (isPaidFlow) {
      // Show full report generation loader for paid flow
      return (
        <FullReportGenerationLoader
          currentStep={analysisStep}
          totalSteps={5}
          isGenerating={true}
        />
      )
    } else {
      // Show diagnostic analysis loader for free flow
      return (
        <DiagnosticAnalysisLoader
          currentStep={analysisStep}
          totalSteps={5}
          isGenerating={true}
        />
      )
    }
  }

  // Show free completion prompt after diagnostic analysis
  if (showFreeCompletionPrompt) {
    return (
      <DiagnosticFreeCompletionPrompt
        poeticMessage={poeticMessage}
        onContinue={handleFreeCompletionContinue}
      />
    )
  }

  // Show thank you prompt after payment completion
  if (showCompletionPrompt) {
    return (
      <DiagnosticCompletionPrompt
        poeticMessage="Thank you for your support! 

Your comprehensive diagnostic report has been generated and is ready to view. This detailed analysis provides deep insights into your healing journey and actionable recommendations for your growth.

Your investment helps us continue improving and supporting people on their healing journeys worldwide."
        onContinue={handleReadyToContinue}
      />
    )
  }

  // Show loading while Clerk is loading or while we're loading data
  console.log('🔍 Loading state check:', { isLoaded, loading })
  if (!isLoaded || loading || checking) {
    console.log('⏳ Showing loading spinner')
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center p-4 pt-20 sm:pt-4">
        <LoadingSpinner size="lg" text={!isLoaded ? "Loading..." : "Loading your diagnostic data..."} />
      </div>
    )
  }

  if (!allowed) return null

  if (error) {
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center p-4 pt-20 sm:pt-4">
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
    <div className="min-h-screen-dvh bg-background pt-20 pb-8 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="hidden sm:block animate-float">
              <Image src="/Icon-04.png" alt="results emblem" width={56} height={56} className="w-12 h-auto drop-shadow-[0_0_14px_#a855f7]" />
            </div>
            <div>
              <h1 className="responsive-heading neon-heading key-info [text-shadow:0_0_28px_rgba(204,255,0,0.9),0_0_56px_rgba(204,255,0,0.6),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)] [-webkit-text-stroke:1px_rgba(0,0,0,0.25)]">A Glimpse at Your Mess</h1>
              <p className="responsive-body text-muted-foreground">Here's what we can tell you for free... the full truth comes in your complete report.</p>
            
            {/* Status indicator removed for production */}
            </div>
          </div>

          {/* Progress Summary */}
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-4 py-2 border border-accent/30">
              <CheckCircle className="h-5 w-5 text-accent-foreground" />
              <span className="text-sm font-medium text-accent-foreground">
                {questionCount} questions completed
              </span>
            </div>
            
            {/* Testing controls removed for production */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Saved Overview & Breakdown (shown on revisit) */}
            {(summary || keyInsights) && (
              <Card className="modern-card border-0 summary-card shadow-[0_0_18px_rgba(255,26,255,0.25)]">
                <CardHeader className="bg-background border-b border-border/50 p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl font-semibold neon-heading">Our Thoughts</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {summary && (
                    <div>
                      <h4 className="font-semibold mb-2 text-[#ff1aff] [text-shadow:0_0_12px_rgba(255,26,255,0.8)]">Overview</h4>
                      <div className="whitespace-pre-line text-foreground leading-relaxed">{summary}</div>
                    </div>
                  )}
                  {keyInsights && (
                    <div>
                      <h4 className="font-semibold mb-2 text-cyan-300 [text-shadow:0_0_12px_rgba(0,229,255,0.9)]">Breakdown</h4>
                      {breakdownData.heading && (
                        <div className="text-foreground font-semibold mb-2">
                          {breakdownData.heading.replace(/^\s*[•*-]?\s*/, '')}
                        </div>
                      )}
                      <ul className="list-disc pl-5 space-y-1">
                        {breakdownData.items.map((line, idx) => (
                          <li key={idx} className="text-foreground">
                            {line.replace(/^(?:•|\*|-)\s*/, '')}
                          </li>
                        ))}
                      </ul>
                      {breakdownData.footnote && (
                        <div className="mt-3 italic text-foreground/90">
                          {breakdownData.footnote}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CTA Buttons (Top) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button 
                onClick={() => router.push('/report')}
                variant="outline"
                size="lg"
                className="h-16 text-lg flex items-center gap-3 group hover:scale-105 transition-transform duration-200 border-2 border-[#ff1aff]/30 hover:border-[#ff1aff]/50 bg-[#ff1aff]/5 hover:bg-[#ff1aff]/10"
              >
                <BookOpen className="h-5 w-5 group-hover:scale-110 transition-transform duration-200 text-[#ff1aff]" style={{ filter: 'drop-shadow(0 0 6px #ff1aff)' }} />
                <div className="text-left">
                  <div className="font-semibold neon-glow-pink">Full Prognostic Report</div>
                  <div className="text-sm text-muted-foreground">$9.99</div>
                </div>
              </Button>
              
              <Button 
                onClick={handleStartProgram}
                className="h-16 text-lg flex items-center gap-3 group hover:scale-105 transition-transform duration-200 neon-cta"
                size="lg"
              >
                <Heart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <div className="text-left">
                  <div className="font-semibold">30-Day Healing Program</div>
                  <div className="text-sm opacity-90">$29.95</div>
                </div>
              </Button>
            </div>

            {/* Debug panel removed for production */}

            {/* Structured Preview only */}
              <div key={`structured-${questions.length}-${answers.length}`}>
                <DiagnosticPreview
                  questions={questions}
                  answers={answers}
                  onPurchaseReport={() => router.push('/report')}
                  onStartProgram={handleStartProgram}
                />
              </div>

            {/* Bottom CTA Buttons (match top) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button 
                    onClick={() => router.push('/report')}
                    variant="outline"
                    size="lg"
                    className="h-16 text-lg flex items-center gap-3 group hover:scale-105 transition-transform duration-200 border-2 border-[#ff1aff]/30 hover:border-[#ff1aff]/50 bg-[#ff1aff]/5 hover:bg-[#ff1aff]/10"
                  >
                    <BookOpen className="h-5 w-5 group-hover:scale-110 transition-transform duration-200 text-[#ff1aff]" style={{ filter: 'drop-shadow(0 0 6px #ff1aff)' }} />
                    <div className="text-left">
                      <div className="font-semibold neon-glow-pink">Full Prognostic Report</div>
                      <div className="text-sm text-muted-foreground">$9.99</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={handleStartProgram}
                    className="h-16 text-lg flex items-center gap-3 group hover:scale-105 transition-transform duration-200 neon-cta"
                    size="lg"
                  >
                    <Heart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <div className="text-left">
                      <div className="font-semibold">30-Day Healing Program</div>
                      <div className="text-sm opacity-90">$29.95</div>
                    </div>
                  </Button>
                </div>
                  </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="feature-card border-0 shadow-[0_0_18px_rgba(0,229,255,0.25)]">
              <CardHeader className="bg-background border-b border-border/50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold text-foreground">Your Progress</CardTitle>
                    </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Questions Completed</span>
                    <span className="font-bold text-[#ff1aff]" style={{ filter: 'drop-shadow(0 0 10px #ff1aff)' }}>{questionCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Insights Generated</span>
                    <span className="font-bold text-[#ff1aff]" style={{ filter: 'drop-shadow(0 0 10px #ff1aff)' }}>{results.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="font-bold text-[#ff1aff]" style={{ filter: 'drop-shadow(0 0 10px #ff1aff)' }}>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="modern-card border-0 shadow-[0_0_18px_rgba(255,26,255,0.25)]">
              <CardHeader className="bg-background border-b border-border/50">
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-5 w-5 text-accent-foreground" />
                  <CardTitle className="text-lg font-semibold text-foreground">Next Steps</CardTitle>
                  </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
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

      {/* 30-Day Program Paywall Modal */}
      {showProgramPaywall && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="glass-card w-full max-w-md border-0 shadow-2xl">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
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
                onSuccess={handleProgramPaymentSuccess}
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
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="prose prose-sm sm:prose-base max-w-none">
                <div 
                  className="text-foreground leading-relaxed text-sm sm:text-base tracking-wide"
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