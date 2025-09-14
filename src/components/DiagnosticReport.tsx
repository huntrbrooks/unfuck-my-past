'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, FileText, Download, Brain, Target, Sparkles } from 'lucide-react'

interface DiagnosticResponse {
  question: string
  response: string
  insight: string
  timestamp: string
}

interface DiagnosticReportProps {
  userId: string
}

const DiagnosticReport: React.FC<DiagnosticReportProps> = ({ userId }) => {
  const [responses, setResponses] = useState<DiagnosticResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchDiagnosticResponses()
  }, [userId])

  const fetchDiagnosticResponses = async () => {
    try {
      const response = await fetch('/api/diagnostic/responses')
      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic responses')
      }
      const data = await response.json()
      setResponses(data.responses || [])
    } catch {
      setError('Failed to load diagnostic responses')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/diagnostic/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diagnostic-report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError('Failed to export report')
    }
  }

  if (loading) {
    return (
      <Card className="modern-card border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-foreground">Loading prognostic report...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-destructive/5 border-0">
        <CardContent className="p-6">
          <div className="p-3 bg-destructive/10 rounded-md text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (responses.length === 0) {
    return (
      <Card className="modern-card border-0">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No prognostic responses found.</p>
            <p className="text-sm">Complete the prognostic section to generate your report.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-2">
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="space-y-4">
        {responses.map((response, index) => {
          return (
          <Card key={index} className="modern-card border-0 overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-accent/20 transition-colors py-2 px-4"
              onClick={() => toggleExpanded(index)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground font-bold">Question {index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {new Date(response.timestamp).toLocaleDateString()}
                  </Badge>
                  {expandedItems.has(index) ? (
                    <ChevronUp className="h-5 w-5 text-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            {expandedItems.has(index) && (
              <CardContent className="space-y-3 py-3 px-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Question
                  </h4>
                  <div className="space-y-1">
                    <p className="text-foreground">
                      {(() => {
                        try {
                          const q = typeof response.question === 'string' ? JSON.parse(response.question) : response.question
                          return q?.question || q?.text || q?.title || 'Question'
                        } catch {
                          return String(response.question)
                        }
                      })()}
                    </p>
                    {(() => {
                      try {
                        const q = typeof response.question === 'string' ? JSON.parse(response.question) : response.question
                        return q?.followUp ? (
                          <p className="text-sm text-muted-foreground">{q.followUp}</p>
                        ) : null
                      } catch { return null }
                    })()}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-accent-foreground" />
                    Your Response:
                  </h4>
                  <p className="text-foreground bg-muted/30 p-3 rounded-md">
                    {response.response}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Insight:
                  </h4>
                  <p className="text-foreground bg-primary/5 p-3 rounded-md">
                    {response.insight}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )})}
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-lg">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Report Summary
        </h3>
        <p className="text-foreground text-sm">
          This report contains {responses.length} prognostic responses with AI-generated insights. 
          Each response has been analyzed to provide personalized recommendations for your healing journey.
        </p>
      </div>
    </div>
  )
}

export default DiagnosticReport
