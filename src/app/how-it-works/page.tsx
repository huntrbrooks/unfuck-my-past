'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Bot, TrendingUp, CheckCircle, Lock, ArrowRight } from 'lucide-react'

export default function HowItWorks() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">How It Works</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your journey to healing is simple, personalized, and proven to work. 
              Here's how we'll help you transform your life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold mb-4">1. Personalize</CardTitle>
                <p className="text-gray-600 leading-relaxed">
                  Complete our 10-step onboarding to customize your experience. 
                  We'll adapt to your communication style, learning preferences, 
                  and comfort level.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold mb-4">2. Diagnose</CardTitle>
                <p className="text-gray-600 leading-relaxed">
                  Answer 3-10 adaptive questions about your past and patterns. 
                  Our AI analyzes your responses to provide deep, actionable insights.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold mb-4">3. Transform</CardTitle>
                <p className="text-gray-600 leading-relaxed">
                  Follow your personalized 30-day program with daily tasks, 
                  journaling, and mood tracking. See measurable progress over time.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What You'll Get</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Free Assessment
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-gray-700">10-step personalization</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-gray-700">3-10 diagnostic questions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-gray-700">AI-powered insights</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-gray-700">Trauma mapping preview</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      Premium Features
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-700">Full diagnostic report <Badge variant="secondary" className="ml-2">$10</Badge></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-700">30-day healing program <Badge variant="secondary" className="ml-2">$29.95</Badge></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-700">Daily journaling & mood tracking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-700">Progress analytics</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <a href="/onboarding">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
