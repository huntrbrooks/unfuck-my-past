'use client'

import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import Navigation from '../../components/Navigation'

export default function HowItWorks() {
  return (
    <>
      <Navigation />
      <Container className="py-5">
        <Row>
          <Col>
            <h1 className="text-center mb-5">How It Works</h1>
          </Col>
        </Row>

        <Row className="mb-5">
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <span className="fs-4">🎯</span>
                </div>
                <Card.Title>1. Personalize</Card.Title>
                <Card.Text>
                  Complete our 10-step onboarding to customize your experience. 
                  We'll adapt to your communication style, learning preferences, 
                  and comfort level.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <span className="fs-4">🤖</span>
                </div>
                <Card.Title>2. Diagnose</Card.Title>
                <Card.Text>
                  Answer 3-10 adaptive questions about your past and patterns. 
                  Our AI analyzes your responses to provide deep, actionable insights.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <span className="fs-4">📈</span>
                </div>
                <Card.Title>3. Transform</Card.Title>
                <Card.Text>
                  Follow your personalized 30-day program with daily tasks, 
                  journaling, and mood tracking. See measurable progress over time.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-5">
          <Col lg={8} className="mx-auto">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5">
                <h2 className="h3 mb-4">What You'll Get</h2>
                
                <div className="row">
                  <div className="col-md-6">
                    <h4 className="h5 mb-3">Free Assessment</h4>
                    <ul className="list-unstyled">
                      <li className="mb-2">✅ 10-step personalization</li>
                      <li className="mb-2">✅ 3-10 diagnostic questions</li>
                      <li className="mb-2">✅ AI-powered insights</li>
                      <li className="mb-2">✅ Trauma mapping preview</li>
                    </ul>
                  </div>
                  
                  <div className="col-md-6">
                    <h4 className="h5 mb-3">Premium Features</h4>
                    <ul className="list-unstyled">
                      <li className="mb-2">🔒 Full diagnostic report ($10)</li>
                      <li className="mb-2">🔒 30-day healing program ($29.95)</li>
                      <li className="mb-2">🔒 Daily journaling & mood tracking</li>
                      <li className="mb-2">🔒 Progress analytics</li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col className="text-center">
            <Button variant="primary" size="lg" href="/onboarding">
              Start Your Journey
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  )
}
