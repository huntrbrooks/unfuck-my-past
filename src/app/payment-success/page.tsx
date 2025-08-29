'use client'

import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap'
import { useSearchParams, useRouter } from 'next/navigation'
import Navigation from '../../components/Navigation'

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent')
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')

    if (paymentIntentId && paymentIntentClientSecret) {
      // Confirm the payment on our backend
      confirmPayment(paymentIntentId)
    } else {
      setError('Payment confirmation data not found')
      setLoading(false)
    }
  }, [searchParams])

  const confirmPayment = async (paymentIntentId: string) => {
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to confirm payment')
      }

      const result = await response.json()
      setSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        if (result.productType === 'program') {
          router.push('/program')
        } else {
          router.push('/diagnostic/results')
        }
      }, 3000)
    } catch (error) {
      console.error('Payment confirmation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to confirm payment')
    } finally {
      setLoading(false)
    }
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
                  <h3>Confirming your payment...</h3>
                  <p className="text-muted">Please wait while we process your payment.</p>
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
                <Alert.Heading>Payment Error</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={() => router.push('/diagnostic/results')}>
                  Return to Results
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  if (success) {
    return (
      <>
        <Navigation />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="card-shadow border-success">
                <Card.Body className="p-5 text-center">
                  <div className="mb-4">
                    <span className="display-1">✅</span>
                  </div>
                  <h2 className="mb-3">Payment Successful!</h2>
                  <p className="lead mb-4">
                    Thank you for your purchase. You now have access to your selected content.
                  </p>
                  <p className="text-muted">
                    Redirecting you to your content...
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    )
  }

  return null
}
