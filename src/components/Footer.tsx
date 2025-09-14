import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Unfuck My Past. All rights reserved.
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/legal" className="hover:underline">Legal</Link>
            <Link href="/legal/terms" className="hover:underline">Terms</Link>
            <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
            <Link href="/legal/disclaimer" className="hover:underline">Disclaimer</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}


