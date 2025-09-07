'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Target, BookOpen, Clock, Shield, Settings, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface UserPreferences {
  goals: string[]
  experience: string
  skipTriggers: boolean
  crisisSupport: boolean
  timeCommitment: string
  contentWarnings: boolean
}

export default function PreferencesPage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>({
    goals: [],
    experience: 'beginner',
    skipTriggers: true,
    crisisSupport: false,
    timeCommitment: '5min',
    contentWarnings: true
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!userId) {
      router.push('/sign-in')
      return
    }
    loadPreferences()
    // Check if user has initial onboarding
    ;(async () => {
      try {
        const res = await fetch('/api/diagnostic/responses')
        if (res.ok) {
          const data = await res.json()
          setHasExisting((data.responses?.length || 0) > 0)
        }
      } catch {}
    })()
  }, [userId, isLoaded, router])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.safety) {
          setPreferences({
            goals: data.safety.goals || [],
            experience: data.safety.experience || 'beginner',
            skipTriggers: data.safety.skipTriggers !== false,
            crisisSupport: data.safety.crisisSupport === true,
            timeCommitment: data.safety.timeCommitment || '5min',
            contentWarnings: data.safety.contentWarnings !== false
          })
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      if (hasExisting) {
        const proceed = confirm('Updating preferences will update your master prompt for future content but will NOT overwrite your initial onboarding. Continue?')
        if (!proceed) {
          router.push('/dashboard')
          return
        }
      }
      setSaving(true)
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        toast.success('Preferences saved successfully')
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleGoalToggle = (goal: string) => {
    setPreferences(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your preferences..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Heading with line art on both sides */}
            <div className="relative mb-8 flex items-center justify-center gap-4 sm:gap-6">
              <div className="animate-float">
                <Image src="/Line_art3-02.png" alt="left line art" width={56} height={56} className="w-12 h-auto drop-shadow-[0_0_14px_#ff1aff]" />
              </div>
              <h1 className="responsive-heading neon-heading key-info mb-0">Your Preferences</h1>
              <div className="hidden sm:block animate-float-delayed">
                <Image src="/Line_art2-02.png" alt="right line art" width={56} height={56} className="w-12 h-auto drop-shadow-[0_0_14px_#00e5ff]" />
              </div>
            </div>
            <p className="responsive-body text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Customize your healing journey experience to match your unique needs, 
              comfort level, and goals. These settings help us provide the most 
              effective and supportive experience for you.
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-8">
          {/* Goals Section */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-background border-b border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <Target className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Healing Goals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'trauma-recovery', label: 'Trauma Recovery', description: 'Process and heal from past trauma', icon: '🧠' },
                  { id: 'relationship-building', label: 'Relationship Building', description: 'Improve connections with others', icon: '🤝' },
                  { id: 'peace-attainment', label: 'Peace Attainment', description: 'Find inner calm and tranquility', icon: '🕊️' },
                  { id: 'purpose', label: 'Purpose Discovery', description: 'Discover your life purpose and meaning', icon: '✨' },
                  { id: 'self-love', label: 'Self-Love', description: 'Develop self-compassion and acceptance', icon: '💝' },
                  { id: 'boundaries', label: 'Healthy Boundaries', description: 'Learn to set and maintain boundaries', icon: '🛡️' }
                ].map((goal) => (
                  <div 
                    key={goal.id} 
                    className={`flex items-start space-x-3 p-4 border rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group ${
                      preferences.goals.includes(goal.id)
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/30 hover:bg-accent/5'
                    }`}
                    onClick={() => handleGoalToggle(goal.id)}
                  >
                    <Checkbox
                      id={goal.id}
                      checked={preferences.goals.includes(goal.id)}
                      onCheckedChange={() => handleGoalToggle(goal.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{goal.icon}</span>
                        <Label htmlFor={goal.id} className="font-medium cursor-pointer text-foreground">
                          {goal.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Experience Level */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-background border-b border-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Experience Level</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="max-w-md">
                <Select value={preferences.experience} onValueChange={(value) => setPreferences(prev => ({ ...prev, experience: value }))}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - New to healing work</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                    <SelectItem value="advanced">Advanced - Experienced practitioner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  This helps us tailor the complexity and depth of your healing journey.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Time Commitment */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-background border-b border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ff6600)' }} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Time Commitment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="max-w-md">
                <Select value={preferences.timeCommitment} onValueChange={(value) => setPreferences(prev => ({ ...prev, timeCommitment: value }))}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">5 minutes per day</SelectItem>
                    <SelectItem value="15min">15 minutes per day</SelectItem>
                    <SelectItem value="30min">30 minutes per day</SelectItem>
                    <SelectItem value="1hour">1 hour per day</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose how much time you can dedicate to your healing journey each day.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Safety & Comfort Settings */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-background border-b border-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-black dark:text-white spin-slow" style={{ filter: 'drop-shadow(0 0 8px #ff1aff)' }} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Safety & Comfort</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
                <Checkbox
                  id="skipTriggers"
                  checked={preferences.skipTriggers}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, skipTriggers: checked as boolean }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="skipTriggers" className="font-medium cursor-pointer text-foreground">
                    Skip Triggering Content
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically skip content that might be triggering or overwhelming for you
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
                <Checkbox
                  id="contentWarnings"
                  checked={preferences.contentWarnings}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, contentWarnings: checked as boolean }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="contentWarnings" className="font-medium cursor-pointer text-foreground">
                    Show Content Warnings
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Display warnings before potentially sensitive or triggering content
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
                <Checkbox
                  id="crisisSupport"
                  checked={preferences.crisisSupport}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, crisisSupport: checked as boolean }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="crisisSupport" className="font-medium cursor-pointer text-foreground">
                    Crisis Support Resources
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Show crisis support information and emergency resources when needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              size="lg"
              variant="cta"
              className="px-12 py-4 text-lg group hover:scale-105 transition-transform duration-200"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>

          {/* Info Box */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-6 py-3 border border-border/50">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Your preferences help us create a truly personalized healing experience
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
