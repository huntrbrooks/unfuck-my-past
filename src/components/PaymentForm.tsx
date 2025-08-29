'use client'

import React, { useState, useEffect } from 'react'
import { Button, Alert, Spinner, Card, Form } from 'react-bootstrap'
import { validateObject, sanitizeObject, PAYMENT_SCHEMA, PATTERNS } from '../lib/validation'

interface PaymentFormProps {
  productType: 'diagnostic' | 'program'
  amount: number
  onSuccess: () => void
  onCancel: () => void
}

interface FormErrors {
  [key: string]: string
}

export default function PaymentForm({ productType, amount, onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  // Real-time validation
  const validateField = (fieldName: string, value: string) => {
    const fieldErrors: FormErrors = { ...errors }
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          fieldErrors.name = 'Name is required'
        } else if (!PATTERNS.NAME.test(value.trim())) {
          fieldErrors.name = 'Please enter a valid name (2-50 characters, letters only)'
        } else {
          delete fieldErrors.name
        }
        break
        
      case 'cardNumber':
        if (!value.trim()) {
          fieldErrors.cardNumber = 'Card number is required'
        } else if (!PATTERNS.CARD_NUMBER.test(value.replace(/\s/g, ''))) {
          fieldErrors.cardNumber = 'Please enter a valid 16-digit card number'
        } else {
          delete fieldErrors.cardNumber
        }
        break
        
      case 'expiryDate':
        if (!value.trim()) {
          fieldErrors.expiryDate = 'Expiry date is required'
        } else if (!PATTERNS.EXPIRY_DATE.test(value)) {
          fieldErrors.expiryDate = 'Please enter expiry date in MM/YY format'
        } else {
          // Check if card is expired
          const [month, year] = value.split('/')
          const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
          const now = new Date()
          if (expiryDate < now) {
            fieldErrors.expiryDate = 'Card has expired'
          } else {
            delete fieldErrors.expiryDate
          }
        }
        break
        
      case 'cvc':
        if (!value.trim()) {
          fieldErrors.cvc = 'CVC is required'
        } else if (!PATTERNS.CVC.test(value)) {
          fieldErrors.cvc = 'Please enter a valid 3-4 digit CVC'
        } else {
          delete fieldErrors.cvc
        }
        break
    }
    
    setErrors(fieldErrors)
    return Object.keys(fieldErrors).length === 0
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    // Update the field value
    switch (fieldName) {
      case 'name':
        setName(value)
        break
      case 'cardNumber':
        setCardNumber(value.replace(/\s/g, ''))
        break
      case 'expiryDate':
        setExpiryDate(value)
        break
      case 'cvc':
        setCvc(value)
        break
    }
    
    // Validate the field
    validateField(fieldName, value)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    // Validate all fields
    const allValid = ['name', 'cardNumber', 'expiryDate', 'cvc'].every(field => {
      const value = field === 'name' ? name : 
                   field === 'cardNumber' ? cardNumber :
                   field === 'expiryDate' ? expiryDate : cvc
      return validateField(field, value)
    })

    if (!allValid) {
      setError('Please fix the errors above before submitting')
      return
    }

    // Prepare form data
    const formData = {
      name: name.trim(),
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate: expiryDate.trim(),
      cvc: cvc.trim(),
      productType
    }

    // Server-side validation
    const validation = validateObject(formData, PAYMENT_SCHEMA)
    if (!validation.isValid) {
      setError(`Validation failed: ${validation.errors.join(', ')}`)
      return
    }

    setLoading(true)

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
              onChange={(e) => handleFieldChange('name', e.target.value)}
              isInvalid={!!errors.name}
              required
              className="form-control-custom"
            />
            <Form.Control.Feedback type="invalid">
              {errors.name}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Card Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
              onChange={(e) => handleFieldChange('cardNumber', e.target.value)}
              maxLength={19}
              isInvalid={!!errors.cardNumber}
              required
              className="form-control-custom"
            />
            <Form.Control.Feedback type="invalid">
              {errors.cardNumber}
            </Form.Control.Feedback>
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
                  onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                  maxLength={5}
                  isInvalid={!!errors.expiryDate}
                  required
                  className="form-control-custom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.expiryDate}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>CVC</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => handleFieldChange('cvc', e.target.value)}
                  maxLength={4}
                  isInvalid={!!errors.cvc}
                  required
                  className="form-control-custom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.cvc}
                </Form.Control.Feedback>
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
              disabled={loading || Object.keys(errors).length > 0}
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
