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
  autoGenerate?: boolean
  strictOpenAIOnly?: boolean
}

const BehavioralPatternsImage: React.FC<Props> = ({ loops, allowRegenerate = false, autoGenerate = true, strictOpenAIOnly = false }) => {
  const [img, setImg] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [usedFallback, setUsedFallback] = React.useState<boolean>(false)

  const requestImage = React.useCallback(async () => {
    let cancelled = false
    try {
      setLoading(true)
      if (!strictOpenAIOnly) setError(null)
      const res = await fetch('/api/behavioral-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loops }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      if (!cancelled) {
        const url: string | null = data.dataUrl || null
        const isSvgFallback = String(url || '').startsWith('data:image/svg')
        if (strictOpenAIOnly && isSvgFallback) {
          setImg(null)
          setUsedFallback(false)
        } else {
          setImg(url)
          setUsedFallback(Boolean(data.warning) || isSvgFallback)
        }
      }
    } catch (e) {
      if (!strictOpenAIOnly) setError('Image generation unavailable. Showing fallback visual.')
    } finally {
      setLoading(false)
    }
    return () => { cancelled = true }
  }, [JSON.stringify(loops), strictOpenAIOnly])

  React.useEffect(() => {
    if (!autoGenerate) return
    let cancelled = false
    const run = async () => {
      const cleanup = await requestImage()
      return cleanup
    }
    run()
    return () => { cancelled = true }
  }, [JSON.stringify(loops), autoGenerate, requestImage])

  const regenerate = async () => {
    setImg(null)
    await requestImage()
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
          {usedFallback && !strictOpenAIOnly && (
            <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-md border border-border bg-background/80 backdrop-blur-sm">
              Generated locally
            </div>
          )}
        </div>
      ) : (
        !strictOpenAIOnly ? (
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
        ) : null
      )}
    </div>
  )
}

export default BehavioralPatternsImage


