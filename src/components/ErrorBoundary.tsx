'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // Log error to external service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error logging service
      console.error('Production error:', { error, errorInfo })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="card-shadow border-danger">
                <Card.Body className="p-5 text-center">
                  <div className="mb-4">
                    <span className="display-1">⚠️</span>
                  </div>
                  <h2 className="mb-3">Something went wrong</h2>
                  <p className="lead mb-4">
                    We encountered an unexpected error. Don't worry, your data is safe.
                  </p>
                  
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <Alert variant="danger" className="mb-4 text-start">
                      <Alert.Heading>Error Details (Development)</Alert.Heading>
                      <p className="mb-2"><strong>Error:</strong> {this.state.error.message}</p>
                      {this.state.errorInfo && (
                        <details>
                          <summary>Stack Trace</summary>
                          <pre className="mt-2 small">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </Alert>
                  )}
                  
                  <div className="d-flex gap-3 justify-content-center">
                    <Button variant="primary" onClick={this.handleReload}>
                      Try Again
                    </Button>
                    <Button variant="outline-secondary" onClick={this.handleGoHome}>
                      Go Home
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      )
    }

    return this.props.children
  }
}
