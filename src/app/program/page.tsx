'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Sparkles, Target, Clock, Calendar, Trophy, Loader2, ArrowRight } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import SkeletonGrid from '../../components/SkeletonGrid'
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
  const [weatherData, setWeatherData] = useState<any>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())
  const [completingDay, setCompletingDay] = useState(false)
  const [showNextDayButton, setShowNextDayButton] = useState(false)

  useEffect(() => {
    checkProgramAccess()
  }, [])

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
      const response = await fetch('/api/payments/user-purchases')
      if (response.ok) {
        const purchases = await response.json()
        const hasProgramAccess = Array.isArray(purchases) && purchases.some((p: any) => p.product === 'program' && p.active === true)
        setHasAccess(hasProgramAccess)
        
        if (hasProgramAccess) {
          loadProgramData()
        }
      }
    } catch (error) {
      console.error('Error checking program access:', error)
      setError('Failed to check program access')
    } finally {
      setCheckingAccess(false)
    }
  }

  const loadProgramData = async () => {
    try {
      setLoading(true)
      
      // Load progress
      const progressResponse = await fetch('/api/program/progress')
      if (!progressResponse.ok) {
        throw new Error('Failed to load progress')
      }
      const progressData = await progressResponse.json()
      setProgress(progressData)

      // Load personalized program and daily content
      if (progressData.currentDay <= 30) {
        // First, try to load the daily content for the current day
        const dailyResponse = await fetch(`/api/program/daily?day=${progressData.currentDay}`)
        
        if (dailyResponse.ok) {
          const dailyData = await dailyResponse.json()
          console.log('Loading existing daily content:', dailyData.content)
          const parsedContent = parseDailyContent(dailyData.content, weatherData)
          console.log('Parsed existing content:', parsedContent)
          setCurrentDay({
            day: progressData.currentDay,
            title: `Day ${progressData.currentDay}`,
            focus: 'Daily Healing Practice',
            content: {
              introduction: dailyData.content,
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
        } else if (dailyResponse.status === 404) {
          // If no daily content exists, check if we have location permission first
          if (locationPermission === 'pending') {
            // Don't generate content yet, wait for location permission
            setLoading(false)
            return
          }
          
          // If no daily content exists, generate it
          const generateDailyResponse = await fetch('/api/program/daily', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              dayNumber: progressData.currentDay,
              weatherData: weatherData 
            })
          })
          
          if (generateDailyResponse.ok) {
            const generatedDailyData = await generateDailyResponse.json()
            const parsedContent = parseDailyContent(generatedDailyData.content, weatherData)
            setCurrentDay({
              day: progressData.currentDay,
              title: `Day ${progressData.currentDay}`,
              focus: 'Daily Healing Practice',
              content: {
                introduction: generatedDailyData.content,
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

  const parseDailyContent = (content: string, weatherData?: any) => {
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
    let cleanedContent = content
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
          const pdfData = await pdfResponse.json()
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
      
      // Load next day's content
      if (progress.currentDay <= 30) {
        const nextDayResponse = await fetch(`/api/program/daily?day=${progress.currentDay}`)
        
        if (nextDayResponse.ok) {
          const nextDayData = await nextDayResponse.json()
          console.log('Raw content received:', nextDayData.content)
          const parsedContent = parseDailyContent(nextDayData.content, weatherData)
          console.log('Parsed content:', parsedContent)
          setCurrentDay({
            day: progress.currentDay,
            title: `Day ${progress.currentDay}`,
            focus: 'Daily Healing Practice',
            content: {
              introduction: nextDayData.content,
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
        } else if (nextDayResponse.status === 404) {
          // Generate new day content
          const generateDailyResponse = await fetch('/api/program/daily', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              dayNumber: progress.currentDay,
              weatherData: weatherData 
            })
          })
          
          if (generateDailyResponse.ok) {
            const generatedDailyData = await generateDailyResponse.json()
            const parsedContent = parseDailyContent(generatedDailyData.content, weatherData)
            setCurrentDay({
              day: progress.currentDay,
              title: `Day ${progress.currentDay}`,
              focus: 'Daily Healing Practice',
              content: {
                introduction: generatedDailyData.content,
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
            setError('Failed to generate next day content')
          }
        }
      }
    } catch (error) {
      setError('Failed to load next day')
      console.error('Error loading next day:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'challenging': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'awareness': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'integration': return 'bg-orange-100 text-orange-800'
      case 'action': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (checkingAccess) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <LoadingSpinner 
                  size="lg" 
                  text="Checking program access..." 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-yellow-800 mb-4">30-Day Healing Program</h3>
                  <p className="text-yellow-700 mb-6">
                    Access your personalized 30-day healing journey with daily tasks, journaling, and AI guidance.
                  </p>
                </div>
                <PaymentForm
                  productType="program"
                  amount={2995} // $29.95 in cents
                  onSuccess={() => {
                    setHasAccess(true)
                    loadProgramData()
                  }}
                  onCancel={() => router.push('/diagnostic/results')}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <LoadingSpinner 
                  size="lg" 
                  text="Loading your program..." 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  // Show location permission request if we need weather data for content generation
  if (locationPermission === 'pending' && progress && !currentDay) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Personalize Your Experience</h3>
                  <p className="text-gray-600 mb-6">
                    To provide you with the most personalized daily content, we'd like to access your location for weather-based recommendations and activities.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700">
                      <strong>What we'll do:</strong> Get your local weather to suggest outdoor activities, sleep recommendations based on conditions, and holistic practices that complement your environment.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={requestLocationPermission}
                    className="w-full h-12 text-lg"
                  >
                    <Target className="h-5 w-5 mr-2" />
                    Allow Location Access
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setLocationPermission('denied')
                      loadProgramData()
                    }}
                    className="w-full h-12 text-lg"
                  >
                    Skip Location Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-800">Error</h3>
                  </div>
                  <p className="text-red-700 mb-6">{error}</p>
                  <Button variant="outline" onClick={loadProgramData}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  if (!progress) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-yellow-800 mb-4">30-Day Healing Program</h3>
                  <p className="text-yellow-700 mb-6">
                    Access your personalized 30-day healing journey with daily tasks, journaling, and AI guidance.
                  </p>
                </div>
                <PaymentForm
                  productType="program"
                  amount={2995} // $29.95 in cents
                  onSuccess={() => {
                    setHasAccess(true)
                    loadProgramData()
                  }}
                  onCancel={() => router.push('/diagnostic/results')}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your 30-Day Healing Journey</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your life through structured self-discovery and healing
            </p>
          </div>

          {/* Generate Personalized Program */}
          <div className="mb-8">
            <Card className="border-0 shadow-xl border-l-4 border-l-green-500">
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Personalized Healing Program</h3>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  Based on your diagnostic responses, we'll create a unique 30-day program 
                  tailored specifically to your trauma patterns and healing goals.
                </p>
                <Button 
                  size="lg" 
                  onClick={loadProgramData}
                  disabled={loading}
                  className="text-lg px-8 py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Generating your program...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate My Program
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Progress Overview</h3>
                    <Badge className="text-lg px-4 py-2 bg-green-100 text-green-800">
                      {progress.percentage}% Complete
                    </Badge>
                  </div>
                  
                  <Progress value={progress.percentage} className="h-3 mb-6" />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">{progress.completed}</div>
                      <p className="text-sm text-gray-600">Days Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{progress.streak}</div>
                      <p className="text-sm text-gray-600">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">{progress.currentDay}</div>
                      <p className="text-sm text-gray-600">Current Day</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">{30 - progress.completed}</div>
                      <p className="text-sm text-gray-600">Days Remaining</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="border-0 shadow-xl h-full">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h4>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                      <div className="text-2xl font-bold text-gray-900">
                        {progress.streak} {progress.streak === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                      <div className="text-2xl font-bold text-gray-900">{progress.percentage}%</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estimated Completion</p>
                      <div className="text-2xl font-bold text-gray-900">
                        {progress.completed === 30 ? 'Complete!' : 
                         `${Math.ceil((30 - progress.completed) / Math.max(progress.streak, 1))} days`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Location Permission Request */}
          {locationPermission === 'pending' && hasAccess && (
            <div className="mb-8">
              <Card className="border-0 shadow-xl border-l-4 border-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-blue-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Location for Personalized Weather Insights</h3>
                      <p className="text-gray-600 mb-4">
                        Allow location access to get personalized weather recommendations for your healing practice. This will enhance your daily program with weather-specific guidance.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={requestLocationPermission}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
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
                                      </div>
                    

                  </CardContent>
                </Card>
              </div>
            )}

          {/* Location Status */}
          {locationPermission === 'granted' && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Location enabled - Weather insights available</span>
              </div>
            </div>
          )}

          {/* Start Next Day Button */}
          {showNextDayButton && currentDay && (
            <div className="mb-6">
              <Button 
                onClick={startNextDay}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Next Day...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Start Next Day
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Current Day */}
          {currentDay && (
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">Day {currentDay.day}: {currentDay.title}</h3>
                      <Badge variant="secondary" className="text-sm">
                        {currentDay.metadata.duration} min
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg border-b-2 border-blue-200 pb-2">
                        <span className="text-2xl">🌅</span>
                        Guided Practice
                      </h5>
                      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
                          {currentDay.content.guidedPractice.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={index} className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                            } else if (line.trim() && !line.trim().startsWith('🌅')) {
                              return <div key={index} className="font-medium text-gray-800">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg border-b-2 border-green-200 pb-2">
                        <span className="text-2xl">⚡</span>
                        Daily Challenge
                      </h5>
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
                          {currentDay.content.challenge.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={index} className="flex items-start gap-2"><span className="text-green-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                            } else if (line.trim() && !line.trim().startsWith('⚡')) {
                              return <div key={index} className="font-medium text-gray-800">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg border-b-2 border-purple-200 pb-2">
                        <span className="text-2xl">📝</span>
                        Journaling Prompt
                      </h5>
                      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
                          {currentDay.content.journalingPrompt.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={index} className="flex items-start gap-2"><span className="text-purple-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                            } else if (line.trim() && !line.trim().startsWith('📝')) {
                              return <div key={index} className="font-medium text-gray-800">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg border-b-2 border-indigo-200 pb-2">
                        <span className="text-2xl">🌙</span>
                        Reflection
                      </h5>
                      <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
                          {currentDay.content.reflection.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={index} className="flex items-start gap-2"><span className="text-indigo-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                            } else if (line.trim() && !line.trim().startsWith('🌙')) {
                              return <div key={index} className="font-medium text-gray-800">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg border-b-2 border-yellow-200 pb-2">
                        <span className="text-2xl">🌤️</span>
                        Weather & Environment
                      </h5>
                      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
                          {currentDay.content.weather.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={index} className="flex items-start gap-2"><span className="text-yellow-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                            } else if (line.trim() && !line.trim().startsWith('🌤️')) {
                              return <div key={index} className="font-medium text-gray-800">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg border-b-2 border-pink-200 pb-2">
                        <span className="text-2xl">😴</span>
                        Sleep & Wellness
                      </h5>
                      <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
                          {currentDay.content.sleep.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={index} className="flex items-start gap-2"><span className="text-pink-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                            } else if (line.trim() && !line.trim().startsWith('😴')) {
                              return <div key={index} className="font-medium text-gray-800">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg border-b-2 border-emerald-200 pb-2">
                        <span className="text-2xl">🌿</span>
                        Holistic Healing Bonus
                      </h5>
                      <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200 border-l-4 border-emerald-400">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-3">
                          {currentDay.content.holistic.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={index} className="flex items-start gap-2"><span className="text-emerald-600 mt-1">•</span><span>{line.substring(1).trim()}</span></div>
                            } else if (line.trim() && !line.trim().startsWith('🌿')) {
                              return <div key={index} className="font-medium text-gray-800">{line.trim()}</div>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Badge className="bg-purple-100 text-purple-800">
                          {currentDay.content.mainFocus || 'Main Focus'}
                        </Badge>
                        <Badge className={getDifficultyColor(currentDay.metadata.difficulty)}>
                          {currentDay.metadata.difficulty}
                        </Badge>
                      </div>
                      

                    </div>
                    
                    <Button 
                      size="lg" 
                      onClick={completeDay}
                      disabled={completingDay || completedDays.has(currentDay.day)}
                      className={`w-full text-lg py-3 ${
                        completedDays.has(currentDay.day)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                          <Trophy className="w-5 h-5 mr-2" />
                          Complete Day {currentDay.day}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-6">Today's Focus</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Main Focus</p>
                        <p className="font-medium text-gray-900">{currentDay.content.mainFocus || 'Daily Healing'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="font-medium text-gray-900">{currentDay.metadata.duration} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Difficulty</p>
                        <p className="font-medium text-gray-900">{currentDay.metadata.difficulty}</p>
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
              <Card className="border-0 shadow-xl border-l-4 border-l-green-500">
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 text-green-600 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Congratulations!</h2>
                  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    You've completed all 30 days of your healing journey. 
                    This is just the beginning of your transformation.
                  </p>
                  <Button asChild size="lg" className="text-lg px-8 py-3">
                    <a href="/dashboard">Continue Your Journey</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
