'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Sparkles, Target, Loader2, ArrowRight, Heart, Brain, Zap, Sun, Moon, Leaf, TrendingUp, Lock, Calendar, Trophy } from 'lucide-react'
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
      const response = await fetch('/api/payments/user-purchases')
      
      if (response.ok) {
        const data = await response.json()
        const hasProgramAccess = data.some((purchase: { product: string }) => purchase.product === 'program')
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
        setProgress(progressData.progress)
        
        // Load current day content
        if (progressData.progress.currentDay <= 30) {
          const dayResponse = await fetch(`/api/program/daily?day=${progressData.progress.currentDay}`)
          if (dayResponse.ok) {
            const dayData = await dayResponse.json()
            const parsedContent = parseDailyContent(dayData.content, weatherData)
            
            setCurrentDay({
              day: progressData.progress.currentDay,
              title: `Day ${progressData.progress.currentDay}`,
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
              }
            })
          } else {
            setError('Failed to generate daily content')
          }
        } else {
          setError('Failed to load daily content')
        }
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
      } else if (line.includes('🌤️ WEATHER & ENVIRONMENT') || line.includes('## 🌤️ Weather & Environment')) {
        currentSection = 'weather'
      } else if (line.includes('😴 SLEEP & WELLNESS') || line.includes('## 😴 Sleep & Wellness')) {
        currentSection = 'sleep'
      } else if (line.includes('🌿 HOLISTIC HEALING BONUS') || line.includes('## 🌿 Holistic Healing Bonus')) {
        currentSection = 'holistic'
      } else if (line.includes('🛠️ TOOLS & RESOURCES') || line.includes('## 🛠️ Tools & Resources')) {
        currentSection = 'tools'
      } else if (currentSection && line.trim()) {
        if (currentSection in sections) {
          sections[currentSection as keyof typeof sections] += line + '\n'
        }
      }
    }

    // If sections are empty, try to extract content from the raw text
    if (!sections.guidedPractice && !sections.challenge && !sections.journalingPrompt) {
      // Fallback: try to parse content by looking for common patterns
      const contentLower = content.toLowerCase()
      
      if (contentLower.includes('guided practice') || contentLower.includes('morning intention')) {
        sections.guidedPractice = content
      } else if (contentLower.includes('daily challenge') || contentLower.includes('main activity')) {
        sections.challenge = content
      } else if (contentLower.includes('journaling') || contentLower.includes('reflection')) {
        sections.journalingPrompt = content
      } else {
        // If no clear sections found, distribute content evenly
        const parts = content.split('\n\n').filter(part => part.trim())
        if (parts.length >= 4) {
          sections.guidedPractice = parts[0] || 'Content not available'
          sections.challenge = parts[1] || 'Content not available'
          sections.journalingPrompt = parts[2] || 'Content not available'
          sections.reflection = parts[3] || 'Content not available'
        } else {
          // Last resort: put all content in guided practice
          sections.guidedPractice = content || 'Content not available'
        }
      }
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
    sections.weather = sections.weather || 'Weather data not available'
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
        body: JSON.stringify({ day: progress.currentDay }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete day')
      }

      const result = await response.json()
      setProgress(result.progress)
      
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
      
      // Generate next day content
      const response = await fetch('/api/program/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          day: progress.currentDay + 1,
          weatherData: weatherData
        })
      })

      if (response.ok) {
        const dayData = await response.json()
        const parsedContent = parseDailyContent(dayData.content, weatherData)
        
        setCurrentDay({
          day: progress.currentDay + 1,
          title: `Day ${progress.currentDay + 1}`,
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
          }
        })

        // Update progress
        setProgress(prev => prev ? {
          ...prev,
          currentDay: prev.currentDay + 1,
          completed: prev.completed + 1,
          percentage: ((prev.completed + 1) / prev.total) * 100
        } : null)
      } else {
        throw new Error('Failed to generate next day content')
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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking program access...</p>
        </div>
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
                <h1 className="responsive-heading text-foreground">30-Day Healing Program</h1>
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
                  setHasAccess(true)
                  checkProgramAccess()
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
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner size="lg" text="Loading your healing program..." />
        </div>
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
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading program data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10"></div>
        <div className="relative max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {/* Floating Elements */}
            <div className="relative mb-8">
              <div className="absolute -top-4 -left-4 p-3 rounded-full bg-primary/10 animate-float">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -top-2 -right-4 p-3 rounded-full bg-accent/10 animate-float-delayed">
                <Brain className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="absolute -bottom-4 left-1/4 p-3 rounded-full bg-primary/10 animate-float-slow">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -bottom-2 right-1/4 p-3 rounded-full bg-accent/10 animate-float-delayed-slow">
                <Zap className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>

            <h1 className="responsive-heading text-foreground mb-6">
              30-Day Healing Program
            </h1>
            <p className="responsive-body text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your personalized journey to healing and transformation. Each day brings new insights, 
              practices, and opportunities for growth.
            </p>
          </div>

          {/* Progress Overview */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="glass-card border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 border-b border-primary/20 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Your Progress</h2>
                      <p className="text-sm text-muted-foreground">Day {progress.currentDay} of 30</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{progress.completed}</div>
                    <div className="text-sm text-muted-foreground">Days Completed</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">Progress</span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress.percentage)}%</span>
                    </div>
                    <Progress value={progress.percentage} variant="gradient" className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-accent/5 rounded-xl border border-accent/20">
                      <div className="text-2xl font-bold text-accent-foreground">{progress.currentDay}</div>
                      <div className="text-sm text-muted-foreground">Current Day</div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="text-2xl font-bold text-primary">{progress.streak}</div>
                      <div className="text-sm text-muted-foreground">Day Streak</div>
                    </div>
                    <div className="text-center p-4 bg-success/5 rounded-xl border border-success/20">
                      <div className="text-2xl font-bold text-success">{30 - progress.currentDay}</div>
                      <div className="text-sm text-muted-foreground">Days Remaining</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Location Permission Request */}
        {locationPermission === 'pending' && (
          <div className="mb-8">
            <Card className="glass-card border-0 shadow-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Enable Location for Weather Insights</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Allow location access to get personalized weather-based activity recommendations 
                    and environmental adaptations for your healing journey.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={requestLocationPermission}
                      className="group hover:scale-105 transition-transform duration-200"
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
            <Button 
              onClick={startNextDay}
              className="w-full h-16 text-lg group hover:scale-105 transition-transform duration-200"
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
              <Card className="glass-card border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 border-b border-primary/20 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-foreground">Day {currentDay.day}: {currentDay.title}</h3>
                    <Badge variant="success" className="text-sm">
                      {currentDay.metadata.duration} min
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Main Focus */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-foreground">Today&apos;s Main Focus</h4>
                      </div>
                      <p className="text-foreground">{currentDay.content.mainFocus || 'Daily Healing Practice'}</p>
                    </div>

                    {/* Guided Practice */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <h5 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg border-b-2 border-blue-200 pb-2">
                        <Sun className="h-5 w-5 text-blue-600" />
                        Guided Practice
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.guidedPractice.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('🌅')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                    </div>
                    
                    {/* Daily Challenge */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <h5 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg border-b-2 border-green-200 pb-2">
                        <Zap className="h-5 w-5 text-green-600" />
                        Daily Challenge
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.challenge.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-green-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('⚡')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                    </div>
                    
                    {/* Journaling Prompt */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <h5 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg border-b-2 border-purple-200 pb-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Journaling Prompt
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.journalingPrompt.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-purple-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('📝')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                    </div>
                    
                    {/* Reflection */}
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                      <h5 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg border-b-2 border-indigo-200 pb-2">
                        <Moon className="h-5 w-5 text-indigo-600" />
                        Reflection
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.reflection.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-indigo-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('🌙')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                    </div>
                    
                    {/* Weather & Environment */}
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                      <h5 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg border-b-2 border-yellow-200 pb-2">
                        <Sun className="h-5 w-5 text-yellow-600" />
                        Weather & Environment
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.weather.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-yellow-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('🌤️')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                    </div>
                    
                    {/* Sleep & Wellness */}
                    <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
                      <h5 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg border-b-2 border-pink-200 pb-2">
                        <Moon className="h-5 w-5 text-pink-600" />
                        Sleep & Wellness
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.sleep.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-pink-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                          } else if (line.trim() && !line.trim().startsWith('😴')) {
                            return <div key={index} className="font-medium text-foreground">{line.trim()}</div>
                          }
                          return null
                        })}
                      </div>
                    </div>
                    
                    {/* Holistic Healing Bonus */}
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 border-l-4 border-emerald-400">
                      <h5 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg border-b-2 border-emerald-200 pb-2">
                        <Leaf className="h-5 w-5 text-emerald-600" />
                        Holistic Healing Bonus
                      </h5>
                      <div className="whitespace-pre-line text-foreground leading-relaxed space-y-3">
                        {currentDay.content.holistic.split('\n').map((line, index) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={index} className="flex items-start gap-2"><span className="text-emerald-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
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
                          {currentDay.content.mainFocus || 'Main Focus'}
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
              <Card className="glass-card border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/20 border-b border-accent/20 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-accent-foreground" />
                    <h4 className="text-lg font-semibold text-foreground">Today&apos;s Focus</h4>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Main Focus</p>
                      <p className="font-medium text-foreground">{currentDay.content.mainFocus || 'Daily Healing'}</p>
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
              <Card className="feature-card border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 border-b border-primary/20 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">Your Journey</h4>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Days Completed</span>
                      <Badge variant="success" className="text-xs">
                        {progress.completed}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Streak</span>
                      <Badge variant="info" className="text-xs">
                        {progress.streak}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                      <Badge variant="gradient" className="text-xs">
                        {Math.round(progress.percentage)}%
                      </Badge>
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
            <Card className="glass-card border-0 shadow-2xl border-l-4 border-l-success overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="p-4 rounded-full bg-success/20 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-success" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Congratulations!</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  You&apos;ve completed all 30 days of your healing journey. 
                  This is just the beginning of your transformation.
                </p>
                <Button asChild size="lg" className="text-lg px-8 py-3 group hover:scale-105 transition-transform duration-200">
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
