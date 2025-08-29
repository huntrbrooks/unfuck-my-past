'use client'

import { useEffect, useState } from 'react'

interface HydrationSuppressorProps {
  children: React.ReactNode
}

export default function HydrationSuppressor({ children }: HydrationSuppressorProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, render a minimal version
  if (!isHydrated) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  // After hydration, render normally
  return <>{children}</>
}
