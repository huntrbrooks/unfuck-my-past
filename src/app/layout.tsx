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
import LegalBanner from '../components/LegalBanner'
import { cookies } from 'next/headers'
import Footer from '../components/Footer'
import AppToaster from '../components/Toaster'

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
  const cookieStore = cookies() as any
  const initialThemeFromCookie = cookieStore.get?.('theme')?.value
  const isDarkFromCookie = initialThemeFromCookie === 'dark'
  return (
    <ClerkProvider>
      <html lang="en" className={`${dmSans.variable} ${GeistMono.variable} ${isDarkFromCookie ? 'dark' : ''}`} suppressHydrationWarning={true}>
        <body className="font-sans antialiased" suppressHydrationWarning={true}>
          <Script id="apply-initial-theme" strategy="beforeInteractive">
            {`(function(){
              try {
                var theme = localStorage.getItem('theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                var root = document.documentElement;
                if (theme === 'dark') {
                  root.classList.add('dark');
                } else {
                  root.classList.remove('dark');
                }
                root.style.colorScheme = theme;
                // keep cookie in sync for SSR to render correct theme
                document.cookie = 'theme=' + theme + '; path=/; max-age=31536000; samesite=lax';
              } catch (e) {
                // Theme application failed, but page should still be visible
              }
            })();`}
          </Script>
          <ErrorBoundary>
            <ThemeProvider>
              <AnalyticsProvider>
                <LegalBanner />
                <div className="w-full flex justify-center">
                  <div className="hidden md:flex w-full justify-center">
                    <MenuBar />
                  </div>
                  <div className="md:hidden fixed top-0 left-0 right-0 z-50">
                    <MobileMenu />
                  </div>
                </div>
                {/* Mobile header spacer to prevent content underlap */}
                <div className="md:hidden h-mobile-header" />
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
                <Footer />
                <AppToaster />
                <Analytics />
              </AnalyticsProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
