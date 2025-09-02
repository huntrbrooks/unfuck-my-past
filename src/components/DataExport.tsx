'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText, FileSpreadsheet, FileCode, Loader2, BookOpen, Calendar, FileCheck } from 'lucide-react'
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
          type
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
    } catch (err) {
      setError('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
      setExportType('')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Your Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          {/* General Data Export */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">General Data Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'json' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Export as JSON
              </Button>
              
              <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'csv' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Export as CSV
              </Button>
              
              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCode className="h-4 w-4" />
                )}
                Export as PDF
              </Button>
            </div>
          </div>

          {/* Diagnostic TXT Exports */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnostic Reports (TXT)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleExport('diagnostic-summary-txt')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'diagnostic-summary-txt' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4" />
                )}
                Free Summary Report
              </Button>
              
              <Button
                onClick={() => handleExport('diagnostic-comprehensive-txt')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'diagnostic-comprehensive-txt' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                Full Diagnostic Report
              </Button>

              <Button
                onClick={() => handleExport('diagnostic-questions-txt')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'diagnostic-questions-txt' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Questions & Insights
              </Button>
            </div>
          </div>

          {/* Program TXT Exports */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">30-Day Program (TXT)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleExport('program-structure-txt')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'program-structure-txt' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
                Program Overview
              </Button>
              
              <Button
                onClick={() => handleExport('program-daily-txt')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'program-daily-txt' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Daily Content (All Days)
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-4">
          Export your diagnostic responses, insights, program progress, and individual reports as text files (.txt) for easy reading and sharing.
        </p>
      </CardContent>
    </Card>
  )
}

export default DataExport
