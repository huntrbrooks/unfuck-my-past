import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import BootstrapClient from '../components/BootstrapClient'
import HydrationSuppressor from '../components/HydrationSuppressor'
import ErrorBoundary from '../components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unfuck Your Past',
  description: 'AI-driven self-healing and personal growth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <BootstrapClient />
          <ErrorBoundary>
            <HydrationSuppressor>
              {children}
            </HydrationSuppressor>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
