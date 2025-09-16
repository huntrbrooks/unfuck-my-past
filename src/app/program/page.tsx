'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Sparkles, Target, Loader2, ArrowRight, Heart, Brain, Zap, Sun, Moon, Leaf, TrendingUp, Lock, Calendar, Trophy } from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '../../components/LoadingSpinner'
import PaymentForm from '@/components/PaymentForm'
import { Textarea } from '@/components/ui/textarea'
import { useRequireOnboardingAndDiagnostic } from '@/hooks/use-access-guard'

interface ProgramProgress {
  completed: number
  total: number
  percentage: number
  currentDay: number
  streak: number
}

interface PersonalizedDay {
  day: number
  title: string
  focus: string
  content: {
    introduction: string
    mainFocus: string
    guidedPractice: string
    challenge: string
    journalingPrompt: string
    reflection: string
    weather: string
    sleep: string
    holistic: string
    tools: string
  }
  metadata: {
    category: 'awareness' | 'processing' | 'integration' | 'action'
    duration: number
    difficulty: 'easy' | 'moderate' | 'challenging'
    traumaFocus: string[]
  }
  theme?: string
  poeticTitle?: string
}

export default function Program() {
  const router = useRouter()
  const { checking, allowed } = useRequireOnboardingAndDiagnostic()
  const [progress, setProgress] = useState<ProgramProgress | null>(null)
  const [currentDay, setCurrentDay] = useState<PersonalizedDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [weatherData, setWeatherData] = useState<{
    insight: {
      weatherSummary: string;
      activityRecommendations: string;
      environmentalAdaptations: string;
      seasonalPractices: string;
    }
  } | null>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())
  const [completingDay, setCompletingDay] = useState(false)
  const [showNextDayButton, setShowNextDayButton] = useState(false)
  const [nextDayDifficulty, setNextDayDifficulty] = useState<'easy' | 'moderate' | 'challenging'>('easy')
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>({
    mainFocus: true,
    guidedPractice: true,
    challenge: true,
    journalingPrompt: true,
    reflection: true,
    weather: true,
    sleep: true,
    holistic: true,
  })
  const [sectionTaskCompleted, setSectionTaskCompleted] = useState<Record<string, Set<number>>>(
    {
      guidedPractice: new Set(),
      challenge: new Set(),
      journalingPrompt: new Set(),
      reflection: new Set(),
      weather: new Set(),
      sleep: new Set(),
      holistic: new Set(),
    }
  )
  const [sectionCompleted, setSectionCompleted] = useState<Record<string, boolean>>({
    mainFocus: false,
    guidedPractice: false,
    challenge: false,
    journalingPrompt: false,
    reflection: false,
    weather: false,
    sleep: false,
    holistic: false,
  })
  const [isStructuredDay, setIsStructuredDay] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [resolvingLocation, setResolvingLocation] = useState(false)
  const [countryCode, setCountryCode] = useState('')
  const [reflectionSelected, setReflectionSelected] = useState<Set<number>>(new Set())
  const [reflectionAnswerMode, setReflectionAnswerMode] = useState(false)
  const [reflectionDraftAnswers, setReflectionDraftAnswers] = useState<Record<number, string>>({})
  const [pendingReflectionQA, setPendingReflectionQA] = useState<Array<{ index: number; question: string; answer: string }>>([])
  const [miniJournalEntry, setMiniJournalEntry] = useState('')
  const [miniJournalMood, setMiniJournalMood] = useState<string>('')
  const [miniJournalSaving, setMiniJournalSaving] = useState(false)
  const [miniJournalInsights, setMiniJournalInsights] = useState<string[] | null>(null)
  const [showMiniJournalInsights, setShowMiniJournalInsights] = useState(false)
  const [pendingJournal, setPendingJournal] = useState<{ content: string; mood?: string; insights?: string[] } | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language && !countryCode) {
      const parts = navigator.language.split('-')
      if (parts[1]) setCountryCode(parts[1].toUpperCase())
    }
  }, [])

  useEffect(() => {
    // Reset per-day UI state when day changes
    setSectionCollapsed({ mainFocus: true, guidedPractice: true, challenge: true, journalingPrompt: true, reflection: true, weather: true, sleep: true, holistic: true })
    setSectionTaskCompleted({ guidedPractice: new Set(), challenge: new Set(), journalingPrompt: new Set(), reflection: new Set(), weather: new Set(), sleep: new Set(), holistic: new Set() })
    setSectionCompleted({ mainFocus: false, guidedPractice: false, challenge: false, journalingPrompt: false, reflection: false, weather: false, sleep: false, holistic: false })
    setReflectionSelected(new Set())
    setReflectionAnswerMode(false)
    setReflectionDraftAnswers({})
    setPendingReflectionQA([])
  }, [currentDay?.day])

  const toggleSection = (key: string) => setSectionCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  const isTaskLine = (line: string) => line.trim().startsWith('•') || /^\d+\./.test(line.trim())
  const taskLabel = (line: string) => line.trim().startsWith('•') ? line.substring(1).trim() : line.replace(/^\d+\.\s*/, '').trim()
  const isSubheadingLine = (line: string) => /:\s*$/.test(line.trim())
  const isDurationHeaderLine = (line: string) => /\(\s*\d+(?:\s*-\s*\d+)?\s*minutes?\s*\)/i.test(line.trim())
  const isMainActivityLine = (line: string) => /^Main\s*Activity\s*\(.*minutes?\)/i.test(line.trim())
  type GuidedGroup = {
    headerIndex: number
    headerText: string
    taskIndices: number[]
    lineIndices: number[]
  }
  const buildGuidedPracticeGroups = (lines: string[]): { groups: GuidedGroup[]; preface: number[] } => {
    const groups: GuidedGroup[] = []
    const preface: number[] = []
    let current: GuidedGroup | null = null
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i] ?? ''
      const trimmed = raw.trim()
      if (!trimmed) continue
      const isHeader = isSubheadingLine(trimmed) || isDurationHeaderLine(trimmed)
      if (isHeader) {
        if (current) groups.push(current)
        current = { headerIndex: i, headerText: trimmed, taskIndices: [], lineIndices: [] }
        continue
      }
      if (!current) {
        preface.push(i)
        continue
      }
      current.lineIndices.push(i)
      if (isTaskLine(trimmed)) current.taskIndices.push(i)
    }
    if (current) groups.push(current)
    return { groups, preface }
  }
  const renderQuotedText = (text: string): React.ReactNode => {
    const parts = text.split(/(".*?")/g)
    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith('"') && part.endsWith('"')) {
            return <em key={idx}>{part}</em>
          }
          return <span key={idx}>{part}</span>
        })}
      </>
    )
  }
  const markTask = (sectionKey: string, idx: number, checked: boolean) => {
    setSectionTaskCompleted(prev => {
      const existing = (prev[sectionKey] ?? new Set<number>()) as Set<number>
      const set = new Set<number>(existing)
      if (checked) set.add(idx); else set.delete(idx)
      return { ...prev, [sectionKey]: set }
    })
  }
  const toggleGroupTasks = (sectionKey: string, indices: number[], checked: boolean) => {
    setSectionTaskCompleted(prev => {
      const existing = (prev[sectionKey] ?? new Set<number>()) as Set<number>
      const nextSet = new Set<number>(existing)
      if (checked) {
        indices.forEach(i => nextSet.add(i))
      } else {
        indices.forEach(i => nextSet.delete(i))
      }
      return { ...prev, [sectionKey]: nextSet }
    })
  }
  const allTasksCompleted = (sectionKey: string, lines: string[]) => {
    const indices = lines
      .map((l, i) => (isTaskLine(l)) ? i : -1)
      .filter(i => i >= 0)
    if (indices.length === 0) return false
    const done = sectionTaskCompleted[sectionKey] || new Set()
    return indices.every(i => done.has(i))
  }
  const isSectionDone = (sectionKey: string, lines?: string[]) => {
    if (sectionCompleted[sectionKey]) return true
    if (lines) return allTasksCompleted(sectionKey, lines)
    return false
  }
  const toggleSectionCompleted = (key: string, lines?: string[]) => {
    setSectionCompleted(prev => {
      const next = !prev[key]
      if (lines) {
        setSectionTaskCompleted(prevTasks => {
          const indices = lines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
          const set = next ? new Set<number>(indices) : new Set<number>()
          return { ...prevTasks, [key]: set }
        })
      }
      return { ...prev, [key]: next }
    })
  }

  // Section-specific completion helpers
  const SLEEP_EXTRA_INDICES = [10001, 10002, 10010, 10011, 10012]
  const areAllChecked = (done: Set<number>, indices: number[]): boolean => indices.every(i => done.has(i))

  const isSleepSectionDone = (): boolean => {
    if (!currentDay) return sectionCompleted.sleep
    const lines = filterSleepLines(currentDay.content.sleep.split('\n'))
    const taskIndices = lines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
    const done = (sectionTaskCompleted.sleep || new Set<number>()) as Set<number>
    const hasTaskLines = taskIndices.length > 0
    const extrasDone = areAllChecked(done, SLEEP_EXTRA_INDICES)
    if (hasTaskLines) return sectionCompleted.sleep || (areAllChecked(done, taskIndices) && extrasDone)
    // If no bullet/numbered tasks exist in Sleep, rely on extras only
    return sectionCompleted.sleep || extrasDone
  }

  const toggleSleepSectionCompleted = () => {
    if (!currentDay) return
    const lines = filterSleepLines(currentDay.content.sleep.split('\n'))
    const taskIndices = lines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
    setSectionCompleted(prev => {
      const next = !prev.sleep
      setSectionTaskCompleted(prevTasks => {
        const set = next ? new Set<number>([...taskIndices, ...SLEEP_EXTRA_INDICES]) : new Set<number>()
        return { ...prevTasks, sleep: set }
      })
      return { ...prev, sleep: next }
    })
  }

  const isHolisticSectionDone = (): boolean => {
    if (!currentDay) return sectionCompleted.holistic
    const lines = currentDay.content.holistic.split('\n')
    const taskIndices = lines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
    if (taskIndices.length === 0) return sectionCompleted.holistic
    const done = (sectionTaskCompleted.holistic || new Set<number>()) as Set<number>
    return sectionCompleted.holistic || areAllChecked(done, taskIndices)
  }

  const toggleHolisticSectionCompleted = () => {
    if (!currentDay) return
    const lines = currentDay.content.holistic.split('\n')
    const taskIndices = lines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
    setSectionCompleted(prev => {
      const next = !prev.holistic
      if (taskIndices.length > 0) {
        setSectionTaskCompleted(prevTasks => {
          const set = next ? new Set<number>(taskIndices) : new Set<number>()
          return { ...prevTasks, holistic: set }
        })
      }
      return { ...prev, holistic: next }
    })
  }

  // Simple helpers for theme/title and glow classes
  const NEON_CLASSES = ['neon-glow-cyan', 'neon-glow-pink', 'neon-glow-orange'] as const
  const hashString = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
    return Math.abs(h)
  }
  const pickGlowClass = (key: string) => NEON_CLASSES[hashString(key) % NEON_CLASSES.length]
  const stopwords = new Set(['the','and','a','an','to','of','in','on','for','with','your','you','we','our','is','are','be','this','that','by','from','at','as','into','without','being','their','them','it','about'])
  const extractKeywords = (text: string, limit = 3) => text
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))
    .slice(0, limit)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))

  const deriveTheme = (mainFocus: string): string => {
    const rules: Array<{ re: RegExp; themes: string[] }> = [
      { re: /(emotion|overwhelm|feeling|regulate|regulation)/i, themes: ['Emotional Resilience', 'Calm Response', 'Steady Heart', 'Clear Feeling'] },
      { re: /(boundary|boundaries|limit|space)/i, themes: ['Gentle Boundaries', 'Sacred Space', 'Firm Kindness', 'Quiet Strength'] },
      { re: /(shame|guilt|worth|worthless)/i, themes: ['Self‑Forgiveness', 'Soft Worth', 'Inner Kindness', 'Belonging'] },
      { re: /(trust|relationship|attach|intimacy|connection|connect)/i, themes: ['Honest Connection', 'Open Trust', 'Brave Intimacy', 'Kind Presence'] },
      { re: /(mindful|breath|breathe|ground|present|awareness)/i, themes: ['Grounded Presence', 'Slow Breath', 'Calm Anchor', 'Still Mind'] },
      { re: /(sleep|rest|restore|fatigue|tired)/i, themes: ['Deep Rest', 'Soft Night', 'Restful Mind', 'Gentle Unwind'] },
      { re: /(trigger|react|reaction)/i, themes: ['Pause Power', 'Trigger Tamer', 'Chosen Response', 'Steady Pause'] }
    ]
    for (const r of rules) {
      if (r.re.test(mainFocus)) {
        const idx = hashString(mainFocus) % r.themes.length
        return r.themes[idx]
      }
    }
    const kws = extractKeywords(mainFocus, 3)
    return kws.length ? kws.join(' ') : 'Daily Intention'
  }

  const derivePoeticTitle = (mainFocus: string, theme: string): string => {
    const base = extractKeywords(mainFocus, 2)
    const noun = base[0] || 'Heart'
    const noun2 = base[1] || 'Calm'
    const pools: Record<string, string[]> = {
      default: [
        `Breathing Room for the ${noun}`,
        `A Soft Spine in Storms`,
        `Walking Toward the Quiet ${noun2}`,
        `Where ${noun}s Learn to Rest`,
        `Holding Yourself with Gentle Hands`,
        `Turning Toward the ${noun2}`
      ],
      emotion: [
        `Listening Beneath the Waves`,
        `Tides That Teach ${noun2}`,
        `The Weather Inside Learns Sunlight`
      ],
      boundary: [
        `Fences Made of Light`,
        `A Gate You Hold from Love`,
        `Rooms with Open Windows`
      ],
      trust: [
        `Bridges Built Slowly`,
        `Open Hands, Open Door`,
        `A Yes You Can Believe`
      ]
    }
    const key = /(emotion|overwhelm|feeling)/i.test(mainFocus)
      ? 'emotion'
      : /(boundary|boundaries)/i.test(mainFocus)
      ? 'boundary'
      : /(trust|connect|intimacy|relationship)/i.test(mainFocus)
      ? 'trust'
      : 'default'
    const choices = pools[key]
    const picked = choices[hashString(mainFocus + theme) % choices.length]
    return picked
  }

  // Estimate total duration by parsing durations from guided practice and challenge lines
  const estimatedTotalMinutes = useMemo(() => {
    if (!currentDay) return 30
    const parseDur = (text: string): number => {
      // captures (5 minutes) or (15-20 minutes) -> take upper bound when range
      const m = text.match(/\((\d+)(?:\s*-\s*(\d+))?\s*minutes?\)/i)
      if (!m) return 0
      const a = Number(m[1])
      const b = m[2] ? Number(m[2]) : undefined
      return b && b > a ? b : a
    }
    let total = 0
    // Guided Practice: sum all explicit duration lines
    currentDay.content.guidedPractice.split('\n').forEach(l => { total += parseDur(l) })
    // Daily Challenge main activity: count first duration occurrence
    const chLines = currentDay.content.challenge.split('\n')
    for (const l of chLines) { const d = parseDur(l); if (d) { total += d; break } }
    // Sleep & Wellness, Holistic: typically checklist (no explicit minutes) -> skip
    // Journaling/Reflection: add small fixed buffers
    total += 5 // journaling quick entry buffer
    total += 5 // reflection buffer
    return total || 30
  }, [currentDay])

  const buildMainFocusDetail = (mainFocus: string, themeText: string) => {
    const focus = (mainFocus || 'Daily Healing Practice').trim()
    const theme = (themeText || deriveTheme(focus)).trim()
    return (
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <p><strong className="text-foreground">What today focuses on</strong>: {focus}</p>
        <p><strong className="text-foreground">Why this matters now</strong>: This theme of {theme.toLowerCase()} targets a current friction point so you can reduce emotional load and build momentum in small, sustainable ways.</p>
        <p><strong className="text-foreground">How it helps you personally</strong>: It translates to one or two clear actions you can finish today—proof that progress is possible without overwhelm.</p>
      </div>
    )
  }

  // Journaling helpers
  const extractPrimaryPrompt = (lines: string[]): { prompt: string; exclude: Set<number> } => {
    const exclude = new Set<number>()
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i]?.trim() || ''
      if (!t) continue
      if (/^📝/.test(t) || /^##\s*📝/i.test(t)) continue
      if (/^Primary\s*Question:/i.test(t)) {
        const nxt = (lines[i + 1] || '').trim()
        if (nxt) {
          const q = nxt.replace(/^"|"$/g, '')
          exclude.add(i); exclude.add(i + 1)
          return { prompt: q, exclude }
        }
      }
      if (/^".*"$/.test(t)) {
        exclude.add(i)
        return { prompt: t.replace(/^"|"$/g, ''), exclude }
      }
      if (/\?$/.test(t)) {
        exclude.add(i)
        return { prompt: t, exclude }
      }
    }
    // fallback: first meaningful non-bullet line
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i]?.trim() || ''
      if (!t) continue
      if (t.startsWith('•') || /^\d+\./.test(t) || /^📝/.test(t)) continue
      exclude.add(i)
      return { prompt: t.replace(/^"|"$/g, ''), exclude }
    }
    return { prompt: 'What feels most alive for you right now?', exclude }
  }

  const getPromptSubject = (prompt: string): string => {
    const raw = (prompt || '').replace(/^"|"$/g, '').trim()
    const withoutLead = raw.replace(/^(how|what|why|when|where|which|who)\s+(does|do|did|is|are|was|were|can|could|should|would|will|might|may)\s+/i, '')
    const core = withoutLead.replace(/[?]+$/g, '')
    const tokens = core.split(/\s+/)
    const banned = new Set<string>([
      'does','do','did','is','are','was','were','can','could','should','would','will','might','may','how','what','why','when','where','which','who','your','you','our','the','and','with','into','from','that','this','about'
    ])
    for (const t of tokens) {
      const clean = t.toLowerCase().replace(/[^a-z]/g, '')
      if (clean.length >= 4 && !banned.has(clean)) return clean
    }
    return 'this topic'
  }

  const buildJournalingExplanation = (prompt: string): string => {
    const topic = getPromptSubject(prompt)
    return `This prompt helps you notice patterns around ${topic}, name what's true without judgment, and choose a 1% kinder response going forward.`
  }

  const buildFollowUpQuestions = (prompt: string): string[] => {
    const subject = getPromptSubject(prompt)
    return [
      `When does ${subject} feel strongest, and what small trigger shows up first?`,
      `If you gave yourself a 1% kinder response next time, what would that look like?`,
      `What boundary or support would make working with ${subject} easier today?`
    ]
  }

  useEffect(() => {
    checkProgramAccess()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const requestLocationPermission = async () => {
    // Weather location feature removed per product decision
    setLocationPermission('denied')
  }

  const resolveManualLocation = async () => {
    // Manual location resolution removed
    setResolvingLocation(false)
  }

  const checkProgramAccess = async () => {
    try {
      setCheckingAccess(true)
      // Check payment status FIRST (no bypass via existing progress)
      const response = await fetch('/api/payments/user-purchases')
      
      if (response.ok) {
        const data = await response.json()
        const hasProgramAccess = Array.isArray(data) && data.some((purchase: { product: string; active: boolean }) => 
          purchase.product === 'program' && purchase.active === true
        )
        console.log('Program access check:', { hasProgramAccess, purchases: data })
        setHasAccess(hasProgramAccess)
        
        if (hasProgramAccess) {
          loadProgramData()
        }
      } else {
        setHasAccess(false)
      }
    } catch (error) {
      console.error('Error checking program access:', error)
      setHasAccess(false)
    } finally {
      setCheckingAccess(false)
    }
  }

  const loadProgramData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load progress
      const progressResponse = await fetch('/api/program/progress')
      if (progressResponse.ok) {
      const progressData = await progressResponse.json()
        console.log('Program progress data:', progressData)
        
        // The API returns progress directly, not nested under .progress
        if (progressData.completed !== undefined) {
      setProgress(progressData)
        } else {
          console.log('No progress found, creating initial progress...')
          setProgress({
            completed: 0,
            total: 30,
            percentage: 0,
            currentDay: 1,
            streak: 0
          })
        }
        
        // Load current day content
        const currentDay = progressData.currentDay || 1
        if (currentDay <= 30) {
          // Try to load existing content first
          let dayResponse = await fetch(`/api/program/daily?day=${currentDay}`)
          
          // If no existing content, generate it
          if (!dayResponse.ok) {
            console.log('No existing content for day', currentDay, '- generating...')
            dayResponse = await fetch('/api/program/daily', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                dayNumber: currentDay,
                weatherData: weatherData 
              })
            })
          }
          
          if (dayResponse.ok) {
            const dayData = await dayResponse.json()
            console.log('Day data loaded for day', currentDay)
            const parsedContent = parseDailyContent(dayData.content, weatherData)
            const theme = dayData.theme || deriveTheme(parsedContent.mainFocus)
            const poeticTitle = dayData.poeticTitle || derivePoeticTitle(parsedContent.mainFocus, theme)

            // Map difficulty from structured plan when present
            const mapStructuredDifficulty = (d: string | undefined): 'easy' | 'moderate' | 'challenging' => {
              if (!d) return 'moderate'
              if (d === 'easy') return 'easy'
              if (d === 'medium') return 'moderate'
              if (d === 'hard') return 'challenging'
              return 'moderate'
            }
            const effectiveDifficulty: 'easy' | 'moderate' | 'challenging' = dayData.isStructured && dayData.structuredPlan
              ? mapStructuredDifficulty(dayData.structuredPlan?.difficulty)
              : 'moderate'

            setIsStructuredDay(Boolean(dayData.isStructured))
            setCurrentDay({
              day: currentDay,
              title: `Day ${currentDay}`,
              focus: parsedContent.mainFocus,
              content: {
                introduction: '',
                mainFocus: parsedContent.mainFocus,
                guidedPractice: parsedContent.guidedPractice,
                challenge: parsedContent.challenge,
                journalingPrompt: parsedContent.journalingPrompt,
                reflection: parsedContent.reflection,
                weather: parsedContent.weather,
                sleep: parsedContent.sleep,
                holistic: parsedContent.holistic,
                tools: parsedContent.tools
              },
              metadata: {
                category: 'awareness',
                duration: 30,
                difficulty: effectiveDifficulty,
                traumaFocus: []
              },
              theme,
              poeticTitle
            })
          } else {
            console.error('Failed to load/generate day content, response:', dayResponse.status)
            const errorText = await dayResponse.text().catch(() => 'Unknown error')
            console.error('Error details:', errorText)
            setError('Failed to generate daily content')
          }
        } else {
          setError('Program completed - all 30 days finished')
        }
      } else {
        console.error('Failed to load progress, response:', progressResponse.status)
        setError('Failed to load program progress')
      }
    } catch (error) {
      setError('Failed to load program data')
      console.error('Error loading program data:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseDailyContent = (content: string, weatherData?: {
    insight: {
      weatherSummary: string;
      activityRecommendations: string;
      environmentalAdaptations: string;
      seasonalPractices: string;
    }
  } | null) => {
    const sections = {
      mainFocus: '',
      guidedPractice: '',
      challenge: '',
      journalingPrompt: '',
      reflection: '',
      weather: '',
      sleep: '',
      holistic: '',
      tools: ''
    }

    // Clean up AI-generated text that shouldn't be displayed
    const cleanedContent = content
      .replace(/\[Continuing in next part due to length\.\.\.\]/g, '')
      .replace(/\[Note: Would you like me to continue with the remaining sections\?.*?\]/g, '')
      .replace(/\[Content continues with all remaining sections\.\.\. Would you like me to continue with the rest\?\]/g, '')
      .replace(/\[Rest of sections to follow in next response due to length limit\.\.\.\]/g, '')
      .replace(/Would you like me to continue with the remaining sections\?/g, '')
      .replace(/Content length: \d+/g, '')
      .replace(/Content preview: .*/g, '')

    const lines = cleanedContent.split('\n')
    let currentSection = ''
    const extractInlineMainFocus = (line: string): string => {
      const candidates = [
        /🎯\s*MAIN\s*FOCUS\s*:\s*(.+)$/i,
        /Main\s*Focus\s*:\s*(.+)$/i
      ]
      for (const re of candidates) {
        const m = line.match(re)
        if (m && m[1]) return m[1].trim()
      }
      return ''
    }
    const sanitizeFocus = (text: string): string => {
      const t = (text || '').split('\n').map(s => s.trim()).filter(Boolean)[0] || ''
      if (!t) return ''
      // strip any leading header tokens if present
      return t.replace(/^🎯\s*MAIN\s*FOCUS\s*:\s*/i, '').replace(/^#+\s*🎯\s*Main\s*Focus\s*:\s*/i, '').trim()
    }
    
    for (const line of lines) {
      // Check for both new and old format headers
      if (line.includes('🎯 MAIN FOCUS:') || line.includes('## 🎯 Main Focus:') || /Main\s*Focus\s*:/i.test(line)) {
        currentSection = 'mainFocus'
        const inline = extractInlineMainFocus(line)
        if (inline) sections.mainFocus = inline
      } else if (line.includes('🌅 GUIDED PRACTICE') || line.includes('## 🌅 Guided Practice')) {
        currentSection = 'guidedPractice'
      } else if (line.includes('⚡ DAILY CHALLENGE') || line.includes('## ⚡ Daily Challenge')) {
        currentSection = 'challenge'
      } else if (line.includes('📝 JOURNALING PROMPT') || line.includes('## 📝 Journaling Prompt')) {
        currentSection = 'journalingPrompt'
      } else if (line.includes('🌙 REFLECTION') || line.includes('## 🌙 Reflection')) {
        currentSection = 'reflection'
      } else if (line.includes('🌤️ WEATHER & ENVIRONMENT') || line.includes('## 🌤️ Weather & Environment') || /weather\s*&\s*environment/i.test(line)) {
        currentSection = 'weather'
      } else if (line.includes('😴 SLEEP & WELLNESS') || line.includes('## 😴 Sleep & Wellness') || /sleep\s*&\s*wellness/i.test(line)) {
        currentSection = 'sleep'
      } else if (line.includes('🌿 HOLISTIC HEALING BONUS') || line.includes('## 🌿 Holistic Healing Bonus') || /holistic\s*healing\s*bonus/i.test(line)) {
        currentSection = 'holistic'
      } else if (line.includes('🛠️ TOOLS & RESOURCES') || line.includes('## 🛠️ Tools & Resources')) {
        currentSection = 'tools'
      } else if (currentSection && line.trim()) {
        if (currentSection in sections) {
          // Keep main focus compact: do not append extra lines beyond the title
          if (currentSection === 'mainFocus') {
            // no-op: title already captured; skip verbose lines
          } else {
            sections[currentSection as keyof typeof sections] += line + '\n'
          }
        }
      }
    }

    // If sections missing, try to extract content from the raw text without reusing mainFocus
    if (!sections.guidedPractice || !sections.challenge || !sections.journalingPrompt || !sections.reflection) {
      // Fallback: try to parse content by looking for common patterns
      const contentLower = content.toLowerCase()
      
        const parts = content.split('\n\n').filter(part => part.trim())
      const pick = (idx: number) => (parts[idx] || '').includes('MAIN FOCUS') ? '' : (parts[idx] || '')
      if (!sections.guidedPractice) sections.guidedPractice = pick(0)
      if (!sections.challenge) sections.challenge = pick(1)
      if (!sections.journalingPrompt) sections.journalingPrompt = pick(2)
      if (!sections.reflection) sections.reflection = pick(3)
    }

    // Do not override; use AI-provided static warm/cold lists
    sections.weather = sections.weather || 'Warm & Sunny:\n• 10–15 min sunlight walk\n• Ground barefoot on grass\n• Sunlit spot, 5-min warmth meditation\n\nCold & Raining:\n• Indoor mobility flow (10 min)\n• Hot shower ritual\n• Window‑gazing, 3‑min naming practice'

    // Ensure all sections have content
    sections.mainFocus = sanitizeFocus(sections.mainFocus) || (() => {
      const m = cleanedContent.match(/🎯\s*MAIN\s*FOCUS\s*:\s*(.+)$/im) || cleanedContent.match(/Main\s*Focus\s*:\s*(.+)$/im)
      return m && m[1] ? m[1].trim() : 'Daily Healing Practice'
    })()
    sections.guidedPractice = sections.guidedPractice || 'Content not available'
    sections.challenge = sections.challenge || 'Content not available'
    sections.journalingPrompt = sections.journalingPrompt || 'Content not available'
    sections.reflection = sections.reflection || 'Content not available'
    sections.sleep = sections.sleep || 'Sleep recommendations not available'
    sections.holistic = sections.holistic || 'Holistic practices not available'
    sections.tools = sections.tools || 'Tools and resources not available'

    return sections
  }

  const completeDay = async () => {
    if (!progress || !currentDay) return

    try {
      setCompletingDay(true)
      
      // Mark day as completed locally
      setCompletedDays(prev => new Set(Array.from(prev).concat(currentDay.day)))
      setShowNextDayButton(true)

      // Tick all section checkboxes and mark sections as completed locally
      try {
        const gpLines = currentDay.content.guidedPractice.split('\n')
        const chLines = currentDay.content.challenge.split('\n')
        const slLines = filterSleepLines(currentDay.content.sleep.split('\n'))
        const hoLines = currentDay.content.holistic.split('\n')

        const gpIdx = gpLines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
        const chIdx = chLines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
        const slIdx = slLines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)
        const hoIdx = hoLines.map((l, i) => (isTaskLine(l) ? i : -1)).filter(i => i >= 0)

        // Include appended Sleep extras
        const sleepExtras = [10001, 10002, 10010, 10011, 10012]

        setSectionTaskCompleted(prev => ({
          ...prev,
          guidedPractice: new Set<number>(gpIdx),
          challenge: new Set<number>(chIdx),
          sleep: new Set<number>([...slIdx, ...sleepExtras]),
          holistic: new Set<number>(hoIdx)
        }))

        setSectionCompleted(prev => ({
          ...prev,
          mainFocus: true,
          guidedPractice: true,
          challenge: true,
          journalingPrompt: true,
          reflection: true,
          weather: true,
          sleep: true,
          holistic: true
        }))
      } catch (_) {
        // noop – visual ticking is best-effort
      }

      // Generate PDF for completed day
      try {
        const pdfResponse = await fetch('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            type: 'program-daily-pdf',
            dayNumber: currentDay.day,
            dayContent: currentDay
          })
        })

        if (pdfResponse.ok) {
          await pdfResponse.json()
          // Store PDF data for download later
          console.log('PDF generated for day', currentDay.day)
        }
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError)
      }

      // Update progress on server
      const response = await fetch('/api/program/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ day: currentDay.day }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete day')
      }

      const result = await response.json()
      // Update progress from server response
      if (result.progress) {
      setProgress(result.progress)
      } else {
        // Fallback: update locally
        setProgress(prev => prev ? {
          ...prev,
          completed: prev.completed + 1,
          percentage: ((prev.completed + 1) / prev.total) * 100
        } : null)
      }
      
    } catch (error) {
      setError('Failed to complete day')
      console.error('Error completing day:', error)
      // Revert local state on error
      setCompletedDays(prev => {
        const newSet = new Set(prev)
        newSet.delete(currentDay.day)
        return newSet
      })
      setShowNextDayButton(false)
    } finally {
      setCompletingDay(false)
    }
  }

  const startNextDay = async () => {
    if (!progress) return

    try {
      setLoading(true)
      setShowNextDayButton(false)
      
      // Generate next day content with context of previous days
      const baseDay = (currentDay?.day || progress.currentDay || 1)
      if (baseDay >= 30) {
        setError('Program completed - all 30 days finished')
        return
      }
      const nextDay = Math.min(30, baseDay + 1)
      console.log('Generating content for day', nextDay)
      
      const response = await fetch('/api/program/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dayNumber: nextDay,
          weatherData: weatherData,
          previousDays: Array.from(completedDays),
          currentProgress: progress,
          difficulty: nextDayDifficulty,
          reflectionQA: pendingReflectionQA.map(({ question, answer }) => ({ question, answer })),
          journal: pendingJournal
        })
      })

      if (response.ok) {
        const dayData = await response.json()
        const parsedContent = parseDailyContent(dayData.content, weatherData)
        const theme = dayData.theme || deriveTheme(parsedContent.mainFocus)
        const poeticTitle = dayData.poeticTitle || derivePoeticTitle(parsedContent.mainFocus, theme)

        const effectiveDifficulty = (dayData?.isStructured && dayData?.structuredPlan?.difficulty)
          ? (dayData.structuredPlan.difficulty === 'easy' ? 'easy' : dayData.structuredPlan.difficulty === 'medium' ? 'moderate' : 'challenging')
          : nextDayDifficulty

        setIsStructuredDay(Boolean(dayData.isStructured))
        setCurrentDay({
          day: nextDay,
          title: parsedContent.mainFocus,
          focus: parsedContent.mainFocus,
          content: {
            introduction: '',
            mainFocus: parsedContent.mainFocus,
            guidedPractice: parsedContent.guidedPractice,
            challenge: parsedContent.challenge,
            journalingPrompt: parsedContent.journalingPrompt,
            reflection: parsedContent.reflection,
            weather: parsedContent.weather,
            sleep: parsedContent.sleep,
            holistic: parsedContent.holistic,
            tools: parsedContent.tools
          },
          metadata: {
            category: 'awareness',
            duration: 30,
            difficulty: effectiveDifficulty,
            traumaFocus: []
          },
          theme,
          poeticTitle
        })

        // Clear pending reflection data after generating next day
        setPendingReflectionQA([])
        // Don't update progress here - it will be updated when the day is completed
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('Failed to generate next day content:', response.status, errorText)
        throw new Error(`Failed to generate next day content: ${response.status}`)
      }
    } catch (error) {
      setError('Failed to start next day')
      console.error('Error starting next day:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'challenging':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const JournalingBlock: React.FC<{ text: string; done: boolean }> = ({ text, done }) => {
    const lines = text.split('\n')
    const { prompt, exclude } = extractPrimaryPrompt(lines)
    const explanation = buildJournalingExplanation(prompt)
    const followUps = buildFollowUpQuestions(prompt)

    // Use negative indices to track computed follow-ups without colliding with line indices
    const computedFollowUpBaseIndex = -1000

    // Track whether we're within specific sub-sections of the journaling content
    let inFollowUps = false
    let inEmotionCheck = false

    return (
      <div id="section-journalingPrompt" className={`whitespace-pre-line leading-relaxed space-y-3 ${done ? 'text-[#ccff00]' : 'text-foreground'}`}>
        <div className="space-y-2">
          <div className="font-semibold text-foreground">{prompt}</div>
          <div className="italic text-muted-foreground">{explanation}</div>
          {/* Render follow-up questions as checkboxes */}
          <div className="space-y-2">
            {followUps.map((q, i) => {
              const idx = computedFollowUpBaseIndex - i
              const checked = (sectionTaskCompleted.journalingPrompt || new Set<number>()).has(idx)
              return (
                <label key={`fu-${i}`} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={(e) => markTask('journalingPrompt', idx, e.target.checked)}
                    aria-label={`Follow-up question ${i + 1}`}
                  />
                  <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{q}</span>
                </label>
              )
            })}
          </div>
        </div>
        {/* Render generated lines; convert follow-ups and emotional check-ins to checkboxes */}
        {lines.map((line, index) => {
          if (exclude.has(index)) return null
          const trimmed = line.trim()
          if (!trimmed) return null

          if (isSubheadingLine(trimmed)) {
            const heading = trimmed.replace(/:\s*$/, '').toLowerCase()
            inFollowUps = /follow-?up/.test(heading)
            inEmotionCheck = /emotional\s*check-?in/.test(heading)
            return <div key={index} className="font-semibold underline text-foreground">{trimmed}</div>
          }

          // Skip the main journaling header line
          if (trimmed.startsWith('📝')) return null

          // In the Follow-up Questions sub-section, skip generated bullets (we already show computed ones)
          if (inFollowUps && trimmed.startsWith('•')) return null

          // In the Emotional Check-in sub-section, render bullets as checkboxes
          if (inEmotionCheck && trimmed.startsWith('•')) {
            const checked = (sectionTaskCompleted.journalingPrompt || new Set<number>()).has(index)
            return (
              <label key={index} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={(e) => markTask('journalingPrompt', index, e.target.checked)}
                  aria-label={`Emotion check-in item ${index + 1}`}
                />
                <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{renderQuotedText(trimmed.substring(1).trim())}</span>
              </label>
            )
          }

          // Default rendering for non-heading, non-bullet lines
          if (!trimmed.startsWith('•')) {
            return <div key={index} className="font-medium text-foreground">{renderQuotedText(trimmed)}</div>
          }

          // Bullet lines outside the special sub-sections render as simple bullets
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="text-foreground mt-1">•</span>
              <span>{renderQuotedText(trimmed.substring(1).trim())}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const renderChallengeLines = (lines: string[]) => {
    const nodes: React.ReactNode[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const trimmed = line.trim()
      if (!trimmed) continue
      if (isSubheadingLine(trimmed)) {
        nodes.push(<div key={`ch-sub-${i}`} className="font-semibold underline text-foreground">{trimmed}</div>)
        continue
      }
      // Energy level adaptations styling
      if (/^(Low|Medium|High):/i.test(trimmed)) {
        const level = trimmed.match(/^(Low|Medium|High):/i)?.[1]?.toLowerCase() || ''
        const colorClass = level === 'medium'
          ? 'text-[#ffd400]'
          : level === 'high'
            ? 'text-[#ccff00]'
            : 'text-[#ff3366]'
        const glowStyle = level === 'medium'
          ? { filter: 'drop-shadow(0 0 8px #ffd400)' }
          : level === 'high'
            ? { filter: 'drop-shadow(0 0 8px #ccff00)' }
            : { filter: 'drop-shadow(0 0 8px #ff3366)' }
        nodes.push(
          <div key={`ch-energy-${i}`} className={`font-medium ${colorClass}`} style={glowStyle}>{renderQuotedText(trimmed)}</div>
        )
        continue
      }
      if (isMainActivityLine(trimmed)) {
        const duration = (trimmed.match(/\(([^)]+)\)/) || [,''])[1]
        // Next non-empty line is treated as title
        const next = (lines[i + 1] || '').trim()
        const title = next || trimmed.replace(/^Main\s*Activity\s*/i, '').replace(/\(([^)]+)\)/, '').trim()
        nodes.push(<div key={`ch-main-${i}`} className="font-semibold text-foreground">{`${title}${duration ? ` (${duration})` : ''}`}</div>)
        if (next) i += 1
        continue
      }
      if (isTaskLine(trimmed)) {
        const checked = (sectionTaskCompleted.challenge || new Set()).has(i)
        nodes.push(
          <label key={`ch-task-${i}`} className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('challenge', i, e.target.checked)} aria-label={`Daily Challenge step ${i + 1}`} />
            <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{renderQuotedText(taskLabel(trimmed))}</span>
          </label>
        )
        continue
      }
      if (!trimmed.startsWith('⚡')) {
        nodes.push(<div key={`ch-text-${i}`} className="font-medium text-foreground">{renderQuotedText(trimmed)}</div>)
      }
    }
    return nodes
  }

  const getReflectionQuestionCount = (_difficulty: 'easy' | 'moderate' | 'challenging'): number => {
    return 5
  }

  const buildReflectionQuestions = (
    mainFocus: string,
    themeText: string,
    difficulty: 'easy' | 'moderate' | 'challenging'
  ): string[] => {
    const focus = (mainFocus || 'today\'s practice').trim()
    const theme = (themeText || deriveTheme(focus)).trim()
    const base: string[] = [
      `What did you notice shifting in you while working with ${theme.toLowerCase()}?`,
      `Where did resistance show up today, and what did it try to protect?`,
      `What small proof did you gather that ${focus.toLowerCase()} matters for your healing?`,
      `If you repeated one tiny part of today tomorrow, which would build the most momentum?`,
      `What support or boundary would make ${theme.toLowerCase()} easier for you this week?`
    ]
    const count = getReflectionQuestionCount(difficulty)
    return base.slice(0, count)
  }

  const moodOptions = [
    { emoji: '😊', label: 'Happy', value: 'happy' },
    { emoji: '😌', label: 'Calm', value: 'calm' },
    { emoji: '😔', label: 'Sad', value: 'sad' },
    { emoji: '😰', label: 'Anxious', value: 'anxious' },
    { emoji: '😴', label: 'Tired', value: 'tired' },
    { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' },
    { emoji: '💪', label: 'Motivated', value: 'motivated' },
    { emoji: '🕊️', label: 'Peaceful', value: 'peaceful' },
    { emoji: '🔥', label: 'Energized', value: 'energized' }
  ] as const

  const generateLocalInsights = (content: string, mood: string): string[] => {
    const lower = (content || '').toLowerCase()
    const insights: string[] = []
    if (lower.includes('grateful') || lower.includes('thankful')) insights.push("You're practicing gratitude - this is linked to improved wellbeing")
    if (lower.includes('stress') || lower.includes('worried')) insights.push('Try a 4-2-6 breath when stress spikes')
    if ((mood || '') === 'happy') insights.push('Positive affect boosts learning and creativity today')
    if ((mood || '') === 'motivated') insights.push('Motivation paired with small actions creates lasting change')
    if ((mood || '') === 'peaceful') insights.push('Inner peace is a foundation for healing and growth')
    if ((mood || '') === 'energized') insights.push('High energy is perfect for tackling challenging tasks today')
    if (content.length > 200) insights.push('Long-form reflection helps integrate emotions')
    if (lower.includes('goal') || lower.includes('plan')) insights.push('Setting intentions increases follow‑through')
    if (insights.length === 0) insights.push('Consistent journaling improves self-awareness over time')
    return insights
  }

  const saveMiniJournal = async (content: string, mood: string) => {
    if (!content.trim()) return
    setMiniJournalSaving(true)
    try {
      const res = await fetch('/api/journal/insight', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mood })
      })
      let insights: string[]
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        insights = Array.isArray(data.insights) ? data.insights : []
      } else {
        insights = generateLocalInsights(content, mood)
      }
      setMiniJournalInsights(insights)
      setShowMiniJournalInsights(true)
      setPendingJournal({ content, mood, insights })
      setSectionCompleted(prev => ({ ...prev, journalingPrompt: true }))
    } catch {
      const insights = generateLocalInsights(content, mood)
      setMiniJournalInsights(insights)
      setShowMiniJournalInsights(true)
      setPendingJournal({ content, mood, insights })
      setSectionCompleted(prev => ({ ...prev, journalingPrompt: true }))
    } finally {
      setMiniJournalSaving(false)
      setMiniJournalEntry('')
      setMiniJournalMood('')
    }
  }

  const filterSleepLines = (lines: string[]): string[] => {
    const result: string[] = []
    let skippingPreBed = false
    for (const rawLine of lines) {
      const line = (rawLine || '').trim()
      if (!skippingPreBed && /^pre[–-]?bedtime\s*routine:?/i.test(line)) {
        skippingPreBed = true
        continue
      }
      if (skippingPreBed) {
        if (line && !isTaskLine(line)) {
          skippingPreBed = false
        } else {
          continue
        }
      }
      result.push(rawLine)
    }
    return result
  }

  // Auto-complete Today's Main Focus when all other sections are done
  useEffect(() => {
    if (!currentDay) return
    const othersDone =
      isSectionDone('guidedPractice', currentDay.content.guidedPractice.split('\n')) &&
      isSectionDone('challenge', currentDay.content.challenge.split('\n')) &&
      isSectionDone('journalingPrompt') &&
      isSectionDone('reflection') &&
      isSectionDone('weather') &&
      isSleepSectionDone() &&
      isHolisticSectionDone()
    if (othersDone && !sectionCompleted.mainFocus) {
      setSectionCompleted(prev => ({ ...prev, mainFocus: true }))
    }
  }, [currentDay, sectionCompleted, sectionTaskCompleted])

  if (checkingAccess || checking) {
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking program access..." />
      </div>
    )
  }

  if (!allowed) return null

  // Single gate: only this page should enforce the program paywall
  if (!hasAccess) {
    return (
      <div className="min-h-screen-dvh bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
                <Image src="/Lineartneon-10.png" alt="program lock art" width={80} height={80} className="w-20 h-auto drop-shadow-[0_0_12px_#a855f7]" />
              </div>
              <div>
                <h1 className="responsive-heading neon-heading">30-Day Healing Program</h1>
                <p className="responsive-body text-muted-foreground">Access your personalized healing journey</p>
              </div>
            </div>
          </div>

          <Card className="glass-card border-0 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20 px-8 py-8">
              <div className="text-center">
                <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center">
                  <Image src="/Lineartneon-06.png" alt="unlock art" width={80} height={80} className="w-20 h-auto drop-shadow-[0_0_12px_#a855f7]" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Unlock Your Healing Journey</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Get access to your personalized 30-day healing program with daily tasks, 
                  journaling prompts, and AI-guided insights tailored to your unique needs.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <PaymentForm
                productName="30-Day Healing Program"
                amount={2995} // $29.95 in cents
                onSuccess={() => {
                  console.log('🎯 Program payment successful - setting access')
                  setHasAccess(true)
                  setCheckingAccess(false)
                  // Load program data immediately instead of re-checking access
                  loadProgramData()
                }}
                onCancel={() => router.push('/dashboard')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading your healing program..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen-dvh bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Program</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={loadProgramData} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!progress || !currentDay) {
    return (
      <div className="min-h-screen-dvh bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading program data..." />
      </div>
    )
  }

  const overallPercent = Number(((progress.completed / progress.total) * 100).toFixed(2))

  return (
    <div className="min-h-screen-dvh bg-background">
      {/* Header (aligned with Dashboard) */}
      <div className="bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="w-14 h-14 flex items-center justify-center animate-float">
              <Image src="/Icon-02.png" alt="program emblem" width={40} height={40} className="w-10 h-auto drop-shadow-[0_0_12px_#00e5ff]" />
              </div>
            <h1 className="text-3xl font-bold neon-heading">30-Day Healing Program</h1>
            <p className="text-muted-foreground">Day {currentDay.day} of 30</p>
              </div>
          {/* Centered progress overview */}
          <Card className="feature-card border-0 group max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4 md:flex-1">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-black dark:text-white drop-shadow-[0_0_8px_#ccff00]" />
              </div>
                  <div className="w-full">
                    <div className="text-sm text-muted-foreground text-left">Overall Progress</div>
                  <div className="flex items-center gap-3">
                      <div className="flex-1"><Progress value={overallPercent} variant="neonPinkGlow" glow className="h-2" /></div>
                      <div className="text-sm font-medium text-foreground whitespace-nowrap">{overallPercent.toFixed(2)}%</div>
                    </div>
                    </div>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:ml-6">
                  <div className="text-center">
                    <div className="text-base text-muted-foreground">Current</div>
                    <div className="text-xl font-semibold text-foreground">Day {currentDay.day}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base text-muted-foreground">Completed</div>
                    <div className="text-xl font-semibold text-foreground">{progress.completed}</div>
                </div>
                  <div className="text-center">
                    <div className="text-base text-muted-foreground">Streak</div>
                    <div className="text-xl font-semibold text-foreground">{progress.streak}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Location Permission / Manual Input */}
        {false && <div />}

        {/* Location Status */}
        {false && <div />}

        {/* Start New Day Button */}
        {showNextDayButton && currentDay && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                className={`px-4 py-2 rounded-full border ${nextDayDifficulty==='easy' ? 'bg-[#ccff00] text-black shadow-[0_0_12px_rgba(204,255,0,0.6)]' : 'bg-background text-foreground border-border'}`}
                onClick={() => setNextDayDifficulty('easy')}
              >
                Beginner
              </button>
              <button
                className={`px-4 py-2 rounded-full border ${nextDayDifficulty==='moderate' ? 'bg-[#fde047] text-black shadow-[0_0_12px_rgba(253,224,71,0.6)]' : 'bg-background text-foreground border-border'}`}
                onClick={() => setNextDayDifficulty('moderate')}
              >
                Moderate
              </button>
              <button
                className={`px-4 py-2 rounded-full border ${nextDayDifficulty==='challenging' ? 'bg-[#ff1a1a] text-white shadow-[0_0_12px_rgba(255,26,26,0.6)]' : 'bg-background text-foreground border-border'}`}
                onClick={() => setNextDayDifficulty('challenging')}
              >
                Expert
              </button>
            </div>
            <Button 
              onClick={startNextDay}
              className="w-full h-16 text-lg group hover:scale-105 transition-transform duration-200 neon-cta"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading Next Day...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                  Start New Day
                </>
              )}
            </Button>
          </div>
        )}

        {/* Current Day Content */}
        {currentDay && (
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Day Header */}
              <Card className="modern-card border-0">
                <CardHeader className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-foreground">Day {currentDay.day}: {currentDay.poeticTitle || currentDay.title}</h3>
                    <Badge variant="success" className="text-sm" style={{ backgroundColor: '#ccff00', color: '#0a0a0a' }}>
                      {estimatedTotalMinutes} min
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Main Focus */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('mainFocus')}
                          aria-controls="section-mainFocus"
                          className="text-left"
                        >
                          <h5 className="font-semibold flex items-center gap-2 text-lg neon-heading">
                            <Target className={`h-5 w-5 ${isSectionDone('mainFocus') ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#ccff00]'}`} />
                            Today&apos;s Main Focus
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.mainFocus ? '▼' : '▲'}</span>
                          </h5>
                        </button>
                        <label htmlFor="chk-mainFocus" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-mainFocus"
                            type="checkbox"
                            checked={isSectionDone('mainFocus')}
                            onChange={() => toggleSectionCompleted('mainFocus')}
                            aria-label="Mark Today's Main Focus as completed"
                          />
                          {isSectionDone('mainFocus') && (
                            <span className="text-[#ccff00] text-sm drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>
                          )}
                        </label>
                      </div>
                      {!sectionCollapsed.mainFocus && (
                        <div id="section-mainFocus" className="text-foreground">
                          <p>{currentDay.content.mainFocus || 'Daily Healing Practice'}</p>
                          {buildMainFocusDetail(currentDay.content.mainFocus, currentDay.theme || deriveTheme(currentDay.content.mainFocus))}
                        </div>
                      )}
                    </div>

                    {/* Guided Practice */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('guidedPractice')}
                          aria-controls="section-guidedPractice"
                          className="text-left"
                        >
                          <h5 className="font-semibold neon-glow-cyan flex items-center gap-2 text-lg">
                            <Sun className={`h-5 w-5 ${isSectionDone('guidedPractice', currentDay.content.guidedPractice.split('\n')) ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#00e5ff]'}`} />
                        Guided Practice
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.guidedPractice ? '▼' : '▲'}</span>
                      </h5>
                        </button>
                        <label htmlFor="chk-guidedPractice" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-guidedPractice"
                            type="checkbox"
                            checked={isSectionDone('guidedPractice', currentDay.content.guidedPractice.split('\n'))}
                            onChange={() => toggleSectionCompleted('guidedPractice', currentDay.content.guidedPractice.split('\n'))}
                            aria-label="Mark Guided Practice as completed"
                          />
                          {isSectionDone('guidedPractice', currentDay.content.guidedPractice.split('\n')) && (
                            <span className="text-sm text-[#ccff00] drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>
                          )}
                        </label>
                      </div>
                      {!sectionCollapsed.guidedPractice && (
                        <div id="section-guidedPractice" className={`whitespace-pre-line leading-relaxed space-y-4 ${isSectionDone('guidedPractice', currentDay.content.guidedPractice.split('\n')) ? 'text-[#ccff00]' : 'text-foreground'}`}>
                          {(() => {
                            const lines = currentDay.content.guidedPractice.split('\n')
                            const { groups, preface } = buildGuidedPracticeGroups(lines)
                            const done = (sectionTaskCompleted.guidedPractice || new Set()) as Set<number>

                            const renderLine = (text: string, idx: number) => {
                              const trimmed = (text || '').trim()
                              if (!trimmed || trimmed.startsWith('🌅')) return null
                              if (isTaskLine(trimmed)) {
                                const checked = done.has(idx)
                                return (
                                  <label key={`gp-task-${idx}`} className="flex items-start gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="mt-1"
                                      checked={checked}
                                      onChange={(e) => markTask('guidedPractice', idx, e.target.checked)}
                                      aria-label={`Guided Practice step ${idx + 1}`}
                                    />
                                    <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{renderQuotedText(taskLabel(trimmed))}</span>
                                  </label>
                                )
                              }
                              // Default text line
                              return <div key={`gp-text-${idx}`} className="font-medium text-foreground">{renderQuotedText(trimmed)}</div>
                            }

                            return (
                              <>
                                {/* Preface lines before first subheading */}
                                {preface.map(idx => renderLine(lines[idx], idx))}

                                {/* Groups with subheading checkbox */}
                                {groups.map(group => {
                                  const allChecked = group.taskIndices.length > 0 && group.taskIndices.every(i => done.has(i))
                                  return (
                                    <div key={`gp-group-${group.headerIndex}`} className="space-y-2">
                                      <label className="flex items-start gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="mt-1"
                                          checked={allChecked}
                                          onChange={(e) => toggleGroupTasks('guidedPractice', group.taskIndices, e.target.checked)}
                                          aria-label={`Toggle ${group.headerText.replace(/:\s*$/, '')}`}
                                        />
                                        <span className="font-semibold underline text-foreground">{renderQuotedText(group.headerText.trim())}</span>
                                      </label>
                                      <div className="space-y-2">
                                        {group.lineIndices.map(idx => renderLine(lines[idx], idx))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* Daily Challenge */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('challenge')}
                          aria-controls="section-challenge"
                          className="text-left"
                        >
                          <h5 className="font-semibold neon-glow-orange flex items-center gap-2 text-lg">
                            <Zap className={`h-5 w-5 ${isSectionDone('challenge', currentDay.content.challenge.split('\n')) ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#22c55e]'}`} />
                        Daily Challenge
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.challenge ? '▼' : '▲'}</span>
                      </h5>
                        </button>
                        <label htmlFor="chk-challenge" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-challenge"
                            type="checkbox"
                            checked={isSectionDone('challenge', currentDay.content.challenge.split('\n'))}
                            onChange={() => toggleSectionCompleted('challenge', currentDay.content.challenge.split('\n'))}
                            aria-label="Mark Daily Challenge as completed"
                          />
                          {isSectionDone('challenge', currentDay.content.challenge.split('\n')) && <span className="text-sm text-[#ccff00] drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>}
                        </label>
                      </div>
                      {!sectionCollapsed.challenge && (
                        <div id="section-challenge" className={`whitespace-pre-line leading-relaxed space-y-3 ${isSectionDone('challenge', currentDay.content.challenge.split('\n')) ? 'text-[#ccff00]' : 'text-foreground'}`}>
                          {renderChallengeLines(currentDay.content.challenge.split('\n'))}
                        </div>
                      )}
                  </div>
                  
                    {/* Journaling Prompt */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('journalingPrompt')}
                          aria-controls="section-journalingPrompt"
                          className="text-left"
                        >
                          <h5 className="font-semibold neon-glow-pink flex items-center gap-2 text-lg">
                            <Sparkles className={`h-5 w-5 ${isSectionDone('journalingPrompt') ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#ff1aff]'}`} />
                        Journaling Prompt
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.journalingPrompt ? '▼' : '▲'}</span>
                      </h5>
                        </button>
                        <label htmlFor="chk-journalingPrompt" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-journalingPrompt"
                            type="checkbox"
                            checked={isSectionDone('journalingPrompt')}
                            onChange={() => toggleSectionCompleted('journalingPrompt')}
                            aria-label="Mark Journaling Prompt as completed"
                          />
                          {isSectionDone('journalingPrompt') && <span className="text-sm text-[#ccff00] drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>}
                        </label>
                      </div>
                      {!sectionCollapsed.journalingPrompt && (
                        <div className="space-y-4" id="section-journalingPrompt">
                          <JournalingBlock text={currentDay.content.journalingPrompt} done={isSectionDone('journalingPrompt')} />
                          {/* Compact Journal (placed at bottom of Journaling Prompt) */}
                          <div className="rounded-lg border border-border p-4 bg-card/30">
                            <div className="text-sm font-medium text-muted-foreground mb-2">Quick Journal</div>
                            {!showMiniJournalInsights ? (
                              <>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {moodOptions.map((m) => (
                                    <button
                                      key={m.value}
                                      type="button"
                                      onClick={() => setMiniJournalMood(m.value)}
                                      className={`px-3 py-1 rounded-full border text-sm flex items-center gap-2 ${miniJournalMood===m.value ? 'bg-primary text-black shadow-[0_0_12px_rgba(204,255,0,0.5)]' : 'bg-background text-foreground border-border'}`}
                                    >
                                      <span>{m.emoji}</span>
                                      <span>{m.label}</span>
                                    </button>
                                  ))}
                                </div>
                                <Textarea
                                  id="mini-journal-entry"
                                  name="mini-journal-entry"
                                  value={miniJournalEntry}
                                  onChange={(e) => setMiniJournalEntry(e.target.value)}
                                  placeholder="Write a quick note about how the practice landed..."
                                  className="min-h-[100px] text-sm"
                                />
                                <div className="mt-3">
                                  <Button size="sm" onClick={() => saveMiniJournal(miniJournalEntry, miniJournalMood)} disabled={!miniJournalEntry.trim() || miniJournalSaving}>
                                    {miniJournalSaving ? 'Saving...' : 'Save Entry'}
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-sm font-semibold flex items-center gap-2"><span>AI Insights</span></div>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                  {(miniJournalInsights || []).map((ins, i) => (<li key={i}>{ins}</li>))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                  
                    {/* Reflection */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('reflection')}
                          aria-controls="section-reflection"
                          className="text-left"
                        >
                          <h5 className="font-semibold neon-glow-blue flex items-center gap-2 text-lg">
                            <Moon className={`h-5 w-5 ${isSectionDone('reflection') ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#60a5fa]'}`} />
                        Reflection
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.reflection ? '▼' : '▲'}</span>
                      </h5>
                        </button>
                        <label htmlFor="chk-reflection" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-reflection"
                            type="checkbox"
                            checked={isSectionDone('reflection')}
                            onChange={() => toggleSectionCompleted('reflection')}
                            aria-label="Mark Reflection as completed"
                          />
                          {isSectionDone('reflection') && <span className="text-sm text-[#ccff00] drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>}
                        </label>
                      </div>
                      {!sectionCollapsed.reflection && (
                        <div id="section-reflection" className={`leading-relaxed space-y-6 ${isSectionDone('reflection') ? 'text-[#ccff00]' : 'text-foreground'}`}>
                           {(() => {
                             const themeText = currentDay.theme || deriveTheme(currentDay.content.mainFocus)
                             const qs = buildReflectionQuestions(currentDay.content.mainFocus, themeText, currentDay.metadata.difficulty)
                             if (!reflectionAnswerMode) {
                               const togglePick = (idx: number, checked: boolean) => {
                                 setReflectionSelected(prev => {
                                   const next = new Set(prev)
                                   if (checked) next.add(idx); else next.delete(idx)
                                   return next
                                 })
                               }
                               const picks = reflectionSelected.size
                               return (
                                 <div className="space-y-3">
                                   <div className="italic text-muted-foreground">Which questions would you like to answer? (1 pick required, up to 5 picks)</div>
                                   <div className="space-y-2">
                                     {qs.map((q, idx) => (
                                       <label key={idx} className="flex items-start gap-3 cursor-pointer">
                                         <input
                                           type="checkbox"
                                           checked={reflectionSelected.has(idx)}
                                           onChange={(e) => togglePick(idx, e.target.checked)}
                                           aria-label={`Select reflection question ${idx + 1}`}
                                         />
                                         <span className="font-medium">{q}</span>
                                       </label>
                                     ))}
                                   </div>
                                   <div>
                                     <Button
                                       onClick={() => {
                                         setReflectionAnswerMode(true)
                                         const drafts: Record<number, string> = {}
                                         reflectionSelected.forEach(i => { drafts[i] = '' })
                                         setReflectionDraftAnswers(drafts)
                                       }}
                                       disabled={picks < 1 || picks > 5}
                                       className="mt-2"
                                     >
                                       Answer selected
                                     </Button>
                                   </div>
                                 </div>
                               )
                             } else {
                               // Answer mode: only show selected questions with text boxes
                               const selectedIndices = Array.from(reflectionSelected)
                               const handleChange = (idx: number, val: string) => setReflectionDraftAnswers(prev => ({ ...prev, [idx]: val }))
                               return (
                                 <div className="space-y-4">
                                   {selectedIndices.map(idx => (
                                     <div key={idx} className="space-y-2">
                                       <div className="font-medium">{qs[idx]}</div>
                                       <textarea
                                         className="w-full min-h-[90px] rounded-md bg-background border border-border p-3 text-foreground"
                                         placeholder="Write your answer..."
                                         value={reflectionDraftAnswers[idx] || ''}
                                         onChange={(e) => handleChange(idx, e.target.value)}
                                       />
                                     </div>
                                   ))}
                                   <div className="flex gap-3">
                                     <Button
                                       onClick={async () => {
                                         const qa = selectedIndices.map(i => ({ index: i, question: qs[i], answer: reflectionDraftAnswers[i] || '' }))
                                         setPendingReflectionQA(qa)
                                         // Generate insights from the combined answers and show them in the compact journal area
                                         const combined = selectedIndices.map(i => reflectionDraftAnswers[i] || '').join('\n\n')
                                         await saveMiniJournal(combined, miniJournalMood)
                                         // Mark section as completed
                                         setSectionCompleted(prev => ({ ...prev, reflection: true }))
                                       }}
                                     >
                                       Save answers
                                     </Button>
                                     <Button
                                       variant="secondary"
                                       onClick={() => { setReflectionAnswerMode(false) }}
                                     >
                                       Back to selection
                                     </Button>
                                   </div>
                                 </div>
                               )
                             }
                           })()}
                         </div>
                       )}
                  </div>
                  
                    {/* Weather & Environment */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('weather')}
                          aria-controls="section-weather"
                          className="text-left"
                        >
                          <h5 className="font-semibold neon-glow-teal flex items-center gap-2 text-lg">
                            <Sun className={`h-5 w-5 ${isSectionDone('weather') ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#f59e0b]'}`} />
                        Weather & Environment
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.weather ? '▼' : '▲'}</span>
                      </h5>
                        </button>
                        <label htmlFor="chk-weather" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-weather"
                            type="checkbox"
                            checked={isSectionDone('weather')}
                            onChange={() => toggleSectionCompleted('weather')}
                            aria-label="Mark Weather & Environment as completed"
                          />
                          {isSectionDone('weather') && <span className="text-sm text-[#ccff00] drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>}
                        </label>
                      </div>
                      {!sectionCollapsed.weather && (
                        <div id="section-weather" className={`whitespace-pre-line leading-relaxed space-y-3 ${isSectionDone('weather') ? 'text-[#ccff00]' : 'text-foreground'}`}>
                        {(() => {
                          const lines = currentDay.content.weather.split('\n')
                          let inWarm = false
                          let inCold = false
                          return lines.map((raw, index) => {
                            const line = raw.trim()
                            if (!line) return null
                            if (/^Warm\s*&\s*Sunny:?$/i.test(line)) { inWarm = true; inCold = false; return <div key={index} className="font-semibold underline text-foreground">Warm & Sunny:</div> }
                            if (/^Cold\s*&\s*Raining:?$/i.test(line)) { inWarm = false; inCold = true; return <div key={index} className="font-semibold underline text-foreground">Cold & Raining:</div> }
                            if (line.startsWith('•')) {
                              const checked = (sectionTaskCompleted.weather || new Set()).has(index)
                              return (
                                <label key={index} className="flex items-start gap-2 cursor-pointer">
                                  <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('weather', index, e.target.checked)} aria-label={`Weather activity ${index + 1}`} />
                                  <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{renderQuotedText(line.substring(1).trim())}</span>
                                </label>
                              )
                            }
                            // Ignore any old header tokens
                            if (line.startsWith('🌤️')) return null
                            // Render any plain text lines as context
                            return <div key={index} className="font-medium text-foreground">{renderQuotedText(line)}</div>
                          })
                        })()}
                       </div>
                      )}
                  </div>
                  
                    {/* Sleep & Wellness */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('sleep')}
                          aria-controls="section-sleep"
                          className="text-left"
                        >
                          <h5 className="font-semibold neon-glow-rose flex items-center gap-2 text-lg">
                            <Moon className={`h-5 w-5 ${isSleepSectionDone() ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#fb7185]'}`} />
                        Sleep & Wellness
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.sleep ? '▼' : '▲'}</span>
                      </h5>
                        </button>
                        <label htmlFor="chk-sleep" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-sleep"
                            type="checkbox"
                            checked={isSleepSectionDone()}
                            onChange={toggleSleepSectionCompleted}
                            aria-label="Mark Sleep & Wellness as completed"
                          />
                          {isSleepSectionDone() && <span className="text-sm text-[#ccff00] drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>}
                        </label>
                      </div>
                      {!sectionCollapsed.sleep && (
                        <div id="section-sleep" className={`whitespace-pre-line leading-relaxed space-y-3 ${isSleepSectionDone() ? 'text-[#ccff00]' : 'text-foreground'}`}>
                        {filterSleepLines(currentDay.content.sleep.split('\n')).map((line, index) => {
                             if (isSubheadingLine(line)) {
                               return <div key={index} className="font-semibold text-foreground">{line.trim()}</div>
                             } else if (isTaskLine(line)) {
                               const checked = (sectionTaskCompleted.sleep || new Set()).has(index)
                               return (
                                 <label key={index} className="flex items-start gap-2 cursor-pointer">
                                   <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('sleep', index, e.target.checked)} aria-label={`Sleep & Wellness step ${index + 1}`} />
                                   <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{renderQuotedText(taskLabel(line))}</span>
                                 </label>
                               )
                           } else if (line.trim() && !line.trim().startsWith('😴')) {
                               return <div key={index} className="font-medium text-foreground">{renderQuotedText(line.trim())}</div>
                           }
                           return null
                         })}
                        {/* Required bedtime additions */}
                        <div className="space-y-2">
                          <div className="font-semibold">Intentional positive dream exercise</div>
                          {(() => {
                            const idx = 10001
                            const checked = (sectionTaskCompleted.sleep || new Set()).has(idx)
                            return (
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('sleep', idx, e.target.checked)} aria-label="Intentional positive dream exercise" />
                                <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>Rehearse a short, kind scene you'd love to dream about</span>
                              </label>
                            )
                          })()}
                        </div>

                        <div className="space-y-2">
                          <div className="font-semibold">One self‑love indulgence</div>
                          {(() => {
                            const idx = 10002
                            const checked = (sectionTaskCompleted.sleep || new Set()).has(idx)
                            return (
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('sleep', idx, e.target.checked)} aria-label="Self-love indulgence" />
                                <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>Choose one gentle indulgence (tea, warm shower, music, lotion)</span>
                              </label>
                            )
                          })()}
                        </div>

                        <div className="space-y-2">
                          <div className="font-semibold">Pre‑bed routine checks</div>
                          {(() => {
                            const base = 10010
                            const checks = [
                              'Screens off, lights dim, bedroom cool',
                              'Note one intention for tomorrow (one line)',
                              'Two-minute slow breathing to soften body'
                            ]
                            return (
                              <div className="space-y-2">
                                {checks.map((label, i) => {
                                  const idx = base + i
                                  const checked = (sectionTaskCompleted.sleep || new Set()).has(idx)
                                  return (
                                    <label key={idx} className="flex items-start gap-2 cursor-pointer">
                                      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('sleep', idx, e.target.checked)} aria-label={`Pre-bed check ${i + 1}`} />
                                      <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{label}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                      )}
                  </div>
                  
                    {/* Holistic Healing Bonus */}
                    <div className="rounded-xl p-6 bg-background">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection('holistic')}
                          aria-controls="section-holistic"
                          className="text-left"
                        >
                          <h5 className="font-semibold neon-glow-purple flex items-center gap-2 text-lg">
                            <Leaf className={`h-5 w-5 ${isHolisticSectionDone() ? 'text-[#ccff00] drop-shadow-[0_0_8px_#ccff00]' : 'text-black dark:text-white drop-shadow-[0_0_8px_#10b981]'}`} />
                        Holistic Healing Bonus
                            <span className="ml-2 text-muted-foreground">{sectionCollapsed.holistic ? '▼' : '▲'}</span>
                      </h5>
                        </button>
                        <label htmlFor="chk-holistic" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="chk-holistic"
                            type="checkbox"
                            checked={isHolisticSectionDone()}
                            onChange={toggleHolisticSectionCompleted}
                            aria-label="Mark Holistic Healing Bonus as completed"
                          />
                          {isHolisticSectionDone() && <span className="text-sm text-[#ccff00] drop-shadow-[0_0_10px_#ccff00]">(Completed)</span>}
                        </label>
                      </div>
                      {!sectionCollapsed.holistic && (
                        <div id="section-holistic" className={`whitespace-pre-line leading-relaxed space-y-3 ${isHolisticSectionDone() ? 'text-[#ccff00]' : 'text-foreground'}`}>
                         {currentDay.content.holistic.split('\n').map((line, index) => {
                            const trimmed = line.trim()
                            if (isSubheadingLine(trimmed)) {
                              // Remove the "Optional Practice:" heading entirely
                              if (/^optional\s+practice:?$/i.test(trimmed)) return null
                              return <div key={index} className="font-semibold underline text-foreground">{trimmed}</div>
                            } else if (isTaskLine(trimmed)) {
                              const checked = (sectionTaskCompleted.holistic || new Set()).has(index)
                              return (
                                <label key={index} className="flex items-start gap-2 cursor-pointer">
                                  <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('holistic', index, e.target.checked)} aria-label={`Holistic practice ${index + 1}`} />
                                  <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{renderQuotedText(taskLabel(trimmed))}</span>
                                </label>
                              )
                            } else if (trimmed && !trimmed.startsWith('🌿')) {
                              return <div key={index} className="font-medium text-foreground">{renderQuotedText(trimmed)}</div>
                            }
                           return null
                         })}
                       </div>
                       )}
                     </div>
 
                     {/* Complete Day Button */}
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Badge variant="glass" className="bg-primary/10 text-primary border-primary/20">
                          {currentDay.theme || deriveTheme(currentDay.content.mainFocus)}
                        </Badge>
                        <Badge className={getDifficultyColor(currentDay.metadata.difficulty)}>
                          {currentDay.metadata.difficulty}
                        </Badge>
                        {isStructuredDay && (
                          <Badge variant="outline" className="border-[#ccff00] text-foreground">
                            structured
                          </Badge>
                        )}
                  </div>
                  
                  <Button 
                    size="lg" 
                    onClick={completeDay}
                        disabled={completingDay || completedDays.has(currentDay.day)}
                        className={`w-full h-14 text-lg group hover:scale-105 transition-transform duration-200 ${
                          completedDays.has(currentDay.day)
                            ? 'bg-success hover:bg-success/90 text-success-foreground'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                      >
                        {completingDay ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Completing...
                          </>
                        ) : completedDays.has(currentDay.day) ? (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Day {currentDay.day} Completed
                          </>
                        ) : (
                          <>
                            <Trophy className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Complete Day {currentDay.day}
                          </>
                        )}
                  </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Today's Focus Card */}
              <Card className="modern-card border-0">
                <CardHeader className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-black dark:text-white drop-shadow-[0_0_8px_#00e5ff]" />
                    <h4 className="text-lg font-semibold text-foreground">Today&apos;s Focus</h4>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Theme</p>
                      <p className={`font-bold text-foreground ${pickGlowClass(currentDay.theme || currentDay.content.mainFocus)}`}>{currentDay.theme || deriveTheme(currentDay.content.mainFocus)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Duration</p>
                      <p className="font-medium text-foreground">{estimatedTotalMinutes} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                      <p className="font-medium text-foreground">{currentDay.metadata.difficulty}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Summary Card */}
              <Card className="modern-card border-0">
                <CardHeader className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-black dark:text-white drop-shadow-[0_0_8px_#ccff00]" />
                    <h4 className="text-lg font-semibold text-foreground">Your Journey</h4>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Days Completed</span>
                      <span className={`text-base font-bold text-foreground ${pickGlowClass('completed-' + progress.completed)}`}>{progress.completed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Streak</span>
                      <span className={`text-base font-bold text-foreground ${pickGlowClass('streak-' + progress.streak)}`}>{progress.streak}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                      <span className={`text-base font-bold text-foreground ${pickGlowClass('rate-' + progress.percentage)}`}>{Math.round(progress.percentage)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Program Complete */}
        {progress.completed === 30 && (
          <div className="mb-12">
            <Card className="modern-card border-0">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-black dark:text-white drop-shadow-[0_0_10px_#22c55e]" />
                  </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Congratulations!</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  You&apos;ve completed all 30 days of your healing journey. 
                    This is just the beginning of your transformation.
                  </p>
                <Button asChild size="lg" className="text-lg px-8 py-3 group hover:scale-105 transition-transform duration-200 neon-cta">
                  <a href="/dashboard">Continue Your Journey</a>
                  </Button>
              </CardContent>
              </Card>
          </div>
        )}
      </div>
    </div>
  )
}
