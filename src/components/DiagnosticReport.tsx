'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, FileText, Download } from 'lucide-react'

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
    } catch (err) {
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
      a.download = `diagnostic-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to export report')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading diagnostic report...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (responses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No diagnostic responses found.</p>
            <p className="text-sm">Complete the diagnostic section to generate your report.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Diagnostic Report</h2>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="space-y-4">
        {responses.map((response, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(index)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Question {index + 1}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {new Date(response.timestamp).toLocaleDateString()}
                  </Badge>
                  {expandedItems.has(index) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            {expandedItems.has(index) && (
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Question:</h4>
                  <p className="text-gray-700">{response.question}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Your Response:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {response.response}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI Insight:</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                    {response.insight}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Report Summary</h3>
        <p className="text-blue-800 text-sm">
          This report contains {responses.length} diagnostic responses with AI-generated insights. 
          Each response has been analyzed to provide personalized recommendations for your healing journey.
        </p>
      </div>
    </div>
  )
}

export default DiagnosticReport
