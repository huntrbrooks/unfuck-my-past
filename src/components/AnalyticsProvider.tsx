'use client'

import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { analytics } from '../lib/analytics'
import { performanceMonitor } from '../lib/performance'
import { useEffect, useRef } from 'react'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user, isLoaded } = useUser()
  const pathname = usePathname()
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isLoaded) {
      // Initialize analytics with user ID if available
      analytics.initialize(user?.id)
      // Initialize performance monitoring
      performanceMonitor.initialize()

      // Heartbeat every 30s while tab is visible
      const sendHeartbeat = () => analytics.trackEvent('heartbeat', { path: window.location.pathname })
      if (!heartbeatRef.current) {
        heartbeatRef.current = setInterval(() => {
          if (document.visibilityState === 'visible') sendHeartbeat()
        }, 30000)
      }

      const onVisibility = () => {
        if (document.visibilityState === 'hidden') {
          analytics.trackEvent('session_pause', { path: window.location.pathname })
        } else {
          analytics.trackEvent('session_resume', { path: window.location.pathname })
        }
      }
      document.addEventListener('visibilitychange', onVisibility)

      const onBeforeUnload = () => {
        try { navigator.sendBeacon?.('/api/analytics', new Blob([JSON.stringify({ event: 'session_end', properties: { path: window.location.pathname } })], { type: 'application/json' })) } catch {}
      }
      window.addEventListener('beforeunload', onBeforeUnload)

      return () => {
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('beforeunload', onBeforeUnload)
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
      }
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
