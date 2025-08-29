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

// Load Stripe with proper error handling
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!).catch((error) => {
  console.error('Failed to load Stripe:', error)
  return null
})

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
      console.log('Submitting payment...')
      const { error: submitError } = await elements.submit()
      if (submitError) {
        console.error('Submit error:', submitError)
        setError(submitError.message || 'Payment failed')
        setLoading(false)
        return
      }

      console.log('Payment submitted, confirming...')
      // Confirm payment with existing client secret
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      })

      if (confirmError) {
        console.error('Confirm error:', confirmError)
        setError(confirmError.message || 'Payment failed')
        setLoading(false)
        return
      }

      console.log('Payment confirmed successfully')
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

          <div className="mb-3">
            <PaymentElement />
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
  const [stripeLoaded, setStripeLoaded] = useState(false)

  useEffect(() => {
    console.log('PaymentForm mounted, checking Stripe...')
    console.log('Publishable key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + '...')
    
    // Check if Stripe is loaded
    stripePromise.then((stripe) => {
      console.log('Stripe loaded:', !!stripe)
      if (stripe) {
        setStripeLoaded(true)
      } else {
        setError('Failed to load payment system')
      }
    }).catch((error) => {
      console.error('Stripe loading error:', error)
      setError('Failed to load payment system')
    })
  }, [])

  useEffect(() => {
    if (!stripeLoaded) {
      console.log('Stripe not loaded yet, skipping payment intent creation')
      return
    }

    console.log('Stripe loaded, creating payment intent...')
    // Create payment intent when component mounts and Stripe is loaded
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
  }, [props.productType, stripeLoaded])

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

  if (!stripeLoaded || !clientSecret) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">
          {!stripeLoaded ? 'Loading payment system...' : 'Creating payment form...'}
        </p>
      </div>
    )
  }

  console.log('Rendering Elements with client secret:', clientSecret.substring(0, 20) + '...')
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
