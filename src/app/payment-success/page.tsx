'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Home, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function PaymentSuccess() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      loadPurchaseDetails()
    }
  }, [isLoaded, user])

  const loadPurchaseDetails = async () => {
    try {
      const response = await fetch('/api/payments/user-purchases')
      if (response.ok) {
        const data = await response.json()
        // Get the most recent purchase
        const recentPurchase = data.purchases?.[0]
        setPurchaseDetails(recentPurchase)
      }
    } catch (error) {
      console.error('Error loading purchase details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (purchaseDetails?.product === 'diagnostic') {
      router.push('/dashboard')
    } else if (purchaseDetails?.product === 'program') {
      router.push('/program')
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Thank you for your purchase! Your payment has been processed successfully.
              </p>
              
              {purchaseDetails && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Purchase Details
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Product:</strong> {purchaseDetails.product === 'diagnostic' ? 'Full Diagnostic Report' : '30-Day Healing Program'}</p>
                    <p><strong>Amount:</strong> ${purchaseDetails.amount}</p>
                    <p><strong>Date:</strong> {new Date(purchaseDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Button 
                  onClick={handleContinue}
                  className="w-full h-12 text-lg flex items-center gap-3"
                >
                  <ArrowRight className="h-5 w-5" />
                  {purchaseDetails?.product === 'diagnostic' 
                    ? 'View Your Diagnostic Report' 
                    : 'Start Your Healing Program'
                  }
                </Button>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleGoToDashboard}
                    variant="outline"
                    className="h-12 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                  
                  <Button 
                    onClick={handleGoHome}
                    variant="outline"
                    className="h-12 flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="text-sm text-gray-500 space-y-2">
                <p>
                  <strong>What's next?</strong> You now have full access to your personalized content.
                </p>
                {purchaseDetails?.product === 'diagnostic' && (
                  <p>
                    Your comprehensive diagnostic report includes detailed insights about your patterns, 
                    strengths, and personalized healing recommendations.
                  </p>
                )}
                {purchaseDetails?.product === 'program' && (
                  <p>
                    Your 30-day healing program has been tailored specifically to your needs and 
                    is ready to guide you through your healing journey.
                  </p>
                )}
                <p>
                  If you have any questions or need support, please don't hesitate to reach out.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
