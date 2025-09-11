'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, CheckCircle, TrendingUp, Sparkles, AlertTriangle, Target, Heart, Zap, Brain, Shield, BookOpen, Lock } from 'lucide-react'

export default function Home() {
  const [showSafetyAlert, setShowSafetyAlert] = useState(true)

  return (
    <>
      <main className="min-h-screen-dvh bg-background">
        {/* Safety Banner (moved below bottom CTA) */}

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background min-h-screen-dvh">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center pt-8 sm:pt-10 lg:pt-10 pb-10 space-y-8 sm:space-y-10">
            {/* Edgy graphic hero */}
            <div>
              <div className="rounded-none overflow-visible shadow-none border-0 bg-transparent w-full md:max-w-2xl lg:max-w-3xl mx-auto">
                {/* Place the image file at public/edgy-hero.png */}
                <Image
                  src="/edgy-hero.png?v=4"
                  alt="Unfuck My Past"
                  width={1600}
                  height={900}
                  priority
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Tagline under hero */}
            <p className="text-center mx-auto max-w-4xl text-muted-foreground leading-relaxed px-2 text-base sm:text-lg">
              AI-driven self-healing that actually works. No therapy waitlists, no bullshit.
            </p>

            {/* Primary CTA under hero (centered) */}
            <div className="flex items-center justify-center">
              <Button asChild size="lg" className="group neon-cta text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4">
                <Link href="/onboarding">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </Button>
            </div>
            {/* Safety Banner placed directly under the first CTA */}
            {showSafetyAlert && (
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-5 sm:py-3 rounded-xl border border-red-500/30 shadow-[0_0_24px_rgba(239,68,68,0.55)] bg-background/90">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <p className="text-xs sm:text-sm text-foreground text-center">
                    <strong>Important:</strong> This is not therapy. If you&apos;re in crisis, please call 000 (Australia) or Lifeline 13 11 14.
                  </p>
                  <button
                    onClick={() => setShowSafetyAlert(false)}
                    className="ml-2 sm:ml-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    aria-label="Dismiss safety notice"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Process Steps */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <Card className="feature-card border-0 hover:-translate-y-1 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-9 w-9 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4 text-foreground neon-glow-pink">1. Personalize</CardTitle>
                  <p className="text-muted-foreground leading-relaxed">
                    Complete our comprehensive onboarding to customize your experience. 
                    We&apos;ll adapt to your communication style, learning preferences, 
                    and comfort level for a truly personalized journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 hover:-translate-y-1 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Bot className="h-9 w-9 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-4 text-foreground neon-glow-cyan">2. Diagnose</CardTitle>
                  <p className="text-muted-foreground leading-relaxed">
                    Answer 3-10 adaptive questions about your past and patterns. 
                    Our advanced AI analyzes your responses to provide deep, actionable insights 
                    and identify your unique healing path.
                  </p>
                </CardContent>
              </Card>

              <Card className="feature-card border-0 hover:-translate-y-1 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-9 w-9 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
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
              <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-black">
                <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-border/50 px-8 py-6">
                  <h2 className="text-3xl font-bold text-center neon-heading">What You&apos;ll Get</h2>
                </div>
                <CardContent className="p-8 bg-white dark:bg-black">
                  <div className="grid md:grid-cols-2 gap-12">
                    {/* Free Assessment */}
                    <div className="space-y-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-foreground neon-glow-orange">Free Assessment</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <CheckCircle className="h-5 w-5 icon-line group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #ccff00)' }} />
                          </span>
                          <span className="text-foreground">10-step personalization</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <CheckCircle className="h-5 w-5 icon-line group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #ccff00)' }} />
                          </span>
                          <span className="text-foreground">3-10 diagnostic questions</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <CheckCircle className="h-5 w-5 icon-line group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #ccff00)' }} />
                          </span>
                          <span className="text-foreground">AI-powered insights</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <CheckCircle className="h-5 w-5 icon-line group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #ccff00)' }} />
                          </span>
                          <span className="text-foreground">Trauma mapping preview</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Premium Features */}
                    <div className="space-y-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-foreground neon-glow-blue">Premium Features</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <Lock className="h-5 w-5 text-black dark:text-white group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #ff1aff)' }} />
                          </span>
                          <span className="text-foreground">Full diagnostic report</span>
                          <span className="ml-2"></span>
                          <Badge className="ml-auto" style={{ backgroundColor: '#ccff00', color: '#000000' }}>$9.99</Badge>
                        </div>
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <Lock className="h-5 w-5 text-black dark:text-white group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }} />
                          </span>
                          <span className="text-foreground">30-day healing program</span>
                          <span className="ml-2"></span>
                          <Badge className="ml-auto" style={{ backgroundColor: '#ccff00', color: '#000000' }}>$29.95</Badge>
                        </div>
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <Lock className="h-5 w-5 text-black dark:text-white group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }} />
                          </span>
                          <span className="text-foreground">Daily journaling & mood tracking</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                          <span className="w-6 flex justify-center">
                            <Lock className="h-5 w-5 text-black dark:text-white group-hover:scale-110 transition-transform duration-200" style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }} />
                          </span>
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
                      <Brain className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ccff00)' }} />
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
                      <Shield className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
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
                      <Zap className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ff6600)' }} />
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
                      <BookOpen className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #ff1aff)' }} />
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
                      <Heart className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
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
                      <Sparkles className="h-8 w-8 text-black dark:text-white" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 neon-glow-pink">Personalized Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      Every aspect of your journey is tailored to your unique needs, preferences, and goals.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom CTA Section */}
            <div className="text-center mt-10">
              <p className="text-lg text-foreground font-medium mb-6">
                Ready to begin your transformation?
              </p>
              
              <div className="flex items-center justify-center">
                <Button asChild size="lg" className="text-lg px-8 py-4 group neon-cta">
                  <Link href="/onboarding">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </section>
      </main>
    </>
  )
}