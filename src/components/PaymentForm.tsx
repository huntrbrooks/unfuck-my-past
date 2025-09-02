'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react'
import { validateObject, sanitizeObject, PAYMENT_SCHEMA, PATTERNS } from '../lib/validation'

interface PaymentFormProps {
  productType: 'diagnostic' | 'program'
  amount: number
  onSuccess: () => void
  onCancel: () => void
  onLoadingComplete?: () => void
  setPaymentFormLoading?: (loading: boolean) => void
}

interface FormErrors {
  [key: string]: string
}

export default function PaymentForm({ productType, amount, onSuccess, onCancel, onLoadingComplete, setPaymentFormLoading }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
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
    setPaymentFormLoading?.(true)
    setLoadingStage('Creating payment...')

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
        console.error('Payment intent creation failed:', errorData)
        if (createResponse.status === 401) {
          throw new Error('Authentication required. Please refresh the page and try again.')
        }
        throw new Error(errorData.error || 'Failed to create payment. Please try again.')
      }

      const { clientSecret, paymentIntentId } = await createResponse.json()
      console.log('Payment intent created:', paymentIntentId)

      setLoadingStage('Processing payment...')

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
        console.error('Payment confirmation failed:', errorData)
        throw new Error(errorData.error || 'Failed to confirm payment. Please try again.')
      }

      console.log('Payment confirmed successfully')
      
      if (productType === 'diagnostic') {
        setLoadingStage('Generating your comprehensive report...')
        // Call onSuccess to trigger report generation
        // The onSuccess callback will handle clearing the loading state when complete
        onSuccess()
      } else {
        setLoadingStage('Preparing your 30-day program...')
        // For program, we can complete immediately
        onSuccess()
        setLoading(false)
        setPaymentFormLoading?.(false)
        setLoadingStage('')
      }
      
    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
      setPaymentFormLoading?.(false)
      setLoadingStage('')
    }
  }

  return (
    <Card className="max-w-md mx-auto relative">
      {loading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Payment</h3>
            <p className="text-gray-600 mb-4">{loadingStage}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {productType === 'diagnostic' ? 'Full Diagnostic Report' : '30-Day Healing Program'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-semibold">Total Amount</h5>
            <h4 className="text-green-600 font-bold">{formatAmount(amount)}</h4>
          </div>
          <p className="text-gray-600 text-sm">
            {productType === 'diagnostic' 
              ? 'Complete trauma mapping, detailed pattern analysis, and personalized recommendations'
              : 'Complete 30-day structured healing program with daily tasks, journaling, and AI guidance'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
              onChange={(e) => handleFieldChange('cardNumber', e.target.value)}
              maxLength={19}
              className={errors.cardNumber ? 'border-red-500' : ''}
              required
            />
            {errors.cardNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              For testing, use: 4242 4242 4242 4242
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                maxLength={5}
                className={errors.expiryDate ? 'border-red-500' : ''}
                required
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                value={cvc}
                onChange={(e) => handleFieldChange('cvc', e.target.value)}
                maxLength={4}
                className={errors.cvc ? 'border-red-500' : ''}
                required
              />
              {errors.cvc && (
                <p className="text-red-500 text-sm mt-1">{errors.cvc}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {loadingStage || 'Processing...'}
                </>
              ) : (
                `Pay ${formatAmount(amount)}`
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <p className="text-gray-500 text-xs">
            <strong>Test Mode:</strong> This is a simplified payment form for testing. 
            Use test card number 4242 4242 4242 4242 with any future expiry date and CVC.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
