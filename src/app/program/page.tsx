'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Sparkles, Target, Loader2, ArrowRight, Heart, Brain, Zap, Sun, Moon, Leaf, TrendingUp, Lock, Calendar, Trophy } from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '../../components/LoadingSpinner'
import PaymentForm from '@/components/PaymentForm'

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

  useEffect(() => {
    // Reset per-day UI state when day changes
    setSectionCollapsed({ guidedPractice: true, challenge: true, journalingPrompt: true, reflection: true, weather: true, sleep: true, holistic: true })
    setSectionTaskCompleted({ guidedPractice: new Set(), challenge: new Set(), journalingPrompt: new Set(), reflection: new Set(), weather: new Set(), sleep: new Set(), holistic: new Set() })
  }, [currentDay?.day])

  const toggleSection = (key: string) => setSectionCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  const isTaskLine = (line: string) => line.trim().startsWith('•') || /^\d+\./.test(line.trim())
  const taskLabel = (line: string) => line.trim().startsWith('•') ? line.substring(1).trim() : line.replace(/^\d+\.\s*/, '').trim()
  const markTask = (sectionKey: string, idx: number, checked: boolean) => {
    setSectionTaskCompleted(prev => {
      const copy = new Map(prev[sectionKey] ?? new Set())
      const set = new Set(copy as unknown as Set<number>)
      if (checked) set.add(idx); else set.delete(idx)
      return { ...prev, [sectionKey]: set }
    })
  }
  const allTasksCompleted = (sectionKey: string, lines: string[]) => {
    const indices = lines.map((l, i) => isTaskLine(l) ? i : -1).filter(i => i >= 0)
    if (indices.length === 0) return false
    const done = sectionTaskCompleted[sectionKey] || new Set()
    return indices.every(i => done.has(i))
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

  useEffect(() => {
    checkProgramAccess()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const requestLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setLocationPermission('denied')
        return
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      
      // Get weather data
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude })
      })

      if (response.ok) {
        const data = await response.json()
        setWeatherData(data)
        setLocationPermission('granted')
        // After getting weather data, reload program data to generate content
        loadProgramData()
      } else {
        setLocationPermission('denied')
      }
    } catch (error) {
      console.error('Error getting location or weather:', error)
      setLocationPermission('denied')
    }
  }

  const checkProgramAccess = async () => {
    try {
      setCheckingAccess(true)
      // Check payment status FIRST (no bypass via existing progress)
      const response = await fetch('/api/payments/user-purchases')
      
      if (response.ok) {
        const data = await response.json()
        const hasProgramAccess = data.some((purchase: { product: string; active: boolean }) => 
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
                difficulty: 'moderate',
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
    
    for (const line of lines) {
      // Check for both new and old format headers
      if (line.includes('🎯 MAIN FOCUS:') || line.includes('## 🎯 Main Focus:')) {
        currentSection = 'mainFocus'
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
          sections[currentSection as keyof typeof sections] += line + '\n'
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

    // Enhance weather section with actual weather data if available
    if (weatherData && sections.weather) {
      const weatherInsight = weatherData.insight
      sections.weather = `Current Weather: ${weatherInsight.weatherSummary}\n\nActivity Recommendations:\n${weatherInsight.activityRecommendations}\n\nEnvironmental Adaptations:\n${weatherInsight.environmentalAdaptations}\n\nSeasonal Practices:\n${weatherInsight.seasonalPractices}`
    }

    // Ensure all sections have content
    sections.mainFocus = sections.mainFocus || 'Daily Healing Practice'
    sections.guidedPractice = sections.guidedPractice || 'Content not available'
    sections.challenge = sections.challenge || 'Content not available'
    sections.journalingPrompt = sections.journalingPrompt || 'Content not available'
    sections.reflection = sections.reflection || 'Content not available'
    sections.weather = sections.weather || 'Assume location: Melbourne, Australia. Weather: Variable cool. Activities: Gentle walk if weather permits; otherwise indoor stretching and breathwork.'
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
      const nextDay = progress.currentDay + 1
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
          difficulty: nextDayDifficulty
        })
      })

      if (response.ok) {
        const dayData = await response.json()
        const parsedContent = parseDailyContent(dayData.content, weatherData)
        const theme = dayData.theme || deriveTheme(parsedContent.mainFocus)
        const poeticTitle = dayData.poeticTitle || derivePoeticTitle(parsedContent.mainFocus, theme)
        console.log('Successfully generated day', nextDay, 'content')
        
        setCurrentDay({
          day: nextDay,
          title: `Day ${nextDay}`,
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
            difficulty: nextDayDifficulty,
            traumaFocus: []
          },
          theme,
          poeticTitle
        })

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

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking program access..." />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Heart className="h-10 w-10 text-primary" />
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
                <div className="p-4 rounded-full bg-primary/20 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
                  <Lock className="h-10 w-10 text-primary" />
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your healing program..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading program data..." />
      </div>
    )
  }

  const overallPercent = Number(((progress.completed / progress.total) * 100).toFixed(2))

  return (
    <div className="min-h-screen bg-background">
      {/* Header (aligned with Dashboard) */}
      <div className="bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="w-14 h-14 flex items-center justify-center animate-float">
              <Image src="/Icon-02.png" alt="program emblem" width={40} height={40} className="w-10 h-auto drop-shadow-[0_0_12px_#00e5ff]" />
              </div>
            <h1 className="text-3xl font-bold neon-heading">30-Day Healing Program</h1>
            <p className="text-muted-foreground">Day {progress.currentDay} of 30</p>
              </div>
          {/* Centered progress overview */}
          <Card className="feature-card border-0 group max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4 md:flex-1">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
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
                    <div className="text-xl font-semibold text-foreground">Day {progress.currentDay}</div>
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
        {/* Location Permission Request */}
        {locationPermission === 'pending' && (
          <div className="mb-8">
            <Card className="modern-card border-0">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
                </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Enable Location for Weather Insights</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Allow location access to get personalized weather-based activity recommendations 
                    and environmental adaptations for your healing journey.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={requestLocationPermission}
                      className="group hover:scale-105 transition-transform duration-200 neon-cta"
                    >
                      <Sun className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Enable Location Access
                    </Button>
                    <Button 
                      onClick={() => setLocationPermission('denied')}
                      variant="outline"
                    >
                      Skip for Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Location Status */}
        {locationPermission === 'granted' && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-success/20 rounded-full px-4 py-2 border border-success/30">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Location enabled - Weather insights available</span>
            </div>
          </div>
        )}

        {/* Start Next Day Button */}
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
                  Start Next Day
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
                      {currentDay.metadata.duration} min
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Main Focus */}
                    <div className="rounded-xl p-4 bg-background">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
                        <h4 className="font-semibold neon-heading">Today&apos;s Main Focus</h4>
                      </div>
                      <p className="text-foreground">{currentDay.content.mainFocus || 'Daily Healing Practice'}</p>
                    </div>

                    {/* Guided Practice */}
                    <div className="rounded-xl p-6 bg-background">
                      <button onClick={() => toggleSection('guidedPractice')} className="w-full text-left">
                        <h5 className="font-semibold neon-glow-cyan mb-2 flex items-center justify-between gap-2 text-lg">
                          <span className="flex items-center gap-2">
                            <Sun className={`h-5 w-5 ${allTasksCompleted('guidedPractice', currentDay.content.guidedPractice.split('\n')) ? 'text-[#ccff00]' : 'text-black dark:text-white'}`} style={{ filter: allTasksCompleted('guidedPractice', currentDay.content.guidedPractice.split('\n')) ? 'drop-shadow(0 0 8px #ccff00)' : 'drop-shadow(0 0 8px #00e5ff)' }} />
                            Guided Practice {allTasksCompleted('guidedPractice', currentDay.content.guidedPractice.split('\n')) && <span className="text-sm text-[#ccff00]">(Completed)</span>}
                          </span>
                          <span className="text-muted-foreground">{sectionCollapsed.guidedPractice ? '▼' : '▲'}</span>
                        </h5>
                      </button>
                      {!sectionCollapsed.guidedPractice && (
                        <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                          {currentDay.content.guidedPractice.split('\n').map((line, index) => {
                            if (isTaskLine(line)) {
                              const checked = (sectionTaskCompleted.guidedPractice || new Set()).has(index)
                              return (
                                <label key={index} className="flex items-start gap-2 cursor-pointer">
                                  <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('guidedPractice', index, e.target.checked)} />
                                  <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{taskLabel(line)}</span>
                                </label>
                              )
                            } else if (line.trim() && !line.trim().startsWith('🌅')) {
                              return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Daily Challenge */}
                    <div className="rounded-xl p-6 bg-background">
                      <button onClick={() => toggleSection('challenge')} className="w-full text-left">
                        <h5 className="font-semibold neon-glow-orange mb-2 flex items-center justify-between gap-2 text-lg">
                          <span className="flex items-center gap-2">
                            <Zap className={`h-5 w-5 ${allTasksCompleted('challenge', currentDay.content.challenge.split('\\n')) ? 'text-[#ccff00]' : 'text-black dark:text-white'}`} style={{ filter: allTasksCompleted('challenge', currentDay.content.challenge.split('\\n')) ? 'drop-shadow(0 0 8px #ccff00)' : 'drop-shadow(0 0 8px #22c55e)' }} />
                            Daily Challenge {allTasksCompleted('challenge', currentDay.content.challenge.split('\\n')) && <span className="text-sm text-[#ccff00]">(Completed)</span>}
                          </span>
                          <span className="text-muted-foreground">{sectionCollapsed.challenge ? '▼' : '▲'}</span>
                        </h5>
                      </button>
                      {!sectionCollapsed.challenge && (
                        <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                          {currentDay.content.challenge.split('\n').map((line, index) => {
                            if (isTaskLine(line)) {
                              const checked = (sectionTaskCompleted.challenge || new Set()).has(index)
                              return (
                                <label key={index} className="flex items-start gap-2 cursor-pointer">
                                  <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => markTask('challenge', index, e.target.checked)} />
                                  <span className={checked ? 'font-medium text-[#ccff00]' : 'text-foreground'}>{taskLabel(line)}</span>
                                </label>
                              )
                            } else if (line.trim() && !line.trim().startsWith('⚡')) {
                              return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      )}
                    </div>
                  
                    {/* Journaling Prompt */}
                    <div className="rounded-xl p-6 bg-background">
                      <h5 className="font-semibold neon-glow-pink mb-2 flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ff1aff)' }} />
                        Journaling Prompt
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.journalingPrompt.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-foreground mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('📝')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                  </div>
                  
                    {/* Reflection */}
                    <div className="rounded-xl p-6 bg-background">
                      <h5 className="font-semibold neon-glow-blue mb-2 flex items-center gap-2 text-lg">
                        <Moon className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #60a5fa)' }} />
                        Reflection
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.reflection.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-foreground mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('🌙')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                  </div>
                  
                    {/* Weather & Environment */}
                    <div className="rounded-xl p-6 bg-background">
                      <h5 className="font-semibold neon-glow-teal mb-2 flex items-center gap-2 text-lg">
                        <Sun className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #f59e0b)' }} />
                        Weather & Environment
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.weather.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-foreground mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('🌤️')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                  </div>
                  
                    {/* Sleep & Wellness */}
                    <div className="rounded-xl p-6 bg-background">
                      <h5 className="font-semibold neon-glow-rose mb-2 flex items-center gap-2 text-lg">
                        <Moon className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #fb7185)' }} />
                        Sleep & Wellness
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.sleep.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-foreground mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('😴')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                  </div>
                  
                    {/* Holistic Healing Bonus */}
                    <div className="rounded-xl p-6 bg-background">
                      <h5 className="font-semibold neon-glow-purple mb-2 flex items-center gap-2 text-lg">
                        <Leaf className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} />
                        Holistic Healing Bonus
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.holistic.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-foreground mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('🌿')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
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
                    <Target className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
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
                      <p className="font-medium text-foreground">{currentDay.metadata.duration} minutes</p>
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
                    <TrendingUp className="h-5 w-5 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
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
                  <Trophy className="h-12 w-12 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 10px #22c55e)' }} />
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
