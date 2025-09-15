import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Allow long-running generations; actual ceiling depends on hosting provider
export const maxDuration = 300

type Loop = {
  name: string
  trigger: string
  cycle: string[]
  impact: string
  breakPoint: { fromState: string; action: string }
}

export async function POST(request: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI key not configured' }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const loop: Loop | undefined = body?.loop
    const palette = body?.palette || {
      danger: '#ef4444',
      neutral: '#64748b',
      action: '#22c55e',
      accent: '#6366f1'
    }

    if (!loop || typeof loop !== 'object') {
      return NextResponse.json({ error: 'No loop provided' }, { status: 400 })
    }

    // Build a stricter, structured prompt with placeholders to stabilize layout and ordering
    const titleText = (loop as any).title || (loop.name || 'Behavioral Loop')
    const breakPointNode = (loop?.breakPoint?.fromState || (Array.isArray(loop?.cycle) && loop.cycle[0]) || 'State')
    const breakPointText = (loop?.breakPoint?.action || 'Break the loop')
    const cycleNodes = Array.isArray(loop?.cycle) && loop.cycle.length
      ? loop.cycle.map((node, i) => `- ${i + 1}. ${String(node)}`).join('\n')
      : '- 1. State A\n- 2. State B\n- 3. State C'

    const template = [
      'Design a single modern infographic of ONE behavioral feedback loop.',
      'TITLE: {title} (top center, small heading).',
      'TRIGGER: {trigger} (place as a line above the cycle).',
      'CYCLE LAYOUT (clockwise, strict order, evenly spaced around circle):',
      '{cycleNodes}',
      'Use rounded dark boxes for nodes with white text, and red (danger) arrows connecting them clockwise.',
      "EXIT: From the node '{breakPointNode}' draw a dotted green (action) arrow breaking OUT of the cycle toward the bottom-right to a green card labeled:",
      '  “Break Point: {breakPoint}”.',
      'IMPACT CAPTION: Below the circle, small neutral text: “{impact}”.',
      'VISUAL STYLE: clean UI, subtle depth/shadows, soft rounded rectangles, legible sans-serif, no extra icons.',
      `COLOR PALETTE: danger ${palette.danger}, action ${palette.action}, neutral ${palette.neutral}, accent ${palette.accent}.`,
      'COLOR RULES: danger for cycle arrows, action green for exit arrow and Break Point card, neutral for node borders, accent only for headings.',
      'BACKGROUND: dark neutral.',
      'STRICTNESS: Do not reorder or rename nodes. Use exactly the text provided. No additional nodes or captions.'
    ].join('\n')

    const stylePrompt = template
      .replace('{title}', String(titleText))
      .replace('{trigger}', String(loop?.trigger || 'Trigger'))
      .replace('{cycleNodes}', cycleNodes)
      .replace('{breakPointNode}', String(breakPointNode))
      .replace('{breakPoint}', String(breakPointText))
      .replace('{impact}', String(loop?.impact || ''))

    const payload = {
      model: 'gpt-image-1',
      prompt: `${stylePrompt}\n\nJSON:\n${JSON.stringify({ loop: { title: titleText, trigger: loop?.trigger, cycle: loop?.cycle, breakPointNode, breakPoint: breakPointText, impact: loop?.impact }, palette }, null, 2)}`,
      size: '1024x1024',
      n: 1
    }

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      // Do not pass AbortSignal; allow provider to run to completion
      body: JSON.stringify(payload)
    })

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => '')
      return NextResponse.json({ error: 'OpenAI image generation failed', details: errorText }, { status: 502 })
    }

    const data = await resp.json()
    const b64 = data?.data?.[0]?.b64_json
    const directUrl = data?.data?.[0]?.url

    if (b64) {
      const dataUrl = `data:image/png;base64,${b64}`
      return NextResponse.json({ dataUrl })
    }

    if (typeof directUrl === 'string' && directUrl.length > 0) {
      return NextResponse.json({ dataUrl: directUrl })
    }

    return NextResponse.json({ error: 'No image returned' }, { status: 502 })
  } catch (error) {
    console.error('behavioral-loop-image error:', error)
    return NextResponse.json({ error: 'Unexpected error generating image' }, { status: 500 })
  }
}


