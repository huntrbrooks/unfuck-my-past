'use client'

import React, { useState, useEffect } from 'react'
import { Button, Alert, Spinner, Card, Form } from 'react-bootstrap'

interface PaymentFormProps {
  productType: 'diagnostic' | 'program'
  amount: number
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentForm({ productType, amount, onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!cardNumber || !expiryDate || !cvc || !name) {
      setError('Please fill in all payment details')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Creating payment intent...')
      
      // Create payment intent
      const createResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productType }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const { clientSecret, paymentIntentId } = await createResponse.json()
      console.log('Payment intent created:', paymentIntentId)

      // For testing purposes, we'll simulate a successful payment
      // In production, you'd use Stripe's confirmPayment with the actual card details
      console.log('Simulating successful payment...')
      
      // Confirm the payment
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json()
        throw new Error(errorData.error || 'Failed to confirm payment')
      }

      console.log('Payment confirmed successfully')
      onSuccess()
      
    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="payment-form-card">
      <Card.Header className="payment-header">
        <h4 className="mb-0">
          {productType === 'diagnostic' ? 'Full Diagnostic Report' : '30-Day Healing Program'}
        </h4>
      </Card.Header>
      <Card.Body className="payment-body">
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Total Amount</h5>
            <h4 className="mb-0 text-primary-custom">{formatAmount(amount)}</h4>
          </div>
          <p className="text-muted mb-0">
            {productType === 'diagnostic' 
              ? 'Complete trauma mapping, detailed pattern analysis, and personalized recommendations'
              : 'Complete 30-day structured healing program with daily tasks, journaling, and AI guidance'
            }
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3 alert-custom">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Cardholder Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-control-custom"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Card Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
              maxLength={16}
              required
              className="form-control-custom"
            />
            <Form.Text className="text-muted">
              For testing, use: 4242 4242 4242 4242
            </Form.Text>
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Expiry Date</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  maxLength={5}
                  required
                  className="form-control-custom"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>CVC</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={4}
                  required
                  className="form-control-custom"
                />
              </Form.Group>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <Button
              variant="outline-secondary"
              onClick={onCancel}
              disabled={loading}
              className="flex-fill"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-fill"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                `Pay ${formatAmount(amount)}`
              )}
            </Button>
          </div>
        </Form>

        <div className="mt-3">
          <small className="text-muted">
            <strong>Test Mode:</strong> This is a simplified payment form for testing. 
            Use test card number 4242 4242 4242 4242 with any future expiry date and CVC.
          </small>
        </div>
      </Card.Body>
    </Card>
  )
}
