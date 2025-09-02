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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
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
