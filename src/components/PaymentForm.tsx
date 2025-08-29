'use client'

import React, { useState, useEffect } from 'react'
import { Button, Alert, Spinner, Card } from 'react-bootstrap'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  productType: 'diagnostic' | 'program'
  amount: number
  onSuccess: () => void
  onCancel: () => void
}

function CheckoutForm({ productType, amount, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setLoading(false)
        return
      }

      // Confirm payment with existing client secret
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setLoading(false)
        return
      }

      // Payment succeeded
      onSuccess()
    } catch (error) {
      console.error('Payment error:', error)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            {productType === 'diagnostic' ? 'Full Diagnostic Report' : '30-Day Healing Program'}
          </h4>
        </Card.Header>
        <Card.Body className="p-4">
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Total Amount</h5>
              <h4 className="mb-0 text-primary">{formatAmount(amount)}</h4>
            </div>
            <p className="text-muted mb-0">
              {productType === 'diagnostic' 
                ? 'Complete trauma mapping, detailed pattern analysis, and personalized recommendations'
                : 'Complete 30-day structured healing program with daily tasks, journaling, and AI guidance'
              }
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <PaymentElement />

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
              disabled={!stripe || loading}
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
        </Card.Body>
      </Card>
    </form>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Create payment intent when component mounts
    const createIntent = async () => {
      try {
        setError('')
        console.log('Creating payment intent for:', props.productType)
        
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productType: props.productType }),
        })

        console.log('Payment intent response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Payment intent error:', errorData)
          throw new Error(errorData.error || 'Failed to create payment intent')
        }

        const data = await response.json()
        console.log('Payment intent created successfully:', data)
        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error('Error creating payment intent:', error)
        setError(error instanceof Error ? error.message : 'Failed to load payment form')
      }
    }

    createIntent()
  }, [props.productType])

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger">
          <Alert.Heading>Payment Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading payment form...</p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
