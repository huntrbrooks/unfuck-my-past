'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // Log error to external service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error logging service
      console.error('Production error:', { error, errorInfo })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-destructive/20 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Something went wrong</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    We encountered an unexpected error. Don&apos;t worry, your data is safe.
                  </p>
                </div>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 text-left">
                    <h3 className="text-lg font-semibold text-destructive mb-2">Error Details (Development)</h3>
                    <p className="text-destructive mb-3"><strong>Error:</strong> {this.state.error.message}</p>
                    {this.state.errorInfo && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-destructive font-medium">Stack Trace</summary>
                        <pre className="mt-2 text-destructive bg-destructive/10 p-3 rounded overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={this.handleReload} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
