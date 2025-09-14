'use client'

import React from 'react'
import Link from 'next/link'

export default function LegalBanner() {
  const [hidden, setHidden] = React.useState<boolean>(false)

  React.useEffect(() => {
    try {
      const v = localStorage.getItem('uyp_legal_banner_hidden')
      setHidden(v === '1')
    } catch {}
  }, [])

  if (hidden) return null

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pr-10 py-2 text-xs sm:text-sm text-amber-900 dark:text-amber-100 flex items-center justify-center">
        <p className="leading-relaxed text-center">
          Not therapy or medical advice. For emergencies in Australia call 000 or Lifeline 13 11 14. See
          {' '}<Link href="/legal/disclaimer" className="underline hover:opacity-80">Disclaimer</Link>,
          {' '}<Link href="/legal/terms" className="underline hover:opacity-80">Terms</Link>, and
          {' '}<Link href="/legal/privacy" className="underline hover:opacity-80">Privacy</Link>.
        </p>
        <button
          aria-label="Dismiss legal notice"
          onClick={() => {
            setHidden(true)
            try { localStorage.setItem('uyp_legal_banner_hidden', '1') } catch {}
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 shrink-0 rounded-md px-2 py-1 border border-amber-300/70 dark:border-amber-700/70 hover:bg-amber-100/60 dark:hover:bg-amber-900/30"
        >
          ×
        </button>
      </div>
    </div>
  )
}


