'use client'

import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import Navigation from '../../components/Navigation'

export default function Dashboard() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <Container className="py-5">
        <Row>
          <Col>
            <h1 className="mb-4">Welcome back, {user?.firstName || 'Friend'}!</h1>
          </Col>
        </Row>
        
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Your Progress</Card.Title>
                <Card.Text>
                  Continue your healing journey where you left off.
                </Card.Text>
                <Button variant="primary" href="/onboarding">
                  Continue Journey
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Daily Journal</Card.Title>
                <Card.Text>
                  Track your thoughts and feelings each day.
                </Card.Text>
                <Button variant="outline-primary" href="/journal">
                  Write Today
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Mood Tracker</Card.Title>
                <Card.Text>
                  Monitor your emotional well-being over time.
                </Card.Text>
                <Button variant="outline-primary" href="/mood">
                  Log Mood
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}
