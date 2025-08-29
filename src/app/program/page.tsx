'use client'

import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, ProgressBar, Button, Badge, Alert, Spinner } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import Navigation from '../../components/Navigation'

interface ProgramProgress {
  completed: number
  total: number
  percentage: number
  currentDay: number
  streak: number
}

interface ProgramDay {
  day: number
  title: string
  content: string
  metadata: {
    category: string
    duration: number
    difficulty: string
    tools: string[]
  }
}

export default function Program() {
  const router = useRouter()
  const [progress, setProgress] = useState<ProgramProgress | null>(null)
  const [currentDay, setCurrentDay] = useState<ProgramDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    checkProgramAccess()
  }, [])

  const checkProgramAccess = async () => {
    try {
      const response = await fetch('/api/payments/user-purchases')
      if (response.ok) {
        const data = await response.json()
        const hasProgramAccess = data.purchases.includes('program')
        setHasAccess(hasProgramAccess)
        
        if (hasProgramAccess) {
          loadProgramData()
        }
      }
    } catch (error) {
      console.error('Error checking program access:', error)
      setError('Failed to check program access')
    } finally {
      setCheckingAccess(false)
    }
  }

  const loadProgramData = async () => {
    try {
      setLoading(true)
      
      // Load progress
      const progressResponse = await fetch('/api/program/progress')
      if (!progressResponse.ok) {
        throw new Error('Failed to load progress')
      }
      const progressData = await progressResponse.json()
      setProgress(progressData)

      // Load current day content
      if (progressData.currentDay <= 30) {
        const dayResponse = await fetch(`/api/program/day/${progressData.currentDay}`)
        if (dayResponse.ok) {
          const dayData = await dayResponse.json()
          setCurrentDay(dayData)
        }
      }
    } catch (error) {
      setError('Failed to load program data')
      console.error('Error loading program data:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeDay = async () => {
    if (!progress) return

    try {
      const response = await fetch('/api/program/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ day: progress.currentDay }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete day')
      }

      const result = await response.json()
      setProgress(result.progress)
      
      // Reload current day content
      if (result.progress.currentDay <= 30) {
        const dayResponse = await fetch(`/api/program/day/${result.progress.currentDay}`)
        if (dayResponse.ok) {
          const dayData = await dayResponse.json()
          setCurrentDay(dayData)
        }
      }
    } catch (error) {
      setError('Failed to complete day')
      console.error('Error completing day:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success'
      case 'moderate': return 'warning'
      case 'challenging': return 'danger'
      default: return 'secondary'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'awareness': return 'primary'
      case 'processing': return 'info'
      case 'integration': return 'warning'
      case 'action': return 'success'
      default: return 'secondary'
    }
  }

  if (checkingAccess) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="card-shadow">
                <Card.Body className="p-5 text-center loading-spinner">
                  <Spinner animation="border" className="mb-3" />
                  <h3>Checking program access...</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="warning" className="alert-custom">
                <Alert.Heading>Program Access Required</Alert.Heading>
                <p>You need to purchase the 30-day program to access this content.</p>
                <Button variant="primary" href="/diagnostic/results">
                  Get Program Access
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="card-shadow">
                <Card.Body className="p-5 text-center loading-spinner">
                  <Spinner animation="border" className="mb-3" />
                  <h3>Loading your program...</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="danger" className="alert-custom">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={loadProgramData}>
                  Try Again
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  if (!progress) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="warning" className="alert-custom">
                <Alert.Heading>Program Not Available</Alert.Heading>
                <p>You need to purchase the 30-day program to access this content.</p>
                <Button variant="primary" href="/diagnostic/results">
                  Get Program Access
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
        {/* Header */}
        <Row className="mb-5">
          <Col>
            <h1 className="mb-3">Your 30-Day Healing Journey</h1>
            <p className="lead text-muted">
              Transform your life through structured self-discovery and healing
            </p>
          </Col>
        </Row>

        {/* Progress Overview */}
        <Row className="mb-5">
          <Col lg={8}>
            <Card className="card-shadow">
              <Card.Body className="progress-overview">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h4 mb-0">Progress Overview</h3>
                  <Badge bg="primary" className="fs-6 badge-custom">
                    {progress.percentage}% Complete
                  </Badge>
                </div>
                
                <ProgressBar 
                  now={progress.percentage} 
                  className="mb-3 progress-custom" 
                />
                
                <Row className="progress-stats">
                  <Col>
                    <div className="h4 text-primary-custom mb-1">{progress.completed}</div>
                    <small className="text-muted">Days Completed</small>
                  </Col>
                  <Col>
                    <div className="h4 text-success mb-1">{progress.streak}</div>
                    <small className="text-muted">Day Streak</small>
                  </Col>
                  <Col>
                    <div className="h4 text-info mb-1">{progress.currentDay}</div>
                    <small className="text-muted">Current Day</small>
                  </Col>
                  <Col>
                    <div className="h4 text-warning mb-1">{30 - progress.completed}</div>
                    <small className="text-muted">Days Remaining</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="card-shadow h-100">
              <Card.Body className="quick-stats">
                <h4 className="h5 mb-3">Quick Stats</h4>
                <div className="mb-3">
                  <small className="text-muted d-block">Current Streak</small>
                  <div className="h5 mb-0">
                    {progress.streak} {progress.streak === 1 ? 'day' : 'days'}
                  </div>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Completion Rate</small>
                  <div className="h5 mb-0">{progress.percentage}%</div>
                </div>
                <div>
                  <small className="text-muted d-block">Estimated Completion</small>
                  <div className="h5 mb-0">
                    {progress.completed === 30 ? 'Complete!' : 
                     `${Math.ceil((30 - progress.completed) / Math.max(progress.streak, 1))} days`}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Current Day */}
        {currentDay && (
          <Row className="mb-5">
            <Col lg={8}>
              <Card className="card-shadow">
                <Card.Header className="program-day-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="h4 mb-0">Day {currentDay.day}: {currentDay.title}</h3>
                    <Badge bg="light" text="dark" className="badge-custom">
                      {currentDay.metadata.duration} min
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body className="program-day-body">
                  <div className="mb-4">
                    <p className="lead">{currentDay.content}</p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="d-flex gap-2 mb-2">
                      <Badge bg={getCategoryColor(currentDay.metadata.category)} className="badge-custom">
                        {currentDay.metadata.category}
                      </Badge>
                      <Badge bg={getDifficultyColor(currentDay.metadata.difficulty)} className="badge-custom">
                        {currentDay.metadata.difficulty}
                      </Badge>
                    </div>
                    
                    <div>
                      <small className="text-muted">Tools: </small>
                      {currentDay.metadata.tools.map((tool, index) => (
                        <Badge key={index} bg="outline-secondary" className="me-1 badge-custom">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={completeDay}
                    className="w-100 btn-custom-lg"
                  >
                    Complete Day {currentDay.day}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4}>
              <Card className="card-shadow">
                <Card.Body className="program-day-focus">
                  <h4 className="h5 mb-3">Today's Focus</h4>
                  <div className="mb-3">
                    <strong>Category:</strong> {currentDay.metadata.category}
                  </div>
                  <div className="mb-3">
                    <strong>Duration:</strong> {currentDay.metadata.duration} minutes
                  </div>
                  <div className="mb-3">
                    <strong>Difficulty:</strong> {currentDay.metadata.difficulty}
                  </div>
                  <div>
                    <strong>Tools:</strong>
                    <ul className="list-unstyled mt-2">
                      {currentDay.metadata.tools.map((tool, index) => (
                        <li key={index} className="mb-1">
                          <small>• {tool}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Program Complete */}
        {progress.completed === 30 && (
          <Row className="mb-5">
            <Col>
              <Card className="card-shadow border-success">
                <Card.Body className="p-5 text-center">
                  <div className="mb-4">
                    <span className="display-1">🎉</span>
                  </div>
                  <h2 className="mb-3">Congratulations!</h2>
                  <p className="lead mb-4">
                    You've completed all 30 days of your healing journey. 
                    This is just the beginning of your transformation.
                  </p>
                  <Button variant="success" size="lg" href="/dashboard" className="btn-custom-lg">
                    Continue Your Journey
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  )
}
