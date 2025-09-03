'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
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

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [moodAverage, setMoodAverage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const userId = user?.id

  useEffect(() => {
    if (isLoaded) {
      // Simulate loading data
      setTimeout(() => {
        setCurrentStreak(7)
        setTotalSessions(23)
        setMoodAverage(8.2)
        setIsLoading(false)
      }, 1000)
    }
  }, [isLoaded])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
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
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.firstName || 'Friend'}!</h1>
              <p className="text-muted-foreground">Ready to continue your healing journey?</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="modern-card border-0 group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {isLoading ? '...' : currentStreak}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Day Streak
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="modern-card border-0 group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="info" size="sm">Total</Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {isLoading ? '...' : totalSessions}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sessions Completed
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="modern-card border-0 group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center">
                    <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="warning" size="sm">Average</Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {isLoading ? '...' : moodAverage}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Mood Rating
                </CardDescription>
              </CardContent>
            </Card>
          </div>
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
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-foreground mb-2">
                        30-Day Healing Program
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Continue your personalized healing journey
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="gradient" size="lg">Active</Badge>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium text-foreground">Day 7 of 30</span>
                  </div>
                  <Progress value={23} variant="gradient" size="lg" className="h-3" />
                </div>
                
                <Button asChild className="w-full group">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last updated: 2 hours ago
                    </div>
                  </div>
                  
                  <Button variant="outline" asChild className="w-full group">
                    <a href="/mood">
                      Update Mood
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Daily Journal */}
              <Card className="modern-card border-0 group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                      <Badge variant="success" size="sm">Completed</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      &quot;Today I practiced self-compassion and noticed...&quot;
                    </div>
                  </div>
                  
                  <Button variant="outline" asChild className="w-full group">
                    <a href="/journal">
                      Write Today&apos;s Entry
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Achievements */}
            <Card className="modern-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center">
                    <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      Recent Achievements
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Celebrate your progress
                    </CardDescription>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-foreground">Completed 7 consecutive days</span>
                    <Badge variant="success" size="sm">New!</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-foreground">First journal entry completed</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-foreground">Mood tracking streak: 5 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Diagnostic Report */}
            {userId && (
              <Card className="glass-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Diagnostic Report
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        View your insights
                      </CardDescription>
                    </div>
                  </div>
                  <DiagnosticReport userId={userId} />
                </CardContent>
              </Card>
            )}

            {/* Data Export */}
            {userId && (
              <Card className="glass-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Export Your Data
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Download your progress
                      </CardDescription>
                    </div>
                  </div>
                  <DataExport userId={userId} />
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
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
          </div>
        </div>
      </div>
    </div>
  )
}
