interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  userId?: string
}

interface WebVitals {
  FCP: number // First Contentful Paint
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
  TTFB: number // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private isInitialized = false

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return

    this.isInitialized = true
    this.observeWebVitals()
    this.observeResourceTiming()
    this.observeUserInteractions()
  }

  private observeWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        this.recordMetric('FCP', entry.startTime, 'ms')
      })
    }).observe({ entryTypes: ['paint'] })

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        this.recordMetric('LCP', lastEntry.startTime, 'ms')
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        const e = entry as PerformanceEventTiming
        if (typeof e.processingStart === 'number') {
          this.recordMetric('FID', e.processingStart - e.startTime, 'ms')
        }
      })
    }).observe({ entryTypes: ['first-input'] as any })

    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let clsValue = 0
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        const e = entry as any
        if (!e.hadRecentInput) {
          clsValue += e.value as number
        }
      })
      this.recordMetric('CLS', clsValue, 'score')
    }).observe({ entryTypes: ['layout-shift'] as any })
  }

  private observeResourceTiming() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        const e = entry as PerformanceNavigationTiming
        if (e.initiatorType === 'navigation') {
          this.recordMetric('TTFB', e.responseStart - e.requestStart, 'ms')
        }
      })
    }).observe({ entryTypes: ['navigation', 'resource'] as any })
  }

  private observeUserInteractions() {
    let interactionCount = 0
    let totalInteractionTime = 0

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry: { duration: number }) => {
        interactionCount++
        totalInteractionTime += entry.duration
      })
    })

    observer.observe({ entryTypes: ['interaction'] })

    // Report interaction metrics every 30 seconds
    setInterval(() => {
      if (interactionCount > 0) {
        this.recordMetric('avg_interaction_time', totalInteractionTime / interactionCount, 'ms')
        this.recordMetric('interaction_count', interactionCount, 'count')
        interactionCount = 0
        totalInteractionTime = 0
      }
    }, 30000)
  }

  recordMetric(name: string, value: number, unit: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString()
    }

    this.metrics.push(metric)
    this.sendMetric(metric)
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    return fn().finally(() => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, 'ms')
    })
  }

  measureSync<T>(name: string, fn: () => T): T {
    const startTime = performance.now()
    try {
      return fn()
    } finally {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, 'ms')
    }
  }

  private sendMetric(metric: PerformanceMetric) {
    // Send to analytics service
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'performance_metric',
        properties: metric
      }),
    }).catch(error => {
      console.error('Failed to send performance metric:', error)
    })
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getWebVitals(): Partial<WebVitals> {
    const vitals: Partial<WebVitals> = {}
    
    this.metrics.forEach(metric => {
      if (metric.name in vitals) {
        (vitals as Record<string, number>)[metric.name] = metric.value
      }
    })
    
    return vitals
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Hook for React components
export function usePerformance() {
  return {
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor)
  }
}
