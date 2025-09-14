'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Bot, TrendingUp, CheckCircle, Lock, ArrowRight, Sparkles, Heart, Brain, Zap, Shield, BookOpen } from 'lucide-react'
import Image from 'next/image'

export default function HowItWorks() {
  return (
    <div className="min-h-screen-dvh bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <div className="relative mb-6 flex items-center justify-center gap-4 sm:gap-6">
              <div className="animate-float">
                <Image src="/Icon-01.png" alt="left icon" width={48} height={48} className="w-10 h-auto drop-shadow-[0_0_12px_#ff1aff]" />
              </div>
              <h1 className="responsive-heading neon-heading mb-0">How It Works</h1>
              <div className="hidden sm:block animate-float-delayed">
                <Image src="/Icon-01.png" alt="right icon" width={48} height={48} className="w-10 h-auto drop-shadow-[0_0_12px_#ff1aff]" />
              </div>
            </div>
            <p className="responsive-body text-muted-foreground max-w-4xl mx-auto leading-relaxed drop-shadow-[0_0_8px_rgba(99,102,241,0.15)]">
              Your journey to healing is simple, personalized, and proven to work. 
              Here&apos;s how we&apos;ll help you transform your life through AI-powered insights and structured healing.
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold mb-4 text-foreground neon-glow-pink">1. Personalize</CardTitle>
                <p className="text-muted-foreground leading-relaxed">
                  Complete our comprehensive onboarding to customize your experience. 
                  We&apos;ll adapt to your communication style, learning preferences, 
                  and comfort level for a truly personalized journey.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="h-10 w-10 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl font-semibold mb-4 text-foreground neon-glow-cyan">2. Prognose</CardTitle>
                <p className="text-muted-foreground leading-relaxed">
                  Answer 3-10 adaptive questions about your past and patterns. 
                  Our advanced AI analyzes your responses to provide deep, actionable insights 
                  and identify your unique healing path.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold mb-4 text-foreground neon-glow-purple">3. Transform</CardTitle>
                <p className="text-muted-foreground leading-relaxed">
                  Follow your personalized 30-day program with daily tasks, 
                  journaling, and mood tracking. See measurable progress over time 
                  and build lasting positive changes in your life.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What You'll Get Section */}
          <div className="max-w-5xl mx-auto mb-16">
            <Card className="glass-card border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 px-8 py-6">
                <h2 className="text-3xl font-bold text-center neon-heading">What You&apos;ll Get</h2>
              </div>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-12">
                  {/* Free Assessment */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-xl font-semibold text-foreground neon-glow-orange">Free Assessment</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 group">
                        <CheckCircle className="h-5 w-5 text-success group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">10-step personalization</span>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <CheckCircle className="h-5 w-5 text-success group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">3-10 prognostic questions</span>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <CheckCircle className="h-5 w-5 text-success group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">AI-powered insights</span>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <CheckCircle className="h-5 w-5 text-success group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">Trauma mapping preview</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Premium Features */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-xl font-semibold text-foreground neon-glow-blue">Premium Features</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 group">
                        <Lock className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">Full prognostic report</span>
                        <span className="ml-2"></span>
                        <Badge variant="success" className="ml-auto" style={{ backgroundColor: '#ccff00', color: '#0a0a0a' }}>$9.99</Badge>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <Lock className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">30-day healing program</span>
                        <span className="ml-2"></span>
                        <Badge variant="success" className="ml-auto" style={{ backgroundColor: '#ccff00', color: '#0a0a0a' }}>$29.95</Badge>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <Lock className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">Daily journaling & mood tracking</span>
                      </div>
                      <div className="flex items-center gap-3 group">
                        <Lock className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-foreground">Progress analytics</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 neon-heading">Why Choose Our Approach?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We combine cutting-edge AI technology with proven therapeutic principles 
                to create a healing experience that&apos;s both effective and accessible.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="feature-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 neon-glow-red">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced AI analysis provides deep, personalized insights into your patterns and healing needs.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 neon-glow-teal">Safe & Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Your privacy and emotional safety are our top priorities throughout your healing journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 neon-glow-orange">Proven Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Structured approach based on evidence-based therapeutic techniques and real user success stories.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 neon-glow-blue">Comprehensive Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn about trauma, healing, and personal growth through our extensive knowledge base.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 neon-glow-purple">Compassionate Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Experience genuine care and understanding as you navigate your healing journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 neon-glow-pink">Personalized Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    Every aspect of your journey is tailored to your unique needs, preferences, and goals.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-6 py-3 mb-8 border border-accent/30">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              <span className="text-sm text-accent-foreground font-medium">
                Ready to begin your transformation?
              </span>
            </div>
            
            <Button asChild size="lg" variant="cta" className="text-lg px-8 py-4 group">
              <Link href="/onboarding">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
