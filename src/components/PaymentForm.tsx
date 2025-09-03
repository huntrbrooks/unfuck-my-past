'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CreditCard, Shield } from 'lucide-react'

interface PaymentFormProps {
  amount: number
  onSuccess: (paymentIntent: { id: string; amount: number; status: string }) => void
  onCancel: () => void
  productName: string
}

export default function PaymentForm({ amount, onSuccess, onCancel, productName }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    cardNumber: '',
    expiryDate: '',
    cvc: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Format card number with spaces
    if (field === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '')
      if (cleaned.length <= 16) {
        setFormData(prev => ({ ...prev, [field]: cleaned }))
      }
    }

    // Format expiry date
    if (field === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length <= 4) {
        const formatted = cleaned.replace(/(\d{2})(\d{0,2})/, '$1/$2')
        setFormData(prev => ({ ...prev, [field]: formatted }))
      }
    }

    // Format CVC
    if (field === 'cvc') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length <= 4) {
        setFormData(prev => ({ ...prev, [field]: cleaned }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.cardNumber || formData.cardNumber.length < 16) {
      newErrors.cardNumber = 'Valid card number is required'
    }

    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      newErrors.expiryDate = 'Valid expiry date is required'
    }

    if (!formData.cvc || formData.cvc.length < 3) {
      newErrors.cvc = 'Valid CVC is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setLoadingStage('Validating payment details...')

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      setLoadingStage('Processing payment...')
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      setLoadingStage('Confirming transaction...')
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate successful payment
      const mockPaymentIntent = {
        id: 'pi_' + Math.random().toString(36).substr(2, 9),
        amount: amount,
        status: 'succeeded'
      }

      onSuccess(mockPaymentIntent)
    } catch (error) {
      console.error('Payment failed:', error)
      setErrors({ general: 'Payment failed. Please try again.' })
    } finally {
      setLoading(false)
      setLoadingStage('')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl font-semibold">Complete Your Purchase</CardTitle>
        <p className="text-muted-foreground">
          Secure payment for {productName}
        </p>
      </CardHeader>
      
      <CardContent>
        {errors.general && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Cardholder Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`mt-1 ${errors.name ? 'border-destructive focus:ring-destructive' : ''}`}
              required
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cardNumber" className="text-sm font-medium">
              Card Number
            </Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="4242 4242 4242 4242"
              value={formData.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
              onChange={(e) => handleFieldChange('cardNumber', e.target.value)}
              maxLength={19}
              className={`mt-1 ${errors.cardNumber ? 'border-destructive focus:ring-destructive' : ''}`}
              required
            />
            {errors.cardNumber && (
              <p className="text-destructive text-sm mt-1">{errors.cardNumber}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1">
              For testing, use: 4242 4242 4242 4242
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate" className="text-sm font-medium">
                Expiry Date
              </Label>
              <Input
                id="expiryDate"
                type="text"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                maxLength={5}
                className={`mt-1 ${errors.expiryDate ? 'border-destructive focus:ring-destructive' : ''}`}
                required
              />
              {errors.expiryDate && (
                <p className="text-destructive text-sm mt-1">{errors.expiryDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cvc" className="text-sm font-medium">
                CVC
              </Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                value={formData.cvc}
                onChange={(e) => handleFieldChange('cvc', e.target.value)}
                maxLength={4}
                className={`mt-1 ${errors.cvc ? 'border-destructive focus:ring-destructive' : ''}`}
                required
              />
              {errors.cvc && (
                <p className="text-destructive text-sm mt-1">{errors.cvc}</p>
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

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Test Mode</span>
          </div>
          <p className="text-muted-foreground text-xs">
            This is a simplified payment form for testing. 
            Use test card number 4242 4242 4242 4242 with any future expiry date and CVC.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
