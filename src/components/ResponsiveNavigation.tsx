'use client'

import Navigation from './Navigation'
import MobileMenu from './MobileMenu'

export default function ResponsiveNavigation() {
  return (
    <>
      <Navigation />
      <div className="md:hidden fixed top-4 right-4 z-50">
        <MobileMenu />
      </div>
    </>
  )
}
