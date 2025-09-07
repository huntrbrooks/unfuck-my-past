import React from 'react'
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import Script from 'next/script'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import ThemeProvider from '../components/ThemeProvider'
import MenuBar from '../components/MenuBar'
import MobileMenu from '../components/MobileMenu'
import AnalyticsProvider from '../components/AnalyticsProvider'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Unfuck Your Past - 30-Day Healing Journey',
  description: 'Transform your life through structured self-discovery and healing',
  generator: 'v0.app:v1:jVA3d1a89lPg2x2a1iI5yXpB:N2Gc5BD5rG1IFGTgxxP2rOGT',
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
      <html lang="en" className={`${dmSans.variable} ${GeistMono.variable}`} suppressHydrationWarning={true}>
        <body className="font-sans antialiased" suppressHydrationWarning={true}>
          <Script id="apply-initial-theme" strategy="beforeInteractive">
            {`(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'};if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')};document.documentElement.style.colorScheme=t}catch(e){}})();`}
          </Script>
          <ErrorBoundary>
            <ThemeProvider>
              <AnalyticsProvider>
                <div className="w-full flex justify-center">
                  <div className="hidden md:flex w-full justify-center">
                    <MenuBar />
                  </div>
                  <div className="md:hidden fixed top-0 left-0 right-0 z-50">
                    <MobileMenu />
                  </div>
                </div>
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
