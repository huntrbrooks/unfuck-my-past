interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: string
}

interface PageView {
  path: string
  title: string
  userId?: string
  timestamp?: string
}

class AnalyticsService {
  private isInitialized = false
  private userId?: string
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  initialize(userId?: string) {
    this.userId = userId
    this.isInitialized = true
    
    // Track session start
    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    })
  }

  trackEvent(event: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized')
      return
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      },
      userId: this.userId
    }

    // Send to analytics service (e.g., PostHog, Google Analytics, etc.)
    this.sendToAnalytics(analyticsEvent)
  }

  trackPageView(path: string, title: string) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized')
      return
    }

    const pageView: PageView = {
      path,
      title,
      userId: this.userId,
      timestamp: new Date().toISOString()
    }

    this.trackEvent('page_view', {
      path: pageView.path,
      title: pageView.title
    })
  }

  trackUserAction(action: string, properties: Record<string, any> = {}) {
    this.trackEvent('user_action', {
      action,
      ...properties
    })
  }

  trackConversion(funnel: string, step: string, properties: Record<string, any> = {}) {
    this.trackEvent('conversion', {
      funnel,
      step,
      ...properties
    })
  }

  trackError(error: Error, context: Record<string, any> = {}) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...context
    })
  }

  private sendToAnalytics(event: AnalyticsEvent) {
    // In production, this would send to your analytics service
    // For now, we'll just log to console
    console.log('Analytics Event:', event)

    // Example: Send to PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event.event, event.properties)
    }

    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, event.properties)
    }

    // Example: Send to custom API
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }).catch(error => {
      console.error('Failed to send analytics event:', error)
    })
  }

  // Predefined tracking methods for common events
  trackOnboardingStart() {
    this.trackEvent('onboarding_start')
  }

  trackOnboardingComplete(steps: number) {
    this.trackEvent('onboarding_complete', { steps })
  }

  trackDiagnosticStart() {
    this.trackEvent('diagnostic_start')
  }

  trackDiagnosticComplete(questionsAnswered: number) {
    this.trackEvent('diagnostic_complete', { questionsAnswered })
  }

  trackPaymentAttempt(productType: string, amount: number) {
    this.trackEvent('payment_attempt', { productType, amount })
  }

  trackPaymentSuccess(productType: string, amount: number) {
    this.trackEvent('payment_success', { productType, amount })
  }

  trackPaymentFailure(productType: string, amount: number, error: string) {
    this.trackEvent('payment_failure', { productType, amount, error })
  }

  trackProgramStart() {
    this.trackEvent('program_start')
  }

  trackProgramDayComplete(day: number) {
    this.trackEvent('program_day_complete', { day })
  }

  trackProgramComplete() {
    this.trackEvent('program_complete')
  }

  trackFeatureUsage(feature: string, properties: Record<string, any> = {}) {
    this.trackEvent('feature_usage', { feature, ...properties })
  }
}

// Create singleton instance
export const analytics = new AnalyticsService()

// Hook for React components
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics)
  }
}
