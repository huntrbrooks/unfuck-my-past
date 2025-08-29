'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Accordion, Alert } from 'react-bootstrap'

interface DiagnosticResponse {
  question: string
  response: string
  insight: string
  timestamp: string
}

interface DiagnosticReportProps {
  className?: string
}

export default function DiagnosticReport({ className = '' }: DiagnosticReportProps) {
  const [responses, setResponses] = useState<DiagnosticResponse[]>([])
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [hasPurchased, setHasPurchased] = useState(false)

  useEffect(() => {
    checkAccessAndLoadReport()
  }, [])

  const checkAccessAndLoadReport = async () => {
    try {
      setLoading(true)
      
      // Check if user has purchased the diagnostic report
      const purchasesResponse = await fetch('/api/payments/user-purchases')
      if (purchasesResponse.ok) {
        const purchases = await purchasesResponse.json()
        
        // Ensure purchases is an array
        const purchasesArray = Array.isArray(purchases) ? purchases : []
        
        const hasDiagnostic = purchasesArray.some((p: any) => p.product === 'diagnostic' && p.active === true)
        setHasPurchased(hasDiagnostic)
        
        if (hasDiagnostic) {
          await loadDiagnosticData()
        }
      }
    } catch (error) {
      console.error('Error checking diagnostic access:', error)
      setError('Failed to load diagnostic report')
    } finally {
      setLoading(false)
    }
  }

  const loadDiagnosticData = async () => {
    try {
      // Load diagnostic responses
      const responsesResponse = await fetch('/api/diagnostic/responses')
      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json()
        setResponses(responsesData.responses || [])
      }

      // Load diagnostic summary
      const summaryResponse = await fetch('/api/diagnostic/summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData.summary || '')
      }
    } catch (error) {
      console.error('Error loading diagnostic data:', error)
      setError('Failed to load diagnostic data')
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className={className}>
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your diagnostic report...</p>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <Card.Body>
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
          </Alert>
        </Card.Body>
      </Card>
    )
  }

  if (!hasPurchased) {
    return (
      <Card className={className}>
        <Card.Body>
          <Card.Title>Diagnostic Report</Card.Title>
          <Card.Text>
            Purchase the full diagnostic report to access your personalized insights and analysis.
          </Card.Text>
          <Button variant="primary" href="/diagnostic">
            Take Diagnostic & Purchase Report
          </Button>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Card.Title className="mb-0">Your Diagnostic Report</Card.Title>
          <Badge bg="success">Purchased</Badge>
        </div>

        {summary && (
          <div className="mb-4">
            <h5>Executive Summary</h5>
            <div className="p-3 bg-light rounded">
              <p className="mb-0">{summary}</p>
            </div>
          </div>
        )}

        {responses.length > 0 && (
          <div>
            <h5>Your Responses & Insights</h5>
            <Accordion>
              {responses.map((response, index) => (
                <Accordion.Item key={index} eventKey={index.toString()}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                      <span className="text-truncate">{response.question}</span>
                      <small className="text-muted">{formatDate(response.timestamp)}</small>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <strong>Your Response:</strong>
                      <p className="mt-1 mb-0">{response.response}</p>
                    </div>
                    <div>
                      <strong>AI Insight:</strong>
                      <p className="mt-1 mb-0">{response.insight}</p>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        )}

        <div className="mt-4">
          <Button variant="outline-primary" href="/diagnostic">
            Retake Diagnostic
          </Button>
          <Button variant="outline-secondary" href="/program" className="ms-2">
            Start 30-Day Program
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}
