'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import GlowMetrics from '@/components/GlowMetrics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import DiagnosticReport from '@/components/DiagnosticReport'
import DataExport from '@/components/DataExport'
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Heart, 
  BookOpen, 
  BarChart3, 
  Activity, 
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Award
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [moodAverage, setMoodAverage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [todaysMood, setTodaysMood] = useState<{ rating: number; emoji: string; label: string; lastUpdated: string } | null>(null)
  const [todaysJournal, setTodaysJournal] = useState<{ exists: boolean; preview?: string } | null>(null)
  const [achievements, setAchievements] = useState<Array<{ id: string; title: string; completed: boolean }>>([])
  const [points, setPoints] = useState(0)
  const [programProgress, setProgramProgress] = useState<{ currentDay: number; percentage: number } | null>(null)

  const userId = user?.id

  useEffect(() => {
    if (isLoaded) {
      loadDashboardData()
    }
  }, [isLoaded])

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return '😢'
    if (rating <= 4) return '😔'
    if (rating <= 6) return '😐'
    if (rating <= 8) return '😊'
    return '😄'
  }

  const getMoodLabel = (rating: number) => {
    if (rating <= 2) return 'Very Sad'
    if (rating <= 4) return 'Sad'
    if (rating <= 6) return 'Neutral'
    if (rating <= 8) return 'Happy'
    return 'Very Happy'
  }

  const loadDashboardData = async () => {
    let weeklyCount = 0
    let hasAnyJournal = false
    // Load mood data from localStorage
    const savedMoods = localStorage.getItem('mood-entries')
    if (savedMoods) {
      const entries = JSON.parse(savedMoods).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }))

      // Get today's mood
      const today = new Date()
      const todayEntries = entries.filter((entry: any) => {
        const entryDate = new Date(entry.timestamp)
        return entryDate.toDateString() === today.toDateString()
      })

      if (todayEntries.length > 0) {
        const latestEntry = todayEntries[0]
        setTodaysMood({
          rating: latestEntry.rating,
          emoji: getMoodEmoji(latestEntry.rating),
          label: getMoodLabel(latestEntry.rating),
          lastUpdated: new Date(latestEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      }

      // Calculate weekly average
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weeklyEntries = entries.filter((entry: any) => new Date(entry.timestamp) >= weekAgo)
      weeklyCount = weeklyEntries.length
      if (weeklyEntries.length > 0) {
        const avg = weeklyEntries.reduce((sum: number, entry: any) => sum + entry.rating, 0) / weeklyEntries.length
        setMoodAverage(Math.round(avg * 10) / 10)
      }

      setTotalSessions(entries.length)
      setCurrentStreak(7) // Keep simulated for now
    }

    // Load journal data from localStorage
    const savedJournal = localStorage.getItem('journal-entries')
    if (savedJournal) {
      const entries: Array<{ content: string; date: string; timestamp: string }>= JSON.parse(savedJournal)
      hasAnyJournal = entries.length > 0
      const todayStr = new Date().toLocaleDateString()
      const todayEntry = entries.find((e) => e.date === todayStr)
      if (todayEntry) {
        const preview = todayEntry.content.length > 60 ? todayEntry.content.slice(0, 60) + '…' : todayEntry.content
        setTodaysJournal({ exists: true, preview })
      } else {
        setTodaysJournal({ exists: false })
      }
    } else {
      setTodaysJournal({ exists: false })
    }

    // Compute achievements & points
    const computedAchievements = [
      { id: 'streak7', title: 'Completed 7 consecutive days', completed: (7 <= (typeof currentStreak === 'number' ? currentStreak : Number(currentStreak) || 0)) },
      { id: 'first-journal', title: 'First journal entry completed', completed: hasAnyJournal },
      { id: 'mood-streak5', title: 'Mood tracking streak: 5 days', completed: weeklyCount >= 5 }
    ]
    setAchievements(computedAchievements)
    setPoints(computedAchievements.filter(a => a.completed).length * 5)

    // Load program progress from API for accurate current day
    try {
      const res = await fetch('/api/program/progress')
      if (res.ok) {
        const data = await res.json()
        setProgramProgress({ currentDay: data.currentDay || 0, percentage: data.percentage || 0 })
      } else {
        setProgramProgress({ currentDay: 0, percentage: 0 })
      }
    } catch {
      setProgramProgress({ currentDay: 0, percentage: 0 })
    }

    setIsLoading(false)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Please sign in to view your dashboard</h1>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
            </div>
          </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
              <Target className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold neon-heading">Welcome back, {user.firstName || 'Friend'}!</h1>
              <p className="text-muted-foreground">Ready to continue your healing journey?</p>
            </div>
          </div>
          
          {/* Quick Stats (Glow style) */}
          <GlowMetrics streak={isLoading ? '…' : currentStreak} sessions={isLoading ? '…' : totalSessions} moodAvg={isLoading ? '…' : moodAverage} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Features */}
          <div className="lg:col-span-2 space-y-8">
            {/* 30-Day Program Card */}
            <Card className="feature-card border-0 group">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold neon-heading mb-2">
                        30-Day Healing Program
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Continue your personalized healing journey
                      </CardDescription>
                    </div>
                  </div>
                  {/* unified layout: remove badge; status shown below like journal */}
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium text-foreground">{programProgress ? `Day ${programProgress.currentDay} of 30` : 'Day 0 of 30'}</span>
                  </div>
                  <Progress value={programProgress?.percentage ?? 0} variant="gradient" size="lg" className="h-3" />
                </div>
                
                <Button asChild className="w-full group neon-cta">
                  <a href="/program">
                    Continue Program
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Daily Tools Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Mood Tracker */}
              <Card className="modern-card border-0 group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ff6600)' }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Daily Mood Tracker
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Track your emotional journey
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today&apos;s Mood</span>
                      <div className="flex items-center gap-3 ml-auto">
                        {todaysMood && (
                          <>
                            <span className="text-4xl leading-none">{todaysMood.emoji}</span>
                            <span className="font-semibold text-foreground text-xl">{todaysMood.rating}/10</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${todaysMood ? 'status-completed-glow' : 'status-not-completed-glow'}`}>
                      {todaysMood ? 'Completed' : 'Not Completed'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {todaysMood ? `Last updated: ${todaysMood.lastUpdated}` : 'Track your mood to mark as completed'}
                    </div>
                  </div>
                  
                  <Button variant="outline" asChild className="w-full group">
                    <Link href="/mood">
                      Update Mood
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Daily Journal */}
              <Card className="modern-card border-0 group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ff1aff)' }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Daily Journal
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Reflect and grow through writing
                      </CardDescription>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today&apos;s Entry</span>
                    </div>
                    <div className={`text-sm font-semibold ${todaysJournal?.exists ? 'status-completed-glow' : 'status-not-completed-glow'}`}>
                      {todaysJournal?.exists ? 'Completed' : 'Not Completed'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {todaysJournal?.exists ? (
                        <>"{todaysJournal.preview}"</>
                      ) : (
                        <>Start your reflection for today</>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="outline" asChild className="w-full group">
                    <a href="/journal">
                      {todaysJournal?.exists ? 'Edit Today\'s Entry' : 'Write Today\'s Entry'}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Achievements split */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="modern-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                      <Award className="h-6 w-6 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ff1aff)' }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Recent Achievements</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">New and in-progress</CardDescription>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {achievements.filter(a => !a.completed).map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/10">
                        <div className="w-6 h-6 rounded-full border border-current icon-line glow-red-icon" />
                        <span className="text-sm text-foreground">{a.title}</span>
                      </div>
                    ))}
                    {achievements.filter(a => !a.completed).length === 0 && (
                      <div className="text-sm text-muted-foreground">No pending achievements</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="modern-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                        <Award className="h-6 w-6 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">Completed Achievements</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Great work!</CardDescription>
                      </div>
                    </div>
                    <div className="border rounded-full px-3 py-1 text-center">
                      <div className="text-xs text-muted-foreground">Points</div>
                      <div className="text-base font-semibold text-foreground">{points}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {achievements.filter(a => a.completed).map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/10">
                        <div className="w-6 h-6 rounded-full border border-current icon-line glow-green-icon flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 icon-line" />
                        </div>
                        <span className="text-sm text-foreground">{a.title}</span>
                      </div>
                    ))}
                    {achievements.filter(a => a.completed).length === 0 && (
                      <div className="text-sm text-muted-foreground">No achievements yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions (moved above Diagnostics) */}
            <Card className="modern-card border-0">
              <CardContent className="p-6">
                <CardTitle className="text-lg font-semibold text-foreground mb-4">
                  Quick Actions
                </CardTitle>
                <div className="space-y-3">
                  <Button variant="outline" asChild className="w-full justify-start group">
                    <a href="/onboarding">
                      <Clock className="h-4 w-4 mr-2" />
                      Update Preferences
                      <ArrowRight className="ml-auto h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start group">
                    <a href="/how-it-works">
                      <BookOpen className="h-4 w-4 mr-2" />
                      How It Works
                      <ArrowRight className="ml-auto h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Diagnostics */}
            {userId && (
              <Card className="modern-card border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-2 mb-4 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Diagnostics</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">View your insights</CardDescription>
                    </div>
                  </div>
                  <DiagnosticReport userId={userId} />
                </CardContent>
              </Card>
            )}

            {/* Data Export (centered single card) */}
            {userId && <DataExport userId={userId} />}
          </div>
        </div>
      </div>
    </div>
  )
}
