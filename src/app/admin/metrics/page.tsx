'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

type Metrics = {
  onboardingUsers: number
  diagnosticUsers: number
  avgDiagnosticAnswerChars: number
  purchases: { fullReport: number; program: number }
  program: { usersWithProgress: number; avgFurthestDay: number }
  engagement: { avgSessionSeconds: number; avgVisitsPerUser: number }
}

export default function AdminMetricsPage() {
  const { isLoaded, user } = useUser()
  const [data, setData] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    const load = async () => {
      try {
        const r = await fetch('/api/admin/metrics', { cache: 'no-store' })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || 'Failed to load metrics')
        setData(j)
      } catch (e: any) {
        setError(e?.message || 'Failed to load metrics')
      }
    }
    load()
  }, [isLoaded])

  if (!isLoaded) return <div>Loading...</div>
  if (error) return <div className="p-6">Error: {error}</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Metrics</h1>
      {!data ? (
        <div>Loading metrics…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card title="Onboarding Users" value={data.onboardingUsers} />
          <Card title="Diagnostic Users" value={data.diagnosticUsers} />
          <Card title="Avg Answer Length (chars)" value={data.avgDiagnosticAnswerChars} />
          <Card title="Full Report Purchases" value={data.purchases.fullReport} />
          <Card title="Program Purchases" value={data.purchases.program} />
          <Card title="Users with Program Progress" value={data.program.usersWithProgress} />
          <Card title="Avg Furthest Day" value={data.program.avgFurthestDay} />
          <Card title="Avg Session (sec)" value={data.engagement.avgSessionSeconds} />
          <Card title="Avg Visits / User" value={data.engagement.avgVisitsPerUser} />
        </div>
      )}
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{Number(value).toLocaleString()}</div>
    </div>
  )
}


