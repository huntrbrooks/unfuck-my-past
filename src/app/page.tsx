'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, CheckCircle, TrendingUp, Sparkles, AlertTriangle, Target, Heart, Zap } from 'lucide-react'

export default function Home() {
  const [showSafetyAlert, setShowSafetyAlert] = useState(true)

  return (
    <>
      <main className="min-h-screen">
        {/* Safety Banner */}
        {showSafetyAlert && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-b border-yellow-200 dark:border-yellow-800/30 px-4 py-3 animate-slide-in-from-top">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This is not therapy. If you&apos;re in crisis, 
                  please call 000 (Australia) or Lifeline 13 11 14.
                </p>
              </div>
              <button
                onClick={() => setShowSafetyAlert(false)}
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors duration-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 py-20">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge variant="glass" size="lg" className="animate-fade-in">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI-Powered Healing
                  </Badge>
                  <h1 className="responsive-heading font-bold text-gray-900 dark:text-gray-100 animate-fade-in">
                    Unfuck Your Past
                  </h1>
                  <p className="responsive-body text-gray-600 dark:text-gray-300 leading-relaxed animate-fade-in">
                    AI-driven self-healing that actually works. No therapy waitlists, 
                    no bullshit. Just raw, honest guidance to help you break free from 
                    what&apos;s holding you back.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
                  <Button 
                    asChild 
                    size="lg" 
                    className="btn-primary text-lg px-8 py-4 group"
                  >
                    <a href="/onboarding">
                      Start Free Assessment
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg" 
                    className="btn-outline text-lg px-8 py-4 group"
                  >
                    <a href="/how-it-works">
                      How It Works
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Card className="glass-card border-0 p-8 shadow-2xl animate-scale-in">
                  <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    What You&apos;ll Get
                  </CardTitle>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-900/50 transition-all duration-300">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Personalized healing journey</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-900/50 transition-all duration-300">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">AI-powered insights</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-900/50 transition-all duration-300">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Proven results</span>
                    </div>
                  </div>
                </Card>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl animate-float"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-secondary/20 to-muted/20 rounded-full blur-xl animate-float [animation-delay:1s]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="responsive-subheading font-bold text-foreground mb-6">
                Your Journey to Healing
              </h2>
              <p className="responsive-body text-muted-foreground max-w-3xl mx-auto">
                A comprehensive approach to self-discovery and transformation, designed to work with your unique needs and preferences.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="feature-card border-0 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4">1. Personalize</CardTitle>
                  <p className="text-muted-foreground leading-relaxed">
                    Complete our 10-step onboarding to customize your experience. 
                    We&apos;ll adapt to your communication style, learning preferences, 
                    and comfort level.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4">2. Diagnose</CardTitle>
                  <p className="text-muted-foreground leading-relaxed">
                    Answer 3-10 adaptive questions about your past and patterns. 
                    Our AI analyzes your responses to provide deep, actionable insights.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4">3. Transform</CardTitle>
                  <p className="text-muted-foreground leading-relaxed">
                    Follow your personalized 30-day program with daily guidance, 
                    journaling prompts, and progress tracking to build lasting change.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gradient-to-br from-muted/20 to-accent/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="responsive-subheading font-bold text-foreground mb-6">
                Choose Your Path
              </h2>
              <p className="responsive-body text-muted-foreground max-w-3xl mx-auto">
                Start free and unlock deeper insights as you&apos;re ready to commit to your healing journey.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="modern-card border-0 group hover:shadow-xl transition-all duration-500">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl font-semibold mb-4">Free Assessment</CardTitle>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">10-step personalization</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">3-10 diagnostic questions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">AI-powered insights</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">Trauma mapping preview</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full group">
                    <a href="/onboarding">
                      Start Free
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="feature-card border-0 group hover:shadow-xl transition-all duration-500">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl font-semibold mb-4">Premium Features</CardTitle>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-muted-foreground">Full diagnostic report</span>
                      <Badge variant="secondary" className="ml-auto">$10</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-muted-foreground">30-day healing program</span>
                      <Badge variant="secondary" className="ml-auto">$29.95</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-muted-foreground">Progress tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-muted-foreground">Journaling tools</span>
                    </div>
                  </div>
                  <Button asChild className="w-full group">
                    <a href="/onboarding">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
