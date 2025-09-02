'use client'

import React from 'react'
import { Onboarding } from '@/onboarding'

export default function OnboardingTestPage() {
  const handleComplete = (payload: Record<string, any>) => {
    console.log('Onboarding completed with:', payload)
    alert('Onboarding completed! Check console for data.')
  }

  const handleChange = (partial: Record<string, any>) => {
    console.log('Onboarding changed:', partial)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">New Onboarding Flow Test</h1>
          <p className="text-gray-600">This is the new config-driven onboarding component</p>
        </div>
        
        <Onboarding 
          onComplete={handleComplete}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}
