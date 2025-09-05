'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Sparkles, Calendar, Heart, Brain, TrendingUp } from 'lucide-react'

interface JournalEntry {
  id: string
  content: string
  timestamp: string
  date: string
  mood?: string
  insights?: string[]
}

const moodOptions = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' }
]

export default function DailyJournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState('')
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [latestInsights, setLatestInsights] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const savedEntries = localStorage.getItem('journal-entries')
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    }
  }, [])

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('journal-entries', JSON.stringify(entries))
    }
  }, [entries])

  const generateInsights = (content: string, mood: string): string[] => {
    const insights: string[] = []

    if (content.toLowerCase().includes('grateful') || content.toLowerCase().includes('thankful')) {
      insights.push("You're practicing gratitude - this is linked to improved mental wellbeing")
    }

    if (content.toLowerCase().includes('stress') || content.toLowerCase().includes('worried')) {
      insights.push('Consider trying deep breathing or meditation when feeling stressed')
    }

    if (mood === 'happy') {
      insights.push('Your positive mood today can boost creativity and problem-solving')
    }

    if (content.length > 200) {
      insights.push('Detailed reflection like this helps process emotions more effectively')
    }

    if (content.toLowerCase().includes('goal') || content.toLowerCase().includes('plan')) {
      insights.push('Setting intentions in your journal increases the likelihood of achieving them')
    }

    if (insights.length === 0) {
      insights.push('Regular journaling can improve self-awareness and emotional regulation')
    }

    return insights
  }

  const handleSaveEntry = async () => {
    if (!currentEntry.trim()) return

    const now = new Date()
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content: currentEntry,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString(),
      mood: selectedMood
    }

    setEntries((prev) => [newEntry, ...prev])

    setIsGeneratingInsights(true)
    try {
      const res = await fetch('/api/journal/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentEntry, mood: selectedMood })
      })
      let insights: string[]
      if (res.ok) {
        const data = await res.json()
        insights = Array.isArray(data.insights) ? data.insights : []
      } else {
        insights = generateInsights(currentEntry, selectedMood)
      }

      const updatedEntry = { ...newEntry, insights }
      setEntries((prev) => prev.map((entry) => (entry.id === newEntry.id ? updatedEntry : entry)))
      setLatestInsights(insights)
      setShowInsights(true)
    } catch {
      const insights = generateInsights(currentEntry, selectedMood)
      const updatedEntry = { ...newEntry, insights }
      setEntries((prev) => prev.map((entry) => (entry.id === newEntry.id ? updatedEntry : entry)))
      setLatestInsights(insights)
      setShowInsights(true)
    } finally {
      setIsGeneratingInsights(false)
    }

    setCurrentEntry('')
    setSelectedMood('')
  }

  const todaysEntries = useMemo(
    () => entries.filter((entry) => entry.date === new Date().toLocaleDateString()),
    [entries]
  )

  return (
    <div className="journal-theme min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Daily Journal</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="w-5 h-5" />
              Today&apos;s Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">How are you feeling?</label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((mood) => (
                  <Button
                    key={mood.value}
                    variant={selectedMood === mood.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMood(mood.value)}
                    className="flex items-center gap-2"
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">What&apos;s on your mind?</label>
              <Textarea
                ref={textareaRef}
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="Write about your day, thoughts, feelings, or anything that comes to mind..."
                className="min-h-[200px] text-base leading-relaxed resize-none border-border"
              />
            </div>

            <Button onClick={handleSaveEntry} disabled={!currentEntry.trim() || isGeneratingInsights} className="w-full">
              {isGeneratingInsights ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {showInsights && latestInsights.length > 0 && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Brain className="w-5 h-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {latestInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {todaysEntries.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="w-5 h-5" />
                Today&apos;s Reflection ({todaysEntries.length} {todaysEntries.length === 1 ? 'entry' : 'entries'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="border-l-4 border-primary/50 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">{entry.timestamp}</span>
                      {entry.mood && (
                        <Badge variant="secondary" className="text-xs">
                          {moodOptions.find((m) => m.value === entry.mood)?.emoji} {entry.mood}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
                    {entry.insights && entry.insights.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {entry.insights.length} insight{entry.insights.length !== 1 ? 's' : ''} generated
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {entries.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to Your Journal</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start your mindful journey by writing your first entry. Our AI will provide personalized insights to help you reflect and grow.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}


