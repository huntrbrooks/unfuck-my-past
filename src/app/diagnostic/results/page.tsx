'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Container, Row, Col, Card, Button, Alert, Badge, Modal, Spinner } from 'react-bootstrap'
import { useSearchParams, useRouter } from 'next/navigation'
import Navigation from '../../../components/Navigation'
import PaymentForm from '../../../components/PaymentForm'

function DiagnosticResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const summary = searchParams.get('summary')
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentType, setPaymentType] = useState<'diagnostic' | 'program' | null>(null)
  const [userPurchases, setUserPurchases] = useState<string[]>([])

  useEffect(() => {
    // Check user's existing purchases
    checkUserPurchases()
  }, [])

  const checkUserPurchases = async () => {
    try {
      const response = await fetch('/api/payments/user-purchases')
      if (response.ok) {
        const purchases = await response.json()
        // Extract product names from the purchases array
        const productNames = Array.isArray(purchases) ? purchases.map((p: any) => p.product) : []
        setUserPurchases(productNames)
      }
    } catch (error) {
      console.error('Error checking purchases:', error)
    }
  }

  const handlePurchase = (type: 'diagnostic' | 'program') => {
    setPaymentType(type)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false)
    setLoading(true)
    
    // Refresh user purchases
    await checkUserPurchases()
    
    // Redirect based on what was purchased
    if (paymentType === 'program') {
      router.push('/program')
    } else {
      // For diagnostic, stay on results page but show full report
      router.refresh()
    }
    
    setLoading(false)
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setPaymentType(null)
  }

  const hasDiagnosticAccess = userPurchases.includes('diagnostic')
  const hasProgramAccess = userPurchases.includes('program')

  if (!summary) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="warning" className="alert-custom">
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
            <Card className="card-shadow mb-5">
              <Card.Header className="payment-header">
                <h3 className="h4 mb-0">AI-Powered Analysis</h3>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Badge bg="info" className="me-2 badge-custom">GPT-4 Analysis</Badge>
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
                <Card className="h-100 card-shadow">
                  <Card.Body className="p-4 text-center">
                    <div className="feature-icon feature-icon-warning">
                      <span className="fs-4">📋</span>
                    </div>
                    <h4 className="h5 mb-3">Full Diagnostic Report</h4>
                    <p className="text-muted mb-3">
                      Get your complete trauma mapping, detailed pattern analysis, and personalized recommendations.
                    </p>
                    <div className="mb-3">
                      <span className="h4 text-primary-custom">$10</span>
                      <small className="text-muted d-block">One-time purchase</small>
                    </div>
                    {hasDiagnosticAccess ? (
                      <Button variant="success" size="lg" className="w-100" disabled>
                        ✅ Already Purchased
                      </Button>
                    ) : (
                      <Button 
                        variant="outline-primary" 
                        size="lg" 
                        className="w-100"
                        onClick={() => handlePurchase('diagnostic')}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Get Full Report'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} className="mb-4">
                <Card className="h-100 card-shadow border-primary-custom">
                  <Card.Body className="p-4 text-center">
                    <div className="feature-icon feature-icon-primary">
                      <span className="fs-4">🚀</span>
                    </div>
                    <h4 className="h5 mb-3">30-Day Healing Program</h4>
                    <p className="text-muted mb-3">
                      Daily tasks, journaling prompts, mood tracking, and AI-powered guidance to transform your life.
                    </p>
                    <div className="mb-3">
                      <span className="h4 text-primary-custom">$29.95</span>
                      <small className="text-muted d-block">Complete program</small>
                    </div>
                    {hasProgramAccess ? (
                      <Button variant="success" size="lg" className="w-100" href="/program">
                        ✅ Access Program
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        size="lg" 
                        className="w-100"
                        onClick={() => handlePurchase('program')}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Start Healing Journey'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* What's Included */}
            <Card className="card-shadow mb-5">
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
            <Alert variant="info" className="alert-custom">
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

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={handlePaymentCancel} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {paymentType === 'diagnostic' ? 'Purchase Diagnostic Report' : 'Purchase 30-Day Program'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {paymentType && (
            <PaymentForm
              productType={paymentType}
              amount={paymentType === 'diagnostic' ? 1000 : 2995}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}

export default function DiagnosticResults() {
  return (
    <Suspense fallback={
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="card-shadow">
                <Card.Body className="p-5 text-center loading-spinner">
                  <Spinner animation="border" className="mb-3" />
                  <h3>Loading results...</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    }>
      <DiagnosticResultsContent />
    </Suspense>
  )
}
