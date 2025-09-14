'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type AppStatus = {
  onboardingCompleted: boolean
  diagnosticCompleted: boolean
  nextStep: 'onboarding' | 'diagnostic' | 'unlocked'
}

export function useRequireOnboardingAndDiagnostic() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/me/status', { cache: 'no-store' })
        if (res.status === 401) {
          router.push('/sign-in')
          return
        }
        if (!res.ok) {
          // Fail safe: send to onboarding
          router.push('/onboarding')
          return
        }
        const j = (await res.json()) as AppStatus
        if (j.onboardingCompleted && j.diagnosticCompleted) {
          if (!cancelled) setAllowed(true)
        } else {
          const dest = j.nextStep === 'onboarding' ? '/onboarding' : '/diagnostic'
          router.push(dest)
          return
        }
      } catch {
        router.push('/onboarding')
        return
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  return { checking, allowed }
}

export function useAppStatus() {
  const [status, setStatus] = useState<AppStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/me/status', { cache: 'no-store' })
        if (res.ok) {
          const j = (await res.json()) as AppStatus
          if (!cancelled) setStatus(j)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return { status, loading }
}


