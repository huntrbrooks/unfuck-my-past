'use client'

import React from 'react'
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap'
import { useState } from 'react'
import Navigation from '../components/Navigation'

export default function Home() {
  const [showSafetyAlert, setShowSafetyAlert] = useState(true)

  return (
    <>
      <Navigation />
      <main>
        {/* Safety Banner */}
        {showSafetyAlert && (
          <Alert 
            variant="warning" 
            dismissible 
            onClose={() => setShowSafetyAlert(false)}
            className="mb-0"
          >
            <strong>⚠️ Important:</strong> This is not therapy. If you're in crisis, 
            please call 000 (Australia) or Lifeline 13 11 14.
          </Alert>
        )}

        {/* Hero Section */}
        <section className="healing-gradient text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Unfuck Your Past
              </h1>
              <p className="lead mb-4">
                AI-driven self-healing that actually works. No therapy waitlists, 
                no bullshit. Just raw, honest guidance to help you break free from 
                what's holding you back.
              </p>
              <div className="d-flex gap-3">
                <Button variant="light" size="lg" href="/onboarding">
                  Start Free Assessment
                </Button>
                <Button variant="outline-light" size="lg" href="/how-it-works">
                  How It Works
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="bg-white bg-opacity-10 rounded p-4">
                <h3>What You'll Get</h3>
                <ul className="list-unstyled">
                  <li className="mb-2">✅ 10-step personalization</li>
                  <li className="mb-2">✅ AI diagnostic insights</li>
                  <li className="mb-2">✅ Trauma mapping</li>
                  <li className="mb-2">✅ 30-day healing program</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    <span className="fs-4">🎯</span>
                  </div>
                  <Card.Title>Personalized Approach</Card.Title>
                  <Card.Text>
                    Your healing journey is unique. We adapt to your tone, 
                    learning style, and comfort level.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    <span className="fs-4">🤖</span>
                  </div>
                  <Card.Title>AI-Powered Insights</Card.Title>
                  <Card.Text>
                    Advanced AI analyzes your responses to provide 
                    deep, actionable insights about your patterns.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    <span className="fs-4">📈</span>
                  </div>
                  <Card.Title>Proven Results</Card.Title>
                  <Card.Text>
                    Structured 30-day program with journaling, 
                    mood tracking, and measurable progress.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-light py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="mb-4">Ready to Start Your Healing Journey?</h2>
              <p className="lead mb-4">
                Join thousands who've already transformed their lives. 
                Start with our free assessment - no commitment required.
              </p>
              <Button variant="primary" size="lg" href="/onboarding">
                Begin Free Assessment
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
      </main>
    </>
  )
}
