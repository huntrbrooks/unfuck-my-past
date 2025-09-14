'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle, CheckCircle, Brain, Target, Sparkles, Heart, BookOpen, TrendingUp, Loader2, RefreshCw, LifeBuoy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'
import FullReportGenerationLoader from '@/components/FullReportGenerationLoader'
import LoadingSpinner from '@/components/LoadingSpinner'
import Image from 'next/image'
import dynamic from 'next/dynamic'
const ScoresRadar = dynamic(() => import('@/components/charts/ScoresRadarImpl'), { ssr: false })
const AvoidanceBar = dynamic(() => import('@/components/charts/AvoidanceBarImpl'), { ssr: false })
import AIFlow from '@/components/AIFlow'
import BehavioralPatternsImage from '../../components/BehavioralPatternsImage'
import { useRequireOnboardingAndDiagnostic } from '@/hooks/use-access-guard'

export default function ReportPage() {
  const { checking, allowed } = useRequireOnboardingAndDiagnostic()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comprehensiveReport, setComprehensiveReport] = useState('')
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [results, setResults] = useState<any[]>([])
  const [showThankYou, setShowThankYou] = useState(false)
  const [showFinalising, setShowFinalising] = useState(false)
  const [loaderStep, setLoaderStep] = useState(1)
  const [loaderDone, setLoaderDone] = useState(false)
  const [generationDone, setGenerationDone] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [regeneratingReport, setRegeneratingReport] = useState(false)
  const [personaScores, setPersonaScores] = useState<any | null>(null)
  const [liteDiag, setLiteDiag] = useState<any | null>(null)
  const isGeneratingRef = useRef(false)

  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  // Advance the 5-stage loader while generation is in progress
  useEffect(() => {
    if (!(showFinalising || generatingReport)) return
    const interval = setInterval(() => {
      setLoaderStep(prev => (prev < 5 ? prev + 1 : 5))
    }, 4000)
    return () => clearInterval(interval)
  }, [showFinalising, generatingReport])

  const checkAccess = async () => {
    try {
      setCheckingAccess(true)
      
      // First check if a report is already saved
      const reportCheck = await fetch('/api/diagnostic/comprehensive-report', { method: 'GET' })
      if (reportCheck.ok) {
        const reportData = await reportCheck.json()
        const existingReport = reportData.report as string | undefined
        if (existingReport) {
          setHasAccess(true)
          setShowPaywall(false)
          setComprehensiveReport(existingReport)
          await loadReportData()
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
          setShowPaywall(false)
          if (!isGeneratingRef.current && !generatingReport) {
            generateFullReport()
          }
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
      
      // Load prognostic responses
      const responsesResponse = await fetch('/api/diagnostic/responses')
      let responsesPayload: any[] = []
      if (responsesResponse.ok) {
        const data = await responsesResponse.json()
        const arr = Array.isArray(data.responses) ? data.responses : []
        setResults(arr)
        setQuestionCount(arr.length || 0)
        responsesPayload = arr
      }

      // Fetch persona (six scores) and diagnostic-lite for charts
      try {
        const answersForAI = responsesPayload.map((r: any) => ({ 
          q: (() => { 
            try { 
              const q = typeof r.question === 'string' ? JSON.parse(r.question) : r.question
              return q?.question || 'Question' 
            } catch { 
              return String(r.question || 'Question') 
            } 
          })(), 
          a: r.response 
        }))
        
        const [pRes, dRes] = await Promise.all([
          fetch('/api/persona', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding: {}, answers: answersForAI }) }),
          fetch('/api/diagnostic-lite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding: {}, answers: answersForAI }) })
        ])
        
        if (pRes.ok) {
          setPersonaScores(await pRes.json())
        } else {
          console.warn('persona API failed', pRes.status)
          // Set fallback data to ensure 6 score cards always show
          setPersonaScores({
            scores: {
              resilience: 6,
              vulnerability: 5,
              self_awareness: 6,
              boundaries: 4,
              emotional_regulation: 5,
              growth_orientation: 6
            }
          })
        }
        
        if (dRes.ok) {
          setLiteDiag(await dRes.json())
        } else {
          console.warn('diagnostic-lite API failed', dRes.status)
        }
      } catch (err) { 
        console.warn('charts fetch failed', err)
      }
    } catch (err) {
      console.error('Error loading report data:', err)
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const generateFullReport = async () => {
    try {
      if (isGeneratingRef.current) return
      isGeneratingRef.current = true
      
      setGeneratingReport(true)
      setShowFinalising(true)
      setLoaderStep(1)
      setError('')
      
      // Check if report already exists
      const existingReportResponse = await fetch('/api/diagnostic/comprehensive-report', { method: 'GET' })
      
      if (existingReportResponse.ok) {
        const reportData = await existingReportResponse.json()
        if (reportData.report) {
          setComprehensiveReport(reportData.report)
          await loadReportData()
          setGenerationDone(true)
          setLoading(false)
          setShowFinalising(false)
          return
        }
      }
      
      // Generate new report
      const reportResponse = await fetch('/api/diagnostic/comprehensive-report', { method: 'POST' })
      
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setComprehensiveReport(reportData.report || '')
        await loadReportData()
        setGenerationDone(true)
        setLoading(false)
        setShowFinalising(false)
      } else {
        const errorData = await reportResponse.text()
        console.error('Report API error:', errorData)
        throw new Error(`Failed to generate report: ${reportResponse.status}`)
      }
    } catch (err) {
      console.error('Error generating report:', err)
      setError(`Failed to generate comprehensive report: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setShowFinalising(false)
    } finally {
      setGeneratingReport(false)
      isGeneratingRef.current = false
    }
  }

  const handleRegenerateReport = async () => {
    setRegeneratingReport(true)
    setError('')
    
    try {
      const response = await fetch('/api/diagnostic/regenerate-structured-report', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (!response.ok) throw new Error('Failed to regenerate report')
      const data = await response.json()
      setComprehensiveReport(data.report)
      await loadReportData()
      setError('Report regenerated successfully! ✅')
      setTimeout(() => setError(''), 3000)
    } catch (error) {
      console.error('Error regenerating report:', error)
      setError('Failed to regenerate report. Please try again.')
    } finally {
      setRegeneratingReport(false)
    }
  }

  const formatReportContent = (reportContent: string) => {
    if (!reportContent) return null

    const sections = reportContent.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
    
    const sectionColors: Record<string, string> = {
      'EXECUTIVE SUMMARY': 'neon-heading',
      'TRAUMA ANALYSIS': 'neon-glow-orange',
      'TOXICITY SCORE': 'neon-glow-pink',
      'HOW TO LEAN INTO YOUR STRENGTHS': 'neon-glow-cyan',
      'MOST IMPORTANT TO ADDRESS': 'neon-glow-purple',
      'BEHAVIORAL PATTERNS': 'neon-glow-blue',
      'HEALING ROADMAP': 'neon-glow-green',
      'ACTIONABLE RECOMMENDATIONS': 'neon-glow-pink',
      'NEXT STEPS': 'neon-glow-orange',
      'RESOURCES': 'neon-glow-teal',
      'PROFESSIONAL HELP': 'neon-glow-blue'
    }

    return sections.map((section, index) => {
      const lines = section.trim().split('\n')
      const title = lines[0].trim()
      const sectionBody = lines.slice(1).join('\n').trim()
      const lookup = title.toUpperCase()
      const glowClass = (sectionColors as Record<string,string>)[lookup] || 'neon-heading'
      
      // Remove duplicate sections that are represented by dedicated UI
      if (/^YOUR\s+COLOU?R$/i.test(title)) {
        return null
      }
      if (/^(YOUR\s+SIX\s+SCORES|SIX\s+SCORES|THE\s+SIX\s+SCORES|SCORES)$/i.test(title)) {
        return null
      }
      if (/^HEALING\s+ROADMAP$/i.test(title)) {
        // We render a dedicated final roadmap section later; skip here completely
        return null
      }
      if (/^BEHAVIORAL\s+PATTERNS$/i.test(title)) {
        // We'll render a dedicated visual later
        return null
      }
      if (/^MOST\s+IMPORTANT\s+TO\s+ADDRESS$/i.test(title)) {
        // Shown in the Focus Now sidebar card only
        return null
      }
      if (/^NEXT\s+STEPS$/i.test(title)) {
        // Rendered in the sidebar; skip from main content
        return null
      }
      if (/^RESOURCES$/i.test(title)) {
        // Rendered in the sidebar mini card; skip here to avoid duplication
        return null
      }
      if (/^HOW\s+TO\s+LEAN\s+INTO\s+YOUR\s+STRENGTHS$/i.test(title)) {
        // Rendered in split card with Recommendations
        return null
      }
      if (/^ACTIONABLE\s+RECOMMENDATIONS$/i.test(title)) {
        // Rendered in split card with Strengths
        return null
      }
      if (/^PROFESSIONAL\s+HELP$/i.test(title)) {
        // Rendered as a bold sidebar card; skip in main content
        return null
      }
      if (/^TOXICITY\s+SCORE$/i.test(title)) {
        // Now rendered as a spectacle in the top-right sidebar card
        return null
      }
      
      // Custom render: MOST TELLING QUOTE
      if (/^MOST TELLING QUOTE$/i.test(title)) {
        const cleanQuote = sectionBody
          .replace(/^[=\-\s]*"?/g, '"')
          .replace(/"?\s*$/g, '"')
          .replace(/^""+/g, '"')
          .replace(/"+$/g, '"')
        return (
          <Card key={index} className="feature-card border-0 mb-6">
            <CardContent className="p-6">
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Most Telling Quote</div>
              <div className="text-lg italic text-foreground">{cleanQuote}</div>
            </CardContent>
          </Card>
        )
      }

      // Custom render: TRAUMA ANALYSIS (neat 2x2 layout + evidence)
      if (/^TRAUMA ANALYSIS$/i.test(title)) {
        const lines = sectionBody.split('\n')
        const getList = (label: RegExp) => {
          const out: string[] = []
          let capture = false
          for (const raw of lines) {
            const t = raw.trim()
            if (label.test(t)) { capture = true; continue }
            if (/^[A-Za-z].+:$/.test(t)) { capture = false }
            if (!capture) continue
            if (t.startsWith('•')) out.push(t.replace(/^•\s*/, '').trim())
            else if (t === '') break
          }
          return out
        }
        const roots = getList(/^Root\s+Causes\s*&\s*Triggers:/i)
        const patterns = getList(/^How\s+Past\s+Events\s+Shaped\s+Patterns:/i)
        const blind = getList(/^Blind\s+Spots:/i)
        const contradictions = getList(/^Contradictions:/i)
        const evidence = getList(/^Evidence\s+Quotes:/i)

        return (
          <Card key={index} className="feature-card mb-6 overflow-hidden bg-background border-0">
            <CardHeader className="bg-background">
              <CardTitle className={`flex items-center gap-3 text-foreground ${glowClass}`}>Trauma Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold text-foreground mb-2">Root Causes & Triggers</div>
                  <ul className="space-y-2">
                    {roots.map((it, i) => (
                      <li key={`root-${i}`} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 inline-block" />
                        <span className="text-foreground/90">{it}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-2">How Past Events Shaped Patterns</div>
                  <ul className="space-y-2">
                    {patterns.map((it, i) => (
                      <li key={`pat-${i}`} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 inline-block" />
                        <span className="text-foreground/90">{it}</span></li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold text-foreground mb-2">Blind Spots</div>
                  <ul className="space-y-2">
                    {blind.map((it, i) => (
                      <li key={`blind-${i}`} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 inline-block" />
                        <span className="text-foreground/90">{it}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-2">Contradictions</div>
                  <ul className="space-y-2">
                    {contradictions.map((it, i) => (
                      <li key={`con-${i}`} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 inline-block" />
                        <span className="text-foreground/90">{it}</span></li>
                    ))}
                  </ul>
                </div>
              </div>

              {evidence.length > 0 && (
                <div className="rounded-xl border border-border/50 p-4 bg-muted/10">
                  <div className="text-sm font-semibold text-foreground mb-2">Evidence Quotes</div>
                  <ul className="space-y-2">
                    {evidence.map((q, i) => (
                      <li key={`ev-${i}`} className="text-foreground/80 italic">“{q.replace(/^"|"$/g,'')}”</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      // (Toxicity score is rendered in the sidebar at the top-right)


      return (
        <Card key={index} className="feature-card mb-6 overflow-hidden bg-background border-0">
          <CardHeader className="bg-background">
            <CardTitle className={`flex items-center gap-3 text-foreground ${glowClass}`}>
              {title.includes('Executive Summary') && <Brain className="w-5 h-5 text-primary" />}
              {title.includes('Trauma Analysis') && <Target className="w-5 h-5 text-destructive" />}
              {title.includes('Toxicity Score') && <TrendingUp className="w-5 h-5 text-warning" />}
              {title.includes('Strengths') && <Sparkles className="w-5 h-5 text-success" />}
              {title.includes('Most Important') && <AlertTriangle className="w-5 h-5 text-warning" />}
              {title.includes('Behavioral Patterns') && <Brain className="w-5 h-5 text-primary" />}
              {title.includes('Healing Roadmap') && <Heart className="w-5 h-5 text-primary" />}
              {title.includes('Actionable Recommendations') && <Target className="w-5 h-5 text-success" />}
              {title.includes('Resources') && <BookOpen className="w-5 h-5 text-muted-foreground" />}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {
              <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                {sectionBody.split('\n').map((line, lineIndex) => {
                  const trimmed = line.trim()
                  if (/^[=\-\s]+$/.test(trimmed)) return null
                  if (trimmed.startsWith('•')) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span className="text-foreground">{trimmed.substring(1).trim()}</span>
                      </div>
                    )
                  } else if (trimmed.match(/^\d+\./)) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                        <Badge variant="outline" className="text-primary border-0 bg-primary/10">
                          {trimmed.match(/^\d+\./)?.[0]}
                        </Badge>
                        <span className="text-foreground font-medium">{trimmed.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    )
                  } else if (trimmed) {
                    return (
                      <div key={lineIndex} className="p-3 rounded-lg bg-background">
                        <span className="text-foreground font-medium">{trimmed}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            }
            {/* Roadmap visual also deferred to bottom */}
          </CardContent>
        </Card>
      )
    })
  }

  const buildHealingFlowSeed = (content: string) => {
    try {
      if (!content) return null
      const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
      const roadmapSection = sections.find(sec => {
        const firstLine = sec.trim().split('\n')[0]?.trim()
        return /^HEALING ROADMAP$/i.test(firstLine)
      })
      if (!roadmapSection) return null
      const lines = roadmapSection.trim().split('\n').slice(2)
      const steps: Array<{ title: string; success?: string }> = []
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const m = line.match(/^\d+\.\s*(.+)$/)
        if (m) {
          const title = m[1]
            .replace(/^Today:\s*/i, '')
            .replace(/^This Week:\s*/i, '')
            .replace(/^This Month:\s*/i, '')
            .replace(/^3 Months:\s*/i, '')
            .replace(/^1 Year:\s*/i, '')
            .trim()
          const next = lines[i + 1]?.trim() || ''
          const s = next.match(/^Success:\s*(.+)$/i)
          steps.push({ title: title.slice(0, 48), success: s ? s[1] : undefined })
        }
      }
      if (!steps.length) return null
      const checklist = steps.slice(0, 4).map(s => s.title)
      return {
        topic: 'Healing Roadmap',
        stages: steps.map((s, idx) => `${idx + 1}. ${s.title}`),
        checklist
      }
    } catch {
      return null
    }
  }

  const parseRoadmapPairs = (content: string) => {
    try {
      if (!content) return [] as Array<{ step: string; success?: string }>
      const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
      const roadmapSection = sections.find(sec => {
        const firstLine = sec.trim().split('\n')[0]?.trim()
        return /^HEALING ROADMAP$/i.test(firstLine)
      })
      if (!roadmapSection) return []
      const lines = roadmapSection.trim().split('\n').slice(1)
      const out: Array<{ step: string; success?: string }> = []
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line || /^[=\-\s]+$/.test(line)) continue
        const m = line.match(/^\d+\.\s*(.+)$/)
        if (m) {
          const stepText = m[1].trim().replace(/^Today:\s*/i,'').replace(/^This Week:\s*/i,'').replace(/^This Month:\s*/i,'').replace(/^3 Months:\s*/i,'').replace(/^1 Year:\s*/i,'')
          let success: string | undefined
          const next = lines[i+1]?.trim() || ''
          const sm = next.match(/^Success:\s*(.+)$/i)
          if (sm) success = sm[1].trim()
          out.push({ step: stepText, success })
        }
      }
      return out
    } catch {
      return []
    }
  }

  const extractColourInfo = (content: string) => {
    try {
      if (!content) return null
      const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
      const colourSection = sections.find(sec => {
        const firstLine = sec.trim().split('\n')[0]?.trim()
        return /^YOUR\s+COLOU?R$/i.test(firstLine)
      })
      if (!colourSection) return null
      const lines = colourSection.trim().split('\n').slice(1)
      let primary: string | undefined
      const body: string[] = []
      for (const raw of lines) {
        const line = raw.trim()
        if (!line) continue
        if (/^[=\-\s]+$/.test(line)) continue
        const pm = line.match(/^Primary:\s*(.+)$/i)
        if (pm) { primary = pm[1].trim(); continue }
        body.push(line)
      }
      return { primary, explanation: body.join(' ') }
    } catch {
      return null
    }
  }

  type LoopVisual = {
    name: string
    trigger: string
    cycle: string[]
    impact: string
    breakPoint: { fromState: string; action: string }
  }

  const parseBehavioralLoops = (content: string): LoopVisual[] => {
    try {
      if (!content) return []
      const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
      const sec = sections.find(s => /^BEHAVIORAL PATTERNS$/i.test(s.trim().split('\n')[0]?.trim() || ''))
      if (!sec) return []
      const lines = sec.trim().split('\n').slice(1).map(l => l.trim()).filter(Boolean)

      // Group into loop blocks by lines starting with "Loop" or lines ending with "Loop"
      const blocks: string[][] = []
      let current: string[] = []
      for (const line of lines) {
        if (/^Loop\s*\d+\s*:\s*/i.test(line) || /Loop\s*$/i.test(line)) {
          if (current.length > 0) blocks.push(current)
          current = [line]
        } else {
          current.push(line)
        }
      }
      if (current.length > 0) blocks.push(current)

      const loops: LoopVisual[] = []
      for (const block of blocks) {
        const text = block.join('\n')
        // Name
        const titleLine = block[0] || ''
        const nameMatch = titleLine.match(/Loop\s*\d+\s*:\s*(.+)$/i)
        const name = (nameMatch ? nameMatch[1] : titleLine.replace(/\s*Loop\s*$/i, '')).trim()
        // Trigger
        const trig = (text.match(/(?:Loop\s*)?Trigger:\s*([^\n]+)/i)?.[1] || '').trim()
        // Cycle (split on arrows or commas)
        const cycleRaw = (text.match(/Cycle:\s*([^\n]+)/i)?.[1] || '').trim()
        const cycle = cycleRaw
          .split(/\s*[-–—>→]\s*|,\s*/)
          .map(s => s.trim())
          .filter(Boolean)
        // Impact
        const impact = (text.match(/Impact:\s*([^\n]+)/i)?.[1] || '').trim()
        // Break point
        const bpLine = (text.match(/Break\s*Point:\s*([^\n]+)/i)?.[1] || '').trim()
        // Heuristic: choose fromState as the first cycle node mentioned inside bp line; else middle of cycle
        let fromState = ''
        for (const s of cycle) {
          const re = new RegExp(s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
          if (re.test(bpLine)) { fromState = s; break }
        }
        if (!fromState && cycle.length > 0) fromState = cycle[Math.floor(cycle.length / 2)]
        const action = bpLine || 'Break the loop'
        if (name && cycle.length >= 2) {
          loops.push({ name, trigger: trig || 'Trigger', cycle, impact, breakPoint: { fromState, action } })
        }
      }
      return loops
    } catch {
      return []
    }
  }

  const parseResources = (content: string) => {
    try {
      if (!content) return null
      const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
      const resSection = sections.find(sec => {
        const firstLine = sec.trim().split('\n')[0]?.trim()
        return /^RESOURCES$/i.test(firstLine)
      })
      if (!resSection) return null
      const lines = resSection.trim().split('\n')
      if (lines.length < 3) return null
      let current: 'apps' | 'books' | 'articles' | null = null
      const out: { apps: Array<{ name: string; note?: string }>; books: Array<{ name: string; note?: string }>; articles: Array<{ name: string; note?: string }> } = { apps: [], books: [], articles: [] }
      for (let i = 2; i < lines.length; i++) {
        const raw = lines[i].trim()
        if (!raw) continue
        if (/^Apps:/i.test(raw)) { current = 'apps'; continue }
        if (/^Books:/i.test(raw)) { current = 'books'; continue }
        if (/^Articles:/i.test(raw)) { current = 'articles'; continue }
        const m = raw.match(/^•\s*(.+)$/)
        if (m && current) {
          const txt = m[1]
          const idx = txt.indexOf(':')
          const name = (idx >= 0 ? txt.slice(0, idx) : txt).trim()
          const note = (idx >= 0 ? txt.slice(idx + 1) : '').trim()
          if (name) (out as any)[current].push({ name, note: note || undefined })
        }
      }
      return out
    } catch {
      return null
    }
  }

  const parseNextSteps = (content: string) => {
    try {
      if (!content) return [] as string[]
      const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
      const sec = sections.find(s => {
        const first = s.trim().split('\n')[0]?.trim()
        return /^NEXT STEPS$/i.test(first || '')
      })
      if (!sec) return []
      const lines = sec.trim().split('\n').slice(1)
      const out: string[] = []
      for (const raw of lines) {
        const line = raw.trim()
        if (!line || /^[=\-\s]+$/.test(line)) continue
        const bullet = line.match(/^•\s*(.+)$/)
        const numbered = line.match(/^\d+\.\s*(.+)$/)
        if (bullet) out.push(bullet[1].trim())
        else if (numbered) out.push(numbered[1].trim())
      }
      return out
    } catch {
      return []
    }
  }

  const parseStrengthsList = (sectionBody: string) => {
    try {
      if (!sectionBody) return [] as string[]
      const lines = sectionBody.split('\n')
      const cleaned = lines.filter(l => !/^=+$/.test(l.trim()))
      const items: string[] = []
      let block: string[] = []
      const flush = () => {
        if (block.length === 0) return
        const name = (block.find(l => l.trim() && !/^Why\s+it\s+matters:/i.test(l) && !/^How\s+to\s+apply:/i.test(l)) || '').trim()
        const how = (block.find(l => /^How\s+to\s+apply:/i.test(l)) || '').replace(/^How\s+to\s+apply:\s*/i, '')
        const why = (block.find(l => /^Why\s+it\s+matters:/i.test(l)) || '').replace(/^Why\s+it\s+matters:\s*/i, '')
        const summary = how || why || ''
        const bullet = name ? `${name}${summary ? ' — ' + summary : ''}` : summary
        if (bullet) items.push(bullet)
        block = []
      }
      for (const raw of cleaned) {
        const t = raw.trim()
        if (!t) { flush(); continue }
        block.push(t)
      }
      flush()
      return items
    } catch { return [] }
  }

  const parseRecommendationsList = (sectionBody: string) => {
    try {
      if (!sectionBody) return [] as string[]
      const lines = sectionBody.split('\n')
      const cleaned = lines.filter(l => !/^=+$/.test(l.trim()))
      const items: string[] = []
      let block: string[] = []
      const flush = () => {
        if (block.length === 0) return
        const actionLine = block.find(l => /^\d+\./.test(l.trim())) || ''
        const m = actionLine.match(/^\d+\.\s*(.+)$/)
        const bullet = m ? m[1].trim() : block[0]?.trim()
        if (bullet) items.push(bullet)
        block = []
      }
      for (const raw of cleaned) {
        const t = raw.trim()
        if (!t) { flush(); continue }
        block.push(t)
      }
      flush()
      return items
    } catch { return [] }
  }

  const parseMostImportant = (content: string) => {
    try {
      if (!content) return null as null | { item?: string; firstStep?: string }
      const sections = content.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
      const sec = sections.find(s => {
        const first = s.trim().split('\n')[0]?.trim()
        return /^MOST IMPORTANT TO ADDRESS$/i.test(first)
      })
      if (!sec) return null
      const lines = sec.trim().split('\n').slice(1)
      let item: string | undefined
      let firstStep: string | undefined
      for (const raw of lines) {
        const line = raw.trim()
        if (!line || /^[=\-\s]+$/.test(line)) continue
        const fs = line.match(/^First\s*step:\s*(.+)$/i)
        if (fs) { firstStep = fs[1].trim(); continue }
        if (!/^Impact\s*now:/i.test(line)) {
          // assume first non-label line is the item name, e.g., SELF DOUBT
          if (!item) item = line
        }
      }
      return { item, firstStep }
    } catch {
      return null
    }
  }

  if (checkingAccess || checking) {
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking your access..." />
      </div>
    )
  }

  if (!allowed) return null

  if (showPaywall) {
    return (
      <div className="min-h-screen-dvh bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
              <Image src="/Lineartneon-01.png" alt="report paywall art" width={80} height={80} className="w-20 h-auto drop-shadow-[0_0_8px_#ccff00]" />
            </div>
            <h1 className="responsive-heading neon-heading mb-4">Your Comprehensive Report</h1>
            <p className="responsive-body text-muted-foreground mb-8">
              Unlock your personalized trauma analysis, healing roadmap, and actionable recommendations
            </p>
          </div>
          
          <Card className="modern-card max-w-2xl mx-auto">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 neon-heading">
                <span>📊</span>
                Complete Prognostic Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-foreground">What's Included:</h3>
                <div className="grid gap-3 text-left">
                  {[
                    { icon: Brain, text: 'Executive Summary & Trauma Analysis' },
                    { icon: TrendingUp, text: 'Toxicity Score Assessment' },
                    { icon: Sparkles, text: 'Personal Strengths & Growth Areas' },
                    { icon: Target, text: 'Behavioral Pattern Analysis' },
                    { icon: Heart, text: 'Custom Healing Roadmap' },
                    { icon: BookOpen, text: 'Resources & Next Steps' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">$9.99</div>
                <p className="text-muted-foreground mb-6">One-time purchase • Lifetime access</p>
                
                <PaymentForm
                  productName="Complete Diagnostic Report"
                  amount={999}
                  onSuccess={async () => {
                    setShowPaywall(false)
                    setPaymentSuccess(true)
                    setHasAccess(true)
                    setShowFinalising(true)
                    setGeneratingReport(true)
                    setLoading(true)
                    generateFullReport()
                  }}
                  onCancel={() => router.push('/dashboard')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loader when generating report
  if (showFinalising || generatingReport) {
    return <FullReportGenerationLoader currentStep={loaderStep} totalSteps={5} isGenerating={true} />
  }

  if (loading) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen-dvh bg-background">
      {/* Header - Dashboard Style */}
      <div className="bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
              <Image src="/Lineartneon-01.png" alt="report art" width={64} height={64} className="w-16 h-auto drop-shadow-[0_0_18px_#22c55e]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold neon-heading">Here's Why Your Past Is Fucked</h1>
              <p className="text-muted-foreground">Based on your {questionCount} prognostic responses</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button asChild className="neon-cta">
              <a href="/program">Start 30‑Day Unfuck Your Life Journey</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Dashboard Style */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Report Content */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Your Colour Card (augmented with generated explanation) */}
            {liteDiag?.colour_profile && (
              <Card className={`border neon-card ${(() => {
                const c = (liteDiag.colour_profile.dominant_colour || '').toLowerCase()
                if (c.includes('blue')) return 'neon-card-theme-blue'
                if (c.includes('red')) return 'neon-card-theme-pink'
                if (c.includes('green')) return 'neon-card-theme-green'
                if (c.includes('yellow')) return 'neon-card-theme-yellow'
                if (c.includes('purple')) return 'neon-card-theme-purple'
                if (c.includes('orange')) return 'neon-card-theme-orange'
                return 'neon-card-theme-green'
              })()}`}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="text-sm uppercase tracking-wide text-muted-foreground">Your Colour</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md text-xs font-semibold text-foreground border border-border">
                        {liteDiag.colour_profile.secondary ? `${liteDiag.colour_profile.dominant_colour} → ${liteDiag.colour_profile.secondary.colour}` : liteDiag.colour_profile.dominant_colour}
                      </span>
                    </div>
                  </div>
                  <div className="text-foreground whitespace-pre-line mb-2">
                    {(() => {
                      const extra = extractColourInfo(comprehensiveReport)
                      const base = String(liteDiag.colour_profile.meaning || '')
                      if (extra?.explanation) {
                        // Prefer generated explanation if present; otherwise show base
                        return extra.explanation
                      }
                      return base
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 6 Score Cards */}
            {personaScores?.scores && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {['Resilience','Vulnerability','Self-Awareness','Boundaries','Emotional Regulation','Growth Orientation'].map((lbl, i) => (
                  <Card key={`scores-${i}`} className={`modern-card border-0 neon-card ${['glow-cyan','glow-pink','glow-orange','glow-purple','glow-blue','glow-teal'][i % 6]}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-muted-foreground">{lbl}</div>
                        <div className="text-sm text-muted-foreground">/10</div>
                      </div>
                      <div className="text-3xl font-extrabold text-foreground tracking-tight">{(() => {
                        const key = lbl.toLowerCase().replace(/\s|-/g,'_')
                        const val = personaScores.scores[key] ?? 0
                        return Number(val) || 0
                      })()}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Strengths + Recommendations (split card with collapsible sections) */}
            {(() => {
              const sections = comprehensiveReport.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
              const strengths = sections.find(sec => /^HOW TO LEAN INTO YOUR STRENGTHS$/i.test(sec.trim().split('\n')[0]?.trim() || ''))
              const recs = sections.find(sec => /^ACTIONABLE RECOMMENDATIONS$/i.test(sec.trim().split('\n')[0]?.trim() || ''))
              const strengthsBody = strengths ? strengths.trim().split('\n').slice(1).join('\n') : ''
              const recsBody = recs ? recs.trim().split('\n').slice(1).join('\n') : ''
              if (!strengthsBody && !recsBody) return null
              const strengthsList = parseStrengthsList(strengthsBody)
              const recList = parseRecommendationsList(recsBody)
              return (
                <Card className="feature-card border-0">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2">
                      {/* Strengths side */}
                      <div className="p-6 border-b md:border-b-0 md:border-r border-border/50">
                        <details>
                          <summary className="cursor-pointer list-none">
                            <h3 className="text-lg font-semibold text-foreground neon-glow-cyan">How To Lean Into Your Strengths</h3>
                          </summary>
                          <ul className="mt-3 space-y-2">
                            {strengthsList.length === 0 && (
                              <li className="text-sm text-muted-foreground">No items</li>
                            )}
                            {strengthsList.map((s, i) => (
                              <li key={`st-${i}`} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 inline-block" />
                                <span className="text-foreground/90">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                      {/* Recommendations side */}
                      <div className="p-6">
                        <details>
                          <summary className="cursor-pointer list-none">
                            <h3 className="text-lg font-semibold text-foreground neon-glow-pink">Actionable Recommendations</h3>
                          </summary>
                          <ul className="mt-3 space-y-2">
                            {recList.length === 0 && (
                              <li className="text-sm text-muted-foreground">No items</li>
                            )}
                            {recList.map((r, i) => (
                              <li key={`rec-${i}`} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 inline-block" />
                                <span className="text-foreground/90">{r}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Report Content (remaining sections) */}
            <div id="report-content" className="space-y-6">
              {formatReportContent(comprehensiveReport)}
            </div>

            {/* Behavioral Patterns write-up + image (manual generate) BEFORE roadmap */}
            {(() => {
              const parsed = parseBehavioralLoops(comprehensiveReport)
              const fallbackLoops: LoopVisual[] = [
                {
                  name: 'Isolation',
                  trigger: 'Loneliness',
                  cycle: ['Isolation', 'Boredom', 'Urge', 'Relapse'],
                  impact: 'Increases vulnerability to urges',
                  breakPoint: { fromState: 'Urge', action: 'Engage with supportive friends or family' }
                },
                {
                  name: 'Self-Criticism',
                  trigger: 'Falling off track',
                  cycle: ['Setback', 'Negative self-talk', 'Sinking into old habits'],
                  impact: 'Shifts focus away from progress',
                  breakPoint: { fromState: 'Negative self-talk', action: 'Reframe thoughts, focusing on learning' }
                }
              ]
              const finalLoops = parsed && parsed.length > 0 ? parsed : fallbackLoops
              return (
                <section className="rounded-xl border p-4 mt-6">
                  <h2 className="text-lg font-semibold mb-4">Behavioral Patterns</h2>
                  <div className="space-y-3">
                    {finalLoops.map((lp, idx) => (
                      <div key={`bpw-${idx}`} className="rounded-lg border border-border/50 bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-foreground mb-1">{`Loop ${idx + 1}: ${lp.name}`}</div>
                            <div className="text-sm text-muted-foreground mb-2">{`Trigger: ${lp.trigger}`}</div>
                            <div className="text-sm text-foreground/90">
                              <span className="font-medium">Cycle: </span>
                              <span>{lp.cycle.join(' → ')}</span>
                            </div>
                            {lp.impact && (
                              <div className="text-sm text-foreground/90 mt-1">
                                <span className="font-medium">Impact: </span>
                                <span>{lp.impact}</span>
                              </div>
                            )}
                            {lp.breakPoint?.action && (
                              <div className="text-sm text-foreground/90 mt-1">
                                <span className="font-medium">Break Point: </span>
                                <span>{lp.breakPoint.action}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <BehavioralPatternsImage loops={finalLoops} allowRegenerate autoGenerate={false} strictOpenAIOnly />
                  </div>
                </section>
              )
            })()}

            {/* Final: Healing Roadmap as last section */}
            {(() => {
              const pairs = parseRoadmapPairs(comprehensiveReport)
              if (!pairs || pairs.length === 0) return null
              const seed = buildHealingFlowSeed(comprehensiveReport)
              return (
                <section className="rounded-xl border p-4 mt-6">
                  <h2 className="text-lg font-semibold mb-3">Healing Roadmap</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-6">
                    {pairs.map((p, idx) => (
                      <React.Fragment key={`pair-${idx}`}>
                        <div className="text-foreground"><span className="font-medium">{idx+1}. </span>{p.step}</div>
                        <div className="text-foreground/90"><span className="underline">Success:</span> {p.success || ''}</div>
                      </React.Fragment>
                    ))}
                  </div>
                  {seed && (
                    <div className="rounded-2xl overflow-hidden border border-border/50 bg-background">
                      <AIFlow seed={seed} height={460} />
                    </div>
                  )}
                </section>
              )
            })()}

            {/* Charts removed per request: keep only the six score boxes */}

            {Array.isArray(liteDiag?.avoidance_ladder) && liteDiag.avoidance_ladder.length > 0 && (
              <section className="rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">Hierarchy of Avoidance</h2>
                  <div className="text-xs text-muted-foreground">Bars represent each item’s severity score (0–10)</div>
                </div>
                <AvoidanceBar
                  data={liteDiag.avoidance_ladder.map((x: any) => ({ name: x.name, severity: x.severity }))}
                  color={(liteDiag?.colour_profile?.hex) || '#22c55e'}
                />
                {(() => {
                  // Match legend item colors to the bar colors used in the chart
                  const palette = ['#00e5ff', '#ff1aff', '#ff9900', '#a855f7', '#3b82f6', '#14b8a6', '#ff1aff']
                  return (
                    <ul className="mt-3 text-sm opacity-90 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                      {liteDiag.avoidance_ladder.map((it: any, i: number) => {
                        const c = palette[i % palette.length]
                        return (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full inline-block" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
                            <span className="text-foreground/90"><b style={{ color: c }}>{it.name}</b>: {it.why_it_matters}</span>
                          </li>
                        )
                      })}
                    </ul>
                  )
                })()}
              </section>
            )}
          </div>

          {/* Right Sidebar - Dashboard Style */}
          <div className="space-y-6">
            {/* Compact Priority/Next Step Card */}
            {(() => {
              const most = parseMostImportant(comprehensiveReport)
              if (!most?.item && !most?.firstStep) return null
              return (
                <Card className="feature-card border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Focus Now</h3>
                    {most.item && (
                      <div className="mb-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Most important to address</div>
                        <div className="text-foreground font-semibold">{most.item}</div>
                      </div>
                    )}
                    {most.firstStep && (
                      <div>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-1 rounded bg-muted/40 text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">Next step</span>
                        </div>
                        <p className="text-foreground text-base leading-relaxed mt-2">{most.firstStep}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}
            {/* Quick Actions Card */}
            <Card className="feature-card border-0">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button asChild className="w-full neon-cta">
                    <a href="/program">Start 30‑Day Journey</a>
                  </Button>
                  <Button
                    onClick={handleRegenerateReport}
                    disabled={regeneratingReport}
                    variant="outline"
                    className="w-full border-2 border-[#ff1aff]/30 hover:border-[#ff1aff]/50 bg-[#ff1aff]/5 hover:bg-[#ff1aff]/10"
                  >
                    {regeneratingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Report
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = '/api/export'
                      link.download = 'prognostic-report.txt'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Toxicity Spectacle (Top-right) */}
            {(() => {
              // Extract toxicity block from the formatted report
              const sections = comprehensiveReport.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
              const tox = sections.find(sec => /^TOXICITY SCORE$/i.test(sec.trim().split('\n')[0]?.trim() || ''))
              if (!tox) return null
              const body = tox.trim().split('\n').slice(1).join('\n')
              const overallMatch = body.match(/Overall\s*Score:\s*(\d+)/i)
              const overall = overallMatch ? Math.min(10, Math.max(0, parseInt(overallMatch[1], 10))) : 0
              const confLine = (body.split('\n').find(l => /^Confidence:/i.test(l.trim())) || '')
              const confMatch = confLine.match(/Confidence:\s*([^—\-]+)[—\-]?\s*(.*)$/i)
              const confidence = confMatch ? confMatch[1].trim().toUpperCase() : 'MEDIUM'
              const why = confMatch ? confMatch[2].trim() : ''
              const bulletLines = body.split('\n').filter(l => l.trim().startsWith('•'))
              const getVal = (label: string) => {
                const line = bulletLines.find(l => new RegExp(label, 'i').test(l)) || ''
                const m = line.match(/(\d+)\s*\/\s*10/)
                return m ? Math.min(10, Math.max(0, parseInt(m[1], 10))) : 0
              }
              const subs = [
                { label: 'Self‑Criticism', value: getVal('Self\-?Criticism'), color: '#ff1aff' },
                { label: 'Avoidance', value: getVal('Avoidance'), color: '#00e5ff' },
                { label: 'Anxiety', value: getVal('Anxiety'), color: '#ccff00' },
                { label: 'External Pressures', value: getVal('External\s*Pressures'), color: '#ff9900' }
              ]

              return (
                <Card className="feature-card border-0">
                  <CardContent className="p-6 relative">
                    <div className="relative">
                      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-end pr-2">
                        <div className="font-black opacity-10 text-[72px] sm:text-[96px] leading-none uyp-glow-pink">{overall}</div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground neon-glow-pink mb-2">Toxicity Score</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                        <div className="text-sm font-semibold mb-1">{confidence}</div>
                        {why && <p className="text-sm text-foreground/90 leading-relaxed">{why}</p>}
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Subscales</div>
                        <div className="space-y-2">
                          {subs.map((s, i) => (
                            <div key={`tox-side-${i}`} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-foreground/80">
                                <span>{s.label}</span>
                                <span>{s.value}/10</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                                <div className="h-full rounded-full uyp-glow-bar" style={{ width: `${(s.value / 10) * 100}%`, background: s.color, ['--uyp-bar-color' as any]: s.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
            {/* Report Stats Card */}
            <Card className="feature-card border-0">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Report Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Responses Analyzed</span>
                    <span className="text-sm font-medium text-foreground">{questionCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sections Generated</span>
                    <span className="text-sm font-medium text-foreground">15</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Report Type</span>
                    <span className="text-sm font-medium text-foreground">Comprehensive</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps (Sidebar) */}
            {(() => {
              const steps = parseNextSteps(comprehensiveReport)
              if (!steps || steps.length === 0) return null
              return (
                <Card className="feature-card border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Next Steps</h3>
                    <ul className="space-y-2">
                      {steps.slice(0, 5).map((s, i) => (
                        <li key={`ns-side-${i}`} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full inline-block uyp-bullet-neon" />
                          <span className="text-sm leading-relaxed text-foreground/90">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Resources Mini Card */}
            {(() => {
              const res = parseResources(comprehensiveReport)
              if (!res) return null
              const emoji = { apps: '📱', books: '📕', articles: '🗞️' }
              return (
                <Card className="feature-card border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Resources</h3>
                    <div className="space-y-4">
                      {res.apps.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm text-foreground">
                            <span className="mr-2">{emoji.apps}</span>
                            <span>Apps</span>
                          </div>
                          {res.apps.slice(0, 3).map((it, idx) => (
                            <div key={`app-${idx}`} className="ml-6">
                              <div className="text-sm font-bold">{it.name}</div>
                              {it.note && <div className="text-xs italic text-muted-foreground">{it.note}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {res.books.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm text-foreground">
                            <span className="mr-2">{emoji.books}</span>
                            <span>Books</span>
                          </div>
                          {res.books.slice(0, 3).map((it, idx) => (
                            <div key={`book-${idx}`} className="ml-6">
                              <div className="text-sm font-bold">{it.name}</div>
                              {it.note && <div className="text-xs italic text-muted-foreground">{it.note}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {res.articles.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm text-foreground">
                            <span className="mr-2">{emoji.articles}</span>
                            <span>Articles</span>
                          </div>
                          {res.articles.slice(0, 3).map((it, idx) => (
                            <div key={`article-${idx}`} className="ml-6">
                              <div className="text-sm font-bold">{it.name}</div>
                              {it.note && <div className="text-xs italic text-muted-foreground">{it.note}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Professional Help (bold side card) */}
            {(() => {
              const sections = comprehensiveReport.split(/(?=^[A-Z][^a-z])/m).filter(Boolean)
              const sec = sections.find(s => /^PROFESSIONAL HELP$/i.test(s.trim().split('\n')[0]?.trim() || ''))
              if (!sec) return null
              const rawLines = sec.trim().split('\n')
              // Remove underline and empty lines
              const body = rawLines.slice(1).filter(l => !/^=+$/.test(l.trim()) && l.trim() !== '')
              const message = body[0]?.trim() || ''
              if (!message) return null
              return (
                <Card className="feature-card border-0">
                  <CardContent className="p-6 relative">
                    <div className="absolute inset-0 rounded-2xl pointer-events-none uyp-glow-indigo-panel" />
                    <div className="flex items-center gap-3 mb-2">
                      <LifeBuoy className="h-5 w-5 text-[#6366f1]" />
                      <h3 className="text-lg font-bold text-foreground neon-glow-blue">Professional Help</h3>
                    </div>
                    <p className="text-base font-semibold leading-relaxed text-foreground">{message}</p>
                  </CardContent>
                </Card>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}