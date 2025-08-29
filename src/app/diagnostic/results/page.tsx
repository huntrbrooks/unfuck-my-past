'use client'

import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap'
import { useSearchParams } from 'next/navigation'
import Navigation from '../../../components/Navigation'

export default function DiagnosticResults() {
  const searchParams = useSearchParams()
  const summary = searchParams.get('summary')
  const [loading, setLoading] = useState(false)

  const handlePurchaseReport = async () => {
    setLoading(true)
    try {
      // TODO: Integrate with Stripe for $10 payment
      console.log('Purchase diagnostic report for $10')
      // For now, just redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error processing purchase:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartProgram = async () => {
    setLoading(true)
    try {
      // TODO: Integrate with Stripe for $29.95 payment
      console.log('Purchase 30-day program for $29.95')
      // For now, just redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error processing purchase:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!summary) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="warning">
                <Alert.Heading>No Results Found</Alert.Heading>
                <p>It looks like you haven't completed the diagnostic assessment yet.</p>
                <Button variant="primary" href="/diagnostic">
                  Start Assessment
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={10}>
            {/* Header */}
            <div className="text-center mb-5">
              <h1 className="h2 mb-3">Your Diagnostic Results</h1>
              <p className="lead text-muted">
                Based on your responses, here's what we discovered about your patterns and potential for growth.
              </p>
            </div>

            {/* Summary Card */}
            <Card className="border-0 shadow-sm mb-5">
              <Card.Header className="bg-primary text-white">
                <h3 className="h4 mb-0">AI-Powered Analysis</h3>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Badge bg="info" className="me-2">GPT-4 Analysis</Badge>
                  <small className="text-muted">Generated just for you</small>
                </div>
                <div className="diagnostic-summary">
                  {summary.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Next Steps */}
            <Row className="mb-5">
              <Col md={6} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-4 text-center">
                    <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                      <span className="fs-4">📋</span>
                    </div>
                    <h4 className="h5 mb-3">Full Diagnostic Report</h4>
                    <p className="text-muted mb-3">
                      Get your complete trauma mapping, detailed pattern analysis, and personalized recommendations.
                    </p>
                    <div className="mb-3">
                      <span className="h4 text-primary">$10</span>
                      <small className="text-muted d-block">One-time purchase</small>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="lg" 
                      className="w-100"
                      onClick={handlePurchaseReport}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Get Full Report'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} className="mb-4">
                <Card className="h-100 border-0 shadow-sm border-primary">
                  <Card.Body className="p-4 text-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                      <span className="fs-4">🚀</span>
                    </div>
                    <h4 className="h5 mb-3">30-Day Healing Program</h4>
                    <p className="text-muted mb-3">
                      Daily tasks, journaling prompts, mood tracking, and AI-powered guidance to transform your life.
                    </p>
                    <div className="mb-3">
                      <span className="h4 text-primary">$29.95</span>
                      <small className="text-muted d-block">Complete program</small>
                    </div>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-100"
                      onClick={handleStartProgram}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Start Healing Journey'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* What's Included */}
            <Card className="border-0 shadow-sm mb-5">
              <Card.Header className="bg-light">
                <h4 className="h5 mb-0">What's Included in the Program</h4>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6}>
                    <ul className="list-unstyled">
                      <li className="mb-2">✅ Daily personalized tasks</li>
                      <li className="mb-2">✅ Guided journaling prompts</li>
                      <li className="mb-2">✅ Mood and progress tracking</li>
                      <li className="mb-2">✅ AI-powered insights</li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <ul className="list-unstyled">
                      <li className="mb-2">✅ Trauma-informed guidance</li>
                      <li className="mb-2">✅ Coping skill development</li>
                      <li className="mb-2">✅ Progress analytics</li>
                      <li className="mb-2">✅ Community support</li>
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Safety Notice */}
            <Alert variant="info">
              <Alert.Heading>Important Safety Information</Alert.Heading>
              <p className="mb-0">
                This assessment is designed to provide insights and support, but it's not a substitute for professional therapy. 
                If you're experiencing a crisis or need immediate support, please contact a mental health professional or call 
                the National Suicide Prevention Lifeline at 988.
              </p>
            </Alert>
          </Col>
        </Row>
      </Container>
    </>
  )
}


