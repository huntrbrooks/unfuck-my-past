'use client'

import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { analytics } from '../lib/analytics'
import { performanceMonitor } from '../lib/performance'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user, isLoaded } = useUser()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded) {
      // Initialize analytics with user ID if available
      analytics.initialize(user?.id)
      // Initialize performance monitoring
      performanceMonitor.initialize()
    }
  }, [isLoaded, user?.id])

  useEffect(() => {
    if (isLoaded && pathname) {
      // Track page view
      const title = document.title || 'Unfuck Your Past'
      analytics.trackPageView(pathname, title)
    }
  }, [pathname, isLoaded])

  return <>{children}</>
}
