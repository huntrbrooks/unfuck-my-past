'use client'

import React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Target, Bot, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'

export default function Home() {
  const [showSafetyAlert, setShowSafetyAlert] = useState(true)

  return (
    <>
      <main>
        {/* Safety Banner */}
        {showSafetyAlert && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This is not therapy. If you're in crisis, 
                  please call 000 (Australia) or Lifeline 13 11 14.
                </p>
              </div>
              <button
                onClick={() => setShowSafetyAlert(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Unfuck Your Past
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  AI-driven self-healing that actually works. No therapy waitlists, 
                  no bullshit. Just raw, honest guidance to help you break free from 
                  what's holding you back.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="text-lg px-8 py-3">
                    <a href="/onboarding">
                      Start Free Assessment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                    <a href="/how-it-works">How It Works</a>
                  </Button>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">What You'll Get</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-gray-700">10-step personalization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-gray-700">AI diagnostic insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-gray-700">Trauma mapping</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-gray-700">30-day healing program</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Approach</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We combine cutting-edge AI with proven therapeutic techniques to create 
                a personalized healing experience that actually works.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4">Personalized Approach</CardTitle>
                  <p className="text-gray-600 leading-relaxed">
                    Your healing journey is unique. We adapt to your tone, 
                    learning style, and comfort level.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4">AI-Powered Insights</CardTitle>
                  <p className="text-gray-600 leading-relaxed">
                    Advanced AI analyzes your responses to provide 
                    deep, actionable insights about your patterns.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4">Proven Results</CardTitle>
                  <p className="text-gray-600 leading-relaxed">
                    Structured 30-day program with journaling, 
                    mood tracking, and measurable progress.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Healing Journey?</h2>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              Join thousands who've already transformed their lives. 
              Start with our free assessment - no commitment required.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-green-600 hover:bg-gray-100">
              <a href="/onboarding">
                Begin Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
