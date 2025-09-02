'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Heart, Sparkles, TrendingUp, Calendar, Target, Clock, BookOpen, Activity } from 'lucide-react'
import DataExport from '../../components/DataExport'
import DiagnosticReport from '../../components/DiagnosticReport'

export default function Dashboard() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
            Welcome back, {user?.firstName || 'Friend'}!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Continue your healing journey where you left off
          </p>
        </div>

        {/* Main Program Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Your Healing Journey</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Based on your diagnostic responses, we'll create a unique 30-day program tailored specifically to your
              trauma patterns and healing goals.
            </p>
            <Button size="lg" className="gap-2" asChild>
              <a href="/onboarding">
                <Sparkles className="w-4 h-4" />
                Continue Journey
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Progress Overview
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                40% Complete
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Progress value={40} className="h-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">12</div>
                  <div className="text-sm text-muted-foreground">Days Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">12</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">13</div>
                  <div className="text-sm text-muted-foreground">Current Day</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground mb-1">18</div>
                  <div className="text-sm text-muted-foreground">Days Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <Badge variant="secondary">12 days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Sessions</span>
                <Badge variant="secondary">24</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mood Average</span>
                <Badge variant="secondary">7.2/10</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Mood Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Daily Mood Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Track your emotional well-being daily.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today's Mood:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    😊 Good
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Energy Level:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    ⚡ High
                  </Badge>
                </div>
                <Button variant="outline" className="w-full mt-3" asChild>
                  <a href="/mood">Update Mood</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily Journal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Daily Journal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Reflect on your healing journey.
              </p>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Today's Entry:</span>
                  <p className="mt-1 text-foreground line-clamp-2">
                    "Feeling more grounded today. The breathing exercises really helped..."
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/journal">Write Entry</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 30-Day Program */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                30-Day Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Access your personalized healing program.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/program">View Program</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Day */}
          <Card className="lg:col-span-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    Day 13
                  </Badge>
                  <h3 className="text-lg font-semibold text-foreground">Navigating Grief: Unearthing the Guilt</h3>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/onboarding">Start Session</a>
                </Button>
              </div>
              <Progress value={0} className="h-1" />
            </CardContent>
          </Card>

          {/* Today's Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Category:</div>
                <div className="font-medium text-foreground">Processing</div>
                <div className="text-sm text-muted-foreground mt-4">Estimated time:</div>
                <div className="flex items-center gap-1 text-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">15-20 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <DiagnosticReport className="mb-4" />
            <DataExport />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/program">30-Day Program</a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/diagnostic">Take Diagnostic</a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/how-it-works">How It Works</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
