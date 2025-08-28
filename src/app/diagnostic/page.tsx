'use client'

import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import Navigation from '../../components/Navigation'

export default function Diagnostic() {
  return (
    <>
      <Navigation />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5 text-center">
                <h1 className="h2 mb-4">Diagnostic Assessment</h1>
                <p className="lead mb-4">
                  This is where the diagnostic Q&A engine will be built.
                </p>
                <p className="text-muted mb-4">
                  Users will answer 3-10 adaptive questions and receive AI-powered insights.
                </p>
                
                <div className="d-flex gap-3 justify-content-center">
                  <Button variant="primary" href="/dashboard">
                    Go to Dashboard
                  </Button>
                  <Button variant="outline-secondary" href="/onboarding">
                    Back to Onboarding
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}
