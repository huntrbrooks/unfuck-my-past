'use client'

import React from 'react'

type ReportGenerationLoaderProps = {
  step: number
  steps: string[]
}

export default function ReportGenerationLoader({ step, steps }: ReportGenerationLoaderProps) {
  const total = steps.length
  const clamped = Math.min(Math.max(step, 1), total)
  const percent = Math.round((clamped / total) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur">
      <div className="glass-card max-w-md w-full border-0 shadow-2xl p-8 text-center rounded-2xl">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full mx-auto glow-box-lime flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-primary/30 spin-slow" />
          </div>
        </div>
        <h3 className="text-xl font-bold key-info neon-heading mb-3">Loading Your Full Diagnostic Report</h3>
        <p className="text-muted-foreground mb-6">{steps[clamped - 1]}</p>
        <div className="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
          <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex justify-center space-x-2 mt-2">
          {Array.from({ length: total }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${idx < clamped ? 'bg-primary' : 'bg-muted-foreground/40'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}


