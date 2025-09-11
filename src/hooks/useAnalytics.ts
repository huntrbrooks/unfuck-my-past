import { useEffect, useState } from 'react'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
}

export function useAnalytics() {
  const track = (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      // PostHog integration
      if ((window as any).posthog) {
        (window as any).posthog.capture(event, properties)
      }
      
      // Google Analytics integration
      if ((window as any).gtag) {
        (window as any).gtag('event', event, properties)
      }
      
      // Console log for development
      console.log('Analytics Event:', event, properties)
    }
  }

  return { track }
}

// A/B Testing Hook
export function useABTest(testName: string, variants: string[]) {
  const [variant, setVariant] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `ab_test_${testName}`
      let selectedVariant = localStorage.getItem(storageKey)
      
      if (!selectedVariant) {
        // Randomly assign variant
        selectedVariant = variants[Math.floor(Math.random() * variants.length)]
        localStorage.setItem(storageKey, selectedVariant)
      }
      
      setVariant(selectedVariant)
    }
  }, [testName, variants])

  return variant
}

// Preview-specific analytics hook
export function usePreviewAnalytics() {
  const { track } = useAnalytics()

  const trackPreviewGenerated = (preview: any) => {
    track('preview_generated', {
      tone: preview.meta?.tone,
      rawness: preview.meta?.rawness,
      depth: preview.meta?.depth,
      minutesCap: preview.meta?.minutesPerDay,
      primaryFocus: preview.meta?.primaryFocus,
      confidence: preview.confidence?.label
    })
  }

  const trackCTAClick = (price: number) => {
    track('preview_cta_click', { price })
  }

  const trackMicroActionTry = (actionLabel: string) => {
    track('preview_microaction_try', { which: actionLabel })
  }

  return {
    trackPreviewGenerated,
    trackCTAClick,
    trackMicroActionTry
  }
}
