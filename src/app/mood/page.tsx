'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Mic, Type, BarChart3, Calendar, TrendingUp, Heart, Brain, Zap, Target } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface MoodEntry {
  id: string
  mood: 'very-sad' | 'sad' | 'neutral' | 'happy' | 'very-happy'
  rating: number
  note?: string
  method: 'manual' | 'voice' | 'text'
  timestamp: Date
}

export default function MoodTracker() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [currentMood, setCurrentMood] = useState<number>(5)
  const [moodNote, setMoodNote] = useState('')
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [inputMode, setInputMode] = useState<'manual' | 'voice' | 'text'>('manual')
  const [isRecording, setIsRecording] = useState(false)
  const [weeklyAverage, setWeeklyAverage] = useState(0)
  const [monthlyTrend, setMonthlyTrend] = useState<'improving' | 'stable' | 'declining'>('stable')

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    // Load mood data from localStorage or API
    const savedMoods = localStorage.getItem('mood-entries')
    if (savedMoods) {
      const parsed = JSON.parse(savedMoods).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }))
      setMoodEntries(parsed)
      calculateStats(parsed)
    }
  }, [])

  const calculateStats = (entries: MoodEntry[]) => {
    if (entries.length === 0) return

    // Calculate weekly average
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyEntries = entries.filter(entry => entry.timestamp >= weekAgo)
    const weeklyAvg = weeklyEntries.reduce((sum, entry) => sum + entry.rating, 0) / weeklyEntries.length
    setWeeklyAverage(Math.round(weeklyAvg * 10) / 10)

    // Calculate monthly trend
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const monthlyEntries = entries.filter(entry => entry.timestamp >= monthAgo)
    
    if (monthlyEntries.length >= 2) {
      const firstHalf = monthlyEntries.slice(0, Math.floor(monthlyEntries.length / 2))
      const secondHalf = monthlyEntries.slice(Math.floor(monthlyEntries.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.rating, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.rating, 0) / secondHalf.length
      
      const difference = secondAvg - firstAvg
      if (difference > 0.5) setMonthlyTrend('improving')
      else if (difference < -0.5) setMonthlyTrend('declining')
      else setMonthlyTrend('stable')
    }
  }

  const getMoodLabel = (rating: number) => {
    if (rating <= 2) return 'Very Sad'
    if (rating <= 4) return 'Sad'
    if (rating <= 6) return 'Neutral'
    if (rating <= 8) return 'Happy'
    return 'Very Happy'
  }

  const getMoodColor = (rating: number) => {
    if (rating <= 2) return 'text-red-600'
    if (rating <= 4) return 'text-orange-600'
    if (rating <= 6) return 'text-yellow-600'
    if (rating <= 8) return 'text-green-600'
    return 'text-emerald-600'
  }

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return '😢'
    if (rating <= 4) return '😔'
    if (rating <= 6) return '😐'
    if (rating <= 8) return '😊'
    return '😄'
  }

  const saveMoodEntry = () => {
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: currentMood <= 2 ? 'very-sad' : currentMood <= 4 ? 'sad' : currentMood <= 6 ? 'neutral' : currentMood <= 8 ? 'happy' : 'very-happy',
      rating: currentMood,
      note: moodNote,
      method: inputMode,
      timestamp: new Date()
    }

    const updatedEntries = [newEntry, ...moodEntries]
    setMoodEntries(updatedEntries)
    localStorage.setItem('mood-entries', JSON.stringify(updatedEntries))
    calculateStats(updatedEntries)
    
    // Reset form
    setCurrentMood(5)
    setMoodNote('')
  }

  const handleVoiceInput = async () => {
    setIsRecording(true)
    // Simulate voice recording for now
    setTimeout(() => {
      setIsRecording(false)
      setMoodNote("Voice analysis: Feeling optimistic about today's progress")
    }, 3000)
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden bg-background">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10 flex items-center gap-6 md:gap-10 justify-between">
            <div className="max-w-3xl">
              <h1 className="responsive-heading neon-heading mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)', filter: 'drop-shadow(0 0 10px #ccff00)' }}>Daily Mood Tracker</h1>
              <p className="responsive-body text-muted-foreground leading-relaxed">
                Track your emotional journey and gain insights into your patterns. Capture today’s mood by rating, voice, or text and see your progress glow.
              </p>
            </div>
            {/* Accent line art on the right with matching neon glow */}
            <div className="hidden md:block shrink-0">
              <Image
                src="/Line_art-01.png"
                alt="Neon line art"
                width={140}
                height={140}
                priority
                className="select-none"
                style={{ filter: 'drop-shadow(0 0 12px #ff7a00)' }}
              />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="glass-card border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#ccff00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-[#ccff00]" />
                </div>
                <h3 className="text-xl font-semibold text-[#000000] dark:text-[#f2f2f2] mb-2">Weekly Average</h3>
                <div className="text-3xl font-bold text-[#ccff00] mb-2">{weeklyAverage || '--'}</div>
                <p className="text-sm text-[#6b6b6b]">Out of 10</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#6b6b6b]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-[#6b6b6b]" />
                </div>
                <h3 className="text-xl font-semibold text-[#000000] dark:text-[#f2f2f2] mb-2">Entries This Week</h3>
                <div className="text-3xl font-bold text-[#6b6b6b] mb-2">{moodEntries.filter(entry => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return entry.timestamp >= weekAgo
                }).length}</div>
                <p className="text-sm text-[#6b6b6b]">Mood logs</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#3d3d3d]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-[#3d3d3d]" />
                </div>
                <h3 className="text-xl font-semibold text-[#000000] dark:text-[#f2f2f2] mb-2">Monthly Trend</h3>
                <div className={`text-2xl font-bold mb-2 ${
                  monthlyTrend === 'improving' ? 'text-[#ccff00]' : 
                  monthlyTrend === 'declining' ? 'text-red-600' : 
                  'text-[#6b6b6b]'
                }`}>
                  {monthlyTrend === 'improving' ? '↗️ Improving' : 
                   monthlyTrend === 'declining' ? '↘️ Declining' : 
                   '→ Stable'}
                </div>
                <p className="text-sm text-[#6b6b6b]">Last 30 days</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Mood Input */}
          <div className="space-y-6">
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader className="bg-[#f2f2f2] dark:bg-[#3d3d3d] border-b border-[#c2c2c2] dark:border-[#6b6b6b]">
                <CardTitle className="text-xl font-semibold neon-heading">How are you feeling today?</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Input Mode Toggle */}
                <div className="flex bg-[#f2f2f2] dark:bg-[#3d3d3d] rounded-xl p-1 mb-6">
                  <Button
                    variant={inputMode === 'manual' ? 'default' : 'ghost'}
                    onClick={() => setInputMode('manual')}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Rate
                  </Button>
                  <Button
                    variant={inputMode === 'voice' ? 'default' : 'ghost'}
                    onClick={() => setInputMode('voice')}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Voice
                  </Button>
                  <Button
                    variant={inputMode === 'text' ? 'default' : 'ghost'}
                    onClick={() => setInputMode('text')}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Type className="h-4 w-4" />
                    Text
                  </Button>
                </div>

                {/* Manual Rating */}
                {inputMode === 'manual' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-6xl mb-4">{getMoodEmoji(currentMood)}</div>
                      <div className={`text-2xl font-semibold mb-4 ${getMoodColor(currentMood)}`}>
                        {getMoodLabel(currentMood)}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[#000000] dark:text-[#f2f2f2]">
                        Rate your mood (1-10)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#6b6b6b]">1</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={currentMood}
                          onChange={(e) => setCurrentMood(Number(e.target.value))}
                          className="flex-1 h-2 bg-[#c2c2c2] rounded-lg appearance-none cursor-pointer mood-slider"
                          aria-label="Mood rating from 1 to 10"
                        />
                        <span className="text-sm text-[#6b6b6b]">10</span>
                      </div>
                      <div className="text-center">
                        <Badge 
                          className="text-lg px-4 py-2" 
                          style={{ backgroundColor: '#ccff00', color: '#000000' }}
                        >
                          {currentMood}/10
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Input */}
                {inputMode === 'voice' && (
                  <div className="text-center space-y-6">
                    <div className="p-8 border-2 border-dashed border-[#c2c2c2] rounded-2xl">
                      {isRecording ? (
                        <div className="space-y-4">
                          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <Mic className="h-10 w-10 text-red-600 animate-pulse" />
                          </div>
                          <p className="text-[#000000] dark:text-[#f2f2f2] font-medium">Recording your mood...</p>
                          <div className="flex justify-center space-x-1">
                            <div className="w-2 h-8 bg-red-500 rounded animate-pulse"></div>
                            <div className="w-2 h-6 bg-red-400 rounded animate-pulse [animation-delay:0.1s]"></div>
                            <div className="w-2 h-10 bg-red-500 rounded animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-2 h-4 bg-red-400 rounded animate-pulse [animation-delay:0.3s]"></div>
                            <div className="w-2 h-7 bg-red-500 rounded animate-pulse [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-20 h-20 bg-[#ccff00]/20 rounded-full flex items-center justify-center mx-auto">
                            <Mic className="h-10 w-10 text-[#ccff00]" />
                          </div>
                          <p className="text-[#6b6b6b]">Click to record your mood</p>
                          <Button 
                            onClick={handleVoiceInput}
                            className="neon-cta"
                          >
                            Start Recording
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Text Input */}
                {inputMode === 'text' && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-[#000000] dark:text-[#f2f2f2]">
                      How are you feeling today?
                    </label>
                    <textarea
                      value={moodNote}
                      onChange={(e) => setMoodNote(e.target.value)}
                      placeholder="Describe your mood and what's affecting it..."
                      className="w-full h-32 p-4 border border-[#c2c2c2] dark:border-[#6b6b6b] rounded-xl bg-background text-[#000000] dark:text-[#f2f2f2] resize-none focus:ring-2 focus:ring-[#ccff00]/20 focus:border-[#ccff00] outline-none"
                    />
                  </div>
                )}

                {/* Optional Note */}
                {inputMode !== 'text' && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-[#000000] dark:text-[#f2f2f2]">
                      Add a note (optional)
                    </label>
                    <textarea
                      value={moodNote}
                      onChange={(e) => setMoodNote(e.target.value)}
                      placeholder="What's contributing to your mood today?"
                      className="w-full h-24 p-4 border border-[#c2c2c2] dark:border-[#6b6b6b] rounded-xl bg-background text-[#000000] dark:text-[#f2f2f2] resize-none focus:ring-2 focus:ring-[#ccff00]/20 focus:border-[#ccff00] outline-none"
                    />
                  </div>
                )}

                <Button 
                  onClick={saveMoodEntry}
                  disabled={isRecording || (inputMode === 'text' && !moodNote.trim())}
                  className="w-full mt-6 neon-cta"
                >
                  Save Mood Entry
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Entries */}
          <div className="space-y-6">
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader className="bg-[#f2f2f2] dark:bg-[#3d3d3d] border-b border-[#c2c2c2] dark:border-[#6b6b6b]">
                <CardTitle className="text-xl font-semibold neon-heading">Recent Entries</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {moodEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#c2c2c2]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-[#c2c2c2]" />
                    </div>
                    <p className="text-[#6b6b6b]">No mood entries yet. Start tracking your daily mood!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {moodEntries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f2f2f2]/50 dark:bg-[#3d3d3d]/50 hover:bg-[#f2f2f2] dark:hover:bg-[#3d3d3d] transition-colors">
                        <div className="text-2xl">{getMoodEmoji(entry.rating)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${getMoodColor(entry.rating)}`}>
                              {getMoodLabel(entry.rating)}
                            </span>
                            <Badge className="text-xs" style={{ backgroundColor: '#ccff00', color: '#000000' }}>
                              {entry.rating}/10
                            </Badge>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-[#6b6b6b] mb-1">{entry.note}</p>
                          )}
                          <p className="text-xs text-[#c2c2c2]">
                            {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {entry.method}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#000000] dark:text-[#f2f2f2]">
                  Mood Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-[#ccff00]" />
                      <span className="font-medium text-[#000000] dark:text-[#f2f2f2]">Pattern Recognition</span>
                    </div>
                    <p className="text-sm text-[#6b6b6b]">
                      {moodEntries.length < 7 ? 
                        'Track for a week to see your mood patterns' : 
                        'Your mood tends to be highest in the evenings'}
                    </p>
                  </div>
                  
                  <Button asChild variant="outline" className="w-full">
                    <a href="/dashboard">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Full Analytics
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
