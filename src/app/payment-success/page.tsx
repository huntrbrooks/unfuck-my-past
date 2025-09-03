'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Home, User, Sparkles, Heart, Brain } from 'lucide-react'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card variant="glass" className="border-0 shadow-2xl overflow-hidden">
          <CardHeader className="pb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-success/20 to-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-6 text-lg">
                Thank you for your purchase! Your payment has been processed successfully.
              </p>
              
              {purchaseDetails && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-success mb-3 text-lg">
                    Purchase Details
                  </h3>
                  <div className="text-sm text-success/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Product:</span>
                      <span className="font-medium">
                        {purchaseDetails.product === 'diagnostic' ? 'Full Diagnostic Report' : '30-Day Healing Program'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">${purchaseDetails.amount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Date:</span>
                      <span className="font-medium">{new Date(purchaseDetails.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Button 
                  onClick={handleContinue}
                  variant="primary"
                  size="lg"
                  className="w-full h-14 text-lg flex items-center gap-3 group hover:scale-105 transition-transform duration-200"
                >
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  {purchaseDetails?.product === 'diagnostic' 
                    ? 'View Your Diagnostic Report' 
                    : 'Start Your Healing Program'
                  }
                </Button>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleGoToDashboard}
                    variant="outline"
                    size="lg"
                    className="h-12 flex items-center gap-2 group hover:scale-105 transition-transform duration-200"
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                  
                  <Button 
                    onClick={handleGoHome}
                    variant="outline"
                    size="lg"
                    className="h-12 flex items-center gap-2 group hover:scale-105 transition-transform duration-200"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-6">
              <div className="text-sm text-muted-foreground space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-medium text-foreground">
                    What's next?
                  </p>
                </div>
                <p>
                  You now have full access to your personalized content.
                </p>
                {purchaseDetails?.product === 'diagnostic' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Diagnostic Report</span>
                    </div>
                    <p className="text-sm">
                      Your comprehensive diagnostic report includes detailed insights about your patterns, 
                      strengths, and personalized healing recommendations.
                    </p>
                  </div>
                )}
                {purchaseDetails?.product === 'program' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Healing Program</span>
                    </div>
                    <p className="text-sm">
                      Your 30-day healing program has been tailored specifically to your needs and 
                      is ready to guide you through your healing journey.
                    </p>
                  </div>
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
