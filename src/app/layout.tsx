import React from 'react'
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import ThemeProvider from '../components/ThemeProvider'
import ResponsiveNavigation from '../components/ResponsiveNavigation'
import AnalyticsProvider from '../components/AnalyticsProvider'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Unfuck Your Past - 30-Day Healing Journey',
  description: 'Transform your life through structured self-discovery and healing',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${dmSans.variable} ${GeistMono.variable}`}>
        <body className="font-sans antialiased" suppressHydrationWarning={true}>
          <ErrorBoundary>
            <ThemeProvider>
              <AnalyticsProvider>
                <ResponsiveNavigation />
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
                <Analytics />
              </AnalyticsProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
