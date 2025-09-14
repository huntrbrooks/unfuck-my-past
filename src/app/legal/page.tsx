import React from 'react'
import Link from 'next/link'

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen-dvh bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="responsive-heading neon-heading mb-4">Legal</h1>
        <p className="text-muted-foreground mb-6">Quick links to our legal documents.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><Link className="underline" href="/legal/disclaimer">Disclaimer</Link></li>
          <li><Link className="underline" href="/legal/terms">Terms of Service</Link></li>
          <li><Link className="underline" href="/legal/privacy">Privacy Policy</Link></li>
        </ul>
      </div>
    </main>
  )
}


