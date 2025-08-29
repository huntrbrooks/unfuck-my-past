'use client'

import React, { useEffect, useState } from 'react'
import Navigation from './Navigation'
import MobileMenu from './MobileMenu'

interface ResponsiveNavigationProps {
  className?: string
}

export default function ResponsiveNavigation({ className = '' }: ResponsiveNavigationProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 992) // Bootstrap lg breakpoint
    }

    // Check on mount
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (isMobile) {
    return <MobileMenu className={className} />
  }

  return <Navigation className={className} />
}
