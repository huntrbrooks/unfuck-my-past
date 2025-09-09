'use client'

import React from 'react'
import Image from 'next/image'
// Use static import to guarantee the desired asset is used
// and bypass any stale string-based image references
import heartArt from '../../public/Lineartneon-03.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface DiagnosticCompletionPromptProps {
  poeticMessage?: string
  onContinue: () => void
}

export default function DiagnosticCompletionPrompt({ 
  poeticMessage, 
  onContinue 
}: DiagnosticCompletionPromptProps) {
  const defaultMessage = `Your story speaks of resilience forged in fire,
Of wounds that became wisdom, pain that became power.
In the depths of your answers, we see the warrior—
One who has walked through darkness and emerged stronger.

The patterns are clear, the path is illuminated.
Your past has shaped you, but it does not define you.
What lies ahead is transformation beyond measure,
A journey from survival to truly thriving.`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 dark:bg-black/90 backdrop-blur-sm">
      <Card className="max-w-2xl w-full border-0 shadow-xl mx-6 overflow-hidden bg-white/80 dark:bg-neutral-950/90 backdrop-blur-xl border border-border/30 dark:border-neutral-800">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <div className="relative">
              <Image 
                src={heartArt}
                alt="completion art" 
                width={80} 
                height={80} 
                className="w-16 sm:w-20 h-auto drop-shadow-[0_0_18px_#22c55e] animate-float" 
              />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold key-info neon-heading [text-shadow:0_0_28px_rgba(204,255,0,0.9),0_0_56px_rgba(204,255,0,0.6),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)] [-webkit-text-stroke:1px_rgba(0,0,0,0.25)]">
            Thank You for Your Support!
          </h2>

          {/* Poetic Message */}
          <div className="rounded-lg p-6 border bg-muted/10 dark:bg-neutral-900/70 border-border/30 dark:border-neutral-800/60">
            <div className="text-foreground leading-relaxed space-y-3">
              {(poeticMessage || defaultMessage).split('\n').map((line, index) => (
                <p key={index} className={line.trim() === '' ? 'h-2' : 'text-base italic'}>
                  {line.trim()}
                </p>
              ))}
            </div>
          </div>

          {/* Success indicator */}
          <div className="flex items-center justify-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Your full diagnostic report is ready</span>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onContinue}
            className="w-full neon-cta text-lg py-6 mt-6"
            size="lg"
          >
            View Your Full Report
          </Button>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm">
            Your personalized results and insights await
          </p>
        </CardContent>
      </Card>
    </div>
  )
}



