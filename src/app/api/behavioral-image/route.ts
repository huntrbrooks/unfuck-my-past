import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Loop = {
  name: string
  trigger: string
  cycle: string[]
  impact: string
  breakPoint: { fromState: string; action: string }
}

function buildFallbackSvg(loops: Loop[], palette: { danger: string; neutral: string; action: string; accent: string }) {
  const width = 1000
  const height = 520
  const bg = '#0b0b0c'
  const [left, right] = [loops[0], loops[1]]
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="${palette.danger}" />
      </marker>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="${bg}"/>
    <g font-family="ui-sans-serif, system-ui" fill="#cbd5e1" text-anchor="middle">
      <text x="500" y="40" font-size="20" fill="#94a3b8">Behavioral Patterns</text>
    </g>
    ${[left, right].map((lp, idx) => {
      const cx = idx === 0 ? 300 : 700
      const cy = 230
      const r = 120
      const titleY = 70
      const title = lp?.name || `Loop ${idx + 1}`
      const trigger = lp?.trigger || 'Trigger'
      const impact = lp?.impact || ''
      const bp = lp?.breakPoint?.action || 'Break the loop'
      const from = lp?.breakPoint?.fromState || 'State'
      const cycle = (lp?.cycle && lp.cycle.length > 1 ? lp.cycle : ['State A','State B','State C']).slice(0, 5)
      const angleStep = (Math.PI * 2) / cycle.length
      const nodeDots = cycle.map((_, i) => {
        const a = i * angleStep - Math.PI / 2
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        return `<circle cx="${x}" cy="${y}" r="5" fill="${palette.neutral}" />`
      }).join('')
      const labels = cycle.map((label, i) => {
        const a = i * angleStep - Math.PI / 2
        const x = cx + Math.cos(a) * (r + 24)
        const y = cy + Math.sin(a) * (r + 24)
        return `<text x="${x}" y="${y}" font-size="12" text-anchor="middle" fill="#e5e7eb">${label}</text>`
      }).join('')
      const arrows = cycle.map((_, i) => {
        const a1 = i * angleStep - Math.PI / 2
        const a2 = ((i + 1) % cycle.length) * angleStep - Math.PI / 2
        const x1 = cx + Math.cos(a1) * r
        const y1 = cy + Math.sin(a1) * r
        const x2 = cx + Math.cos(a2) * r
        const y2 = cy + Math.sin(a2) * r
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${palette.danger}" stroke-width="2" marker-end="url(#arrow)" />`
      }).join('')
      const bpX = cx
      const bpY = cy + r + 70
      const fromPtAngle = cycle.findIndex(s => s === from) >= 0 ? cycle.findIndex(s => s === from) * angleStep - Math.PI / 2 : Math.PI / 2
      const fromX = cx + Math.cos(fromPtAngle) * (r + 4)
      const fromY = cy + Math.sin(fromPtAngle) * (r + 4)
      return `
        <g>
          <text x="${cx}" y="${titleY}" font-size="16" fill="${palette.accent}" text-anchor="middle">${title}</text>
          <text x="${cx}" y="${titleY + 18}" font-size="12" fill="#94a3b8" text-anchor="middle">Trigger: ${trigger}</text>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.neutral}" stroke-width="2" />
          ${arrows}
          ${nodeDots}
          ${labels}
          <line x1="${fromX}" y1="${fromY}" x2="${bpX}" y2="${bpY - 24}" stroke="${palette.action}" stroke-width="2" stroke-dasharray="5,5" />
          <g filter="url(#softShadow)">
            <rect x="${bpX - 110}" y="${bpY - 24}" width="220" height="60" rx="14" fill="#0f172a" stroke="${palette.action}" stroke-width="1.5" />
          </g>
          <text x="${bpX}" y="${bpY}" font-size="12" text-anchor="middle" fill="#e5e7eb">Break Point</text>
          <text x="${bpX}" y="${bpY + 18}" font-size="12" text-anchor="middle" fill="#a7f3d0">${bp}</text>
          <text x="${cx}" y="${cy + r + 120}" font-size="12" text-anchor="middle" fill="#cbd5e1">${impact}</text>
        </g>`
    }).join('')}
  </svg>`
  return svg
}

export async function POST(request: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY

    const body = await request.json().catch(() => ({}))
    const loops = Array.isArray(body?.loops) ? body.loops as Loop[] : []
    const palette = body?.palette || {
      danger: '#ef4444',
      neutral: '#64748b',
      action: '#22c55e',
      accent: '#6366f1',
    }

    if (!loops || loops.length === 0) {
      return NextResponse.json({ error: 'No loop data provided' }, { status: 400 })
    }

    // If no key, build a local SVG so generation always works
    if (!openaiKey) {
      const svg = buildFallbackSvg(loops, palette)
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
      return NextResponse.json({ dataUrl })
    }

    const stylePrompt = [
      'Create a polished, modern infographic with TWO circular feedback loops side-by-side.',
      'Each loop shows: a small title, a trigger, a circular cycle with rounded arrows and readable labels,',
      'a dotted EXIT arrow to a highlighted Break Point card, and a short Impact caption under each loop.',
      'Visual style: clean, UI-quality, subtle depth/shadows, soft rounded rectangles, high contrast text.',
      'Color palette:',
      `danger ${palette.danger}, action ${palette.action}, neutral ${palette.neutral}, accent ${palette.accent}.`,
      'Use danger for the cycle arrows, action (green) for break-point arrow + card, neutral for node borders, accent for headings.',
      'Background: dark neutral to match a modern dashboard.',
      'Legend (optional): small, bottom center with “Cycle” and “Break Point”.',
    ].join(' ')

    const payload = {
      model: 'gpt-image-1',
      prompt: `${stylePrompt}\n\nJSON:\n${JSON.stringify({ loops, palette }, null, 2)}`,
      size: '1792x1024',
      n: 1,
      // background: 'transparent' // keep opaque for better readability on dark pages
    }

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      // Fallback to local SVG on API failure
      const svg = buildFallbackSvg(loops, palette)
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
      return NextResponse.json({ dataUrl, warning: 'OpenAI image generation failed; served local SVG' }, { status: 200 })
    }

    const data = await resp.json()
    const b64 = data?.data?.[0]?.b64_json
    if (!b64) {
      const svg = buildFallbackSvg(loops, palette)
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
      return NextResponse.json({ dataUrl, warning: 'OpenAI returned no image; served local SVG' }, { status: 200 })
    }

    const dataUrl = `data:image/png;base64,${b64}`
    return NextResponse.json({ dataUrl })
  } catch (error) {
    console.error('behavioral-image error:', error)
    try {
      const body = await request.json().catch(() => ({}))
      const loops = Array.isArray(body?.loops) ? body.loops as Loop[] : []
      const palette = body?.palette || { danger: '#ef4444', neutral: '#64748b', action: '#22c55e', accent: '#6366f1' }
      if (loops.length > 0) {
        const svg = buildFallbackSvg(loops, palette)
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
        return NextResponse.json({ dataUrl, warning: 'Local SVG fallback due to server error' }, { status: 200 })
      }
    } catch {}
    return NextResponse.json({ error: 'Unexpected error generating image' }, { status: 500 })
  }
}


