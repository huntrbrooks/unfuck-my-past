"use client"
import React from 'react'

type Loop = {
  name: string
  trigger: string
  cycle: string[]
  impact: string
  breakPoint: { fromState: string; action: string }
}

type Props = {
  loops: Loop[]
  allowRegenerate?: boolean
}

const BehavioralPatternsImage: React.FC<Props> = ({ loops, allowRegenerate = false }) => {
  const [img, setImg] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [usedFallback, setUsedFallback] = React.useState<boolean>(false)

  React.useEffect(() => {
    let cancelled = false
    const generate = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/behavioral-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loops }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (!cancelled) {
          setImg(data.dataUrl)
          setUsedFallback(Boolean(data.warning) || String(data.dataUrl || '').startsWith('data:image/svg'))
        }
      } catch (e) {
        if (!cancelled) setError('Image generation unavailable. Showing fallback visual.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [JSON.stringify(loops)])

  const regenerate = async () => {
    // trigger effect by resetting state and calling same code
    setImg(null)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/behavioral-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loops }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setImg(data.dataUrl)
      setUsedFallback(Boolean(data.warning) || String(data.dataUrl || '').startsWith('data:image/svg'))
    } catch (e) {
      setError('Image generation unavailable. Showing fallback visual.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {allowRegenerate && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={regenerate}
            disabled={loading}
            className="text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
          >
            {loading ? 'Generating…' : 'Generate Image'}
          </button>
        </div>
      )}
      {loading && (
        <div className="text-sm text-muted-foreground">Generating visual...</div>
      )}
      {img ? (
        <div className="relative">
          <img src={img} alt="Behavioral patterns" className="w-full h-auto rounded-xl border border-border/50" />
          {usedFallback && (
            <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-md border border-border bg-background/80 backdrop-blur-sm">
              Generated locally
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-background p-3">
          {error && <div className="text-sm text-muted-foreground mb-2">{error}</div>}
          {/* Fallback to inline SVG visual if image generation is not available */}
          {/* Importing the SVG component inline to avoid duplication */}
          {/* We re-use the light SVG as a graceful fallback */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <svg viewBox="0 0 1000 520" className="w-full h-auto">
            <text x={500} y={28} textAnchor="middle" fontSize="18" fill="#94a3b8">Behavioral Patterns</text>
            <text x={330} y={56} textAnchor="middle" fontSize="14" fill="#6366f1">{loops[0]?.name || 'Loop A'}</text>
            <text x={670} y={56} textAnchor="middle" fontSize="14" fill="#6366f1">{loops[1]?.name || 'Loop B'}</text>
          </svg>
        </div>
      )}
    </div>
  )
}

export default BehavioralPatternsImage


