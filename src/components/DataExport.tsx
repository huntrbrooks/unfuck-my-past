'use client'

import React, { useState } from 'react'
import { Button, Card, Alert, Spinner, Dropdown } from 'react-bootstrap'
import { exportToJSON, exportToCSV, exportToPDF, downloadFile, ExportData } from '../lib/export-utils'

interface DataExportProps {
  className?: string
}

export default function DataExport({ className = '' }: DataExportProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Fetch data from API
      const response = await fetch('/api/export')
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data: ExportData = await response.json()

      // Generate export content
      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case 'json':
          content = exportToJSON(data)
          filename = `unfuck-your-past-data-${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
          break
        case 'csv':
          content = exportToCSV(data)
          filename = `unfuck-your-past-data-${new Date().toISOString().split('T')[0]}.csv`
          mimeType = 'text/csv'
          break
        case 'pdf':
          content = exportToPDF(data)
          filename = `unfuck-your-past-data-${new Date().toISOString().split('T')[0]}.html`
          mimeType = 'text/html'
          break
        default:
          throw new Error('Unsupported format')
      }

      // Download file
      downloadFile(content, filename, mimeType)
      setSuccess(`Data exported successfully as ${format.toUpperCase()}`)

    } catch (error) {
      console.error('Export error:', error)
      setError(error instanceof Error ? error.message : 'Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`data-export-card ${className}`}>
      <Card.Header>
        <h5 className="mb-0">Export Your Data</h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Download your personal data including diagnostic responses, program progress, and preferences.
        </p>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-3">
            {success}
          </Alert>
        )}

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={() => handleExport('json')}
            disabled={loading}
            className="flex-fill"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              'Export as JSON'
            )}
          </Button>

          <Button
            variant="outline-success"
            onClick={() => handleExport('csv')}
            disabled={loading}
            className="flex-fill"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              'Export as CSV'
            )}
          </Button>

          <Button
            variant="outline-warning"
            onClick={() => handleExport('pdf')}
            disabled={loading}
            className="flex-fill"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              'Export as HTML'
            )}
          </Button>
        </div>

        <div className="mt-3">
          <small className="text-muted">
            <strong>What's included:</strong> User preferences, diagnostic responses, program progress, and purchase history.
          </small>
        </div>
      </Card.Body>
    </Card>
  )
}
