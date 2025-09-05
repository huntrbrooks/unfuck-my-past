'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Loader2 } from 'lucide-react'
import { downloadFile } from '../lib/export-utils'

interface ExportResponse {
  success: boolean
  data: string
  filename: string
  mimeType: string
  error?: string
}

interface DataExportProps {
  userId: string
}

const DataExport: React.FC<DataExportProps> = ({ userId }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleExport = async (type: string) => {
    setIsExporting(true)
    setExportType(type)
    setError('')

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          // include mood entries from localStorage when exporting all
          moods: type === 'all-txt' ? JSON.parse(localStorage.getItem('mood-entries') || '[]') : undefined
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const data: ExportResponse = await response.json()
      
      if (data.success) {
        downloadFile(data.data, data.filename, data.mimeType)
      } else {
        setError(data.error || 'Export failed')
      }
    } catch {
      setError('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
      setExportType('')
    }
  }

  return (
    <Card className="w-full text-center bg-background border border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          Export Your Data
        </CardTitle>
        <div className="text-sm text-muted-foreground">Download your progress</div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <Button
            onClick={() => handleExport('all-txt')}
            disabled={isExporting}
            className="w-full h-12 neon-cta"
          >
            {isExporting && exportType === 'all-txt' ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            Extract All Data (.txt)
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">One click export of questions, answers, insights, reports, program progress and moods as a .txt file.</p>
      </CardContent>
    </Card>
  )
}

export default DataExport
