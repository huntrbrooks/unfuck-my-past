'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface UserPreferences {
  goals: string[]
  experience: string
  skipTriggers: boolean
  crisisSupport: boolean
  timeCommitment: string
  contentWarnings: boolean
}

export default function PreferencesPage() {
  const { userId } = useAuth()
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

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in')
      return
    }
    loadPreferences()
  }, [userId, router])

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Preferences</h1>
          <p className="text-lg text-gray-600">
            Customize your healing journey experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Goals Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Healing Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'trauma-recovery', label: 'Trauma Recovery', description: 'Process and heal from past trauma' },
                  { id: 'relationship-building', label: 'Relationship Building', description: 'Improve connections with others' },
                  { id: 'peace-attainment', label: 'Peace Attainment', description: 'Find inner calm and tranquility' },
                  { id: 'purpose', label: 'Purpose Discovery', description: 'Discover your life purpose and meaning' },
                  { id: 'self-love', label: 'Self-Love', description: 'Develop self-compassion and acceptance' },
                  { id: 'boundaries', label: 'Healthy Boundaries', description: 'Learn to set and maintain boundaries' }
                ].map((goal) => (
                  <div key={goal.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={goal.id}
                      checked={preferences.goals.includes(goal.id)}
                      onCheckedChange={() => handleGoalToggle(goal.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={goal.id} className="font-medium cursor-pointer">
                        {goal.label}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Experience Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                Experience Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={preferences.experience} onValueChange={(value) => setPreferences(prev => ({ ...prev, experience: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - New to healing work</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                  <SelectItem value="advanced">Advanced - Experienced practitioner</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Time Commitment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                Time Commitment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={preferences.timeCommitment} onValueChange={(value) => setPreferences(prev => ({ ...prev, timeCommitment: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">5 minutes per day</SelectItem>
                  <SelectItem value="15min">15 minutes per day</SelectItem>
                  <SelectItem value="30min">30 minutes per day</SelectItem>
                  <SelectItem value="1hour">1 hour per day</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Safety & Comfort Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                Safety & Comfort
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="skipTriggers"
                  checked={preferences.skipTriggers}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, skipTriggers: checked as boolean }))}
                />
                <div className="flex-1">
                  <Label htmlFor="skipTriggers" className="font-medium cursor-pointer">
                    Skip Triggering Content
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Automatically skip content that might be triggering</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="contentWarnings"
                  checked={preferences.contentWarnings}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, contentWarnings: checked as boolean }))}
                />
                <div className="flex-1">
                  <Label htmlFor="contentWarnings" className="font-medium cursor-pointer">
                    Show Content Warnings
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Display warnings before potentially sensitive content</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="crisisSupport"
                  checked={preferences.crisisSupport}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, crisisSupport: checked as boolean }))}
                />
                <div className="flex-1">
                  <Label htmlFor="crisisSupport" className="font-medium cursor-pointer">
                    Crisis Support Resources
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Show crisis support information and resources</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="px-8 py-3"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
