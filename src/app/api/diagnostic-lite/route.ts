import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { DiagnosticLiteSchema } from '@/ai/schema/diagnostic-lite'
import { DIAGNOSTIC_LITE_SYSTEM, DIAGNOSTIC_LITE_USER } from '@/ai/prompts/diagnostic-lite'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { onboarding, answers } = await req.json()

    try {
      if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: DIAGNOSTIC_LITE_SYSTEM },
          { role: 'user', content: DIAGNOSTIC_LITE_USER(onboarding, answers) }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 900
      })

      let data: any
      try {
        data = JSON.parse(r.choices?.[0]?.message?.content ?? '{}')
      } catch {
        return NextResponse.json({ error: 'Invalid JSON from model' }, { status: 502 })
      }
      const ok = data && typeof data === 'object' && data.colour_profile && Array.isArray(data.avoidance_ladder) && data.core_blocker && data.activation_kit
      if (!ok) return NextResponse.json({ error: 'Schema mismatch' }, { status: 502 })
      return NextResponse.json(data)
    } catch (apiErr) {
      // Offline/dev fallback
      const fallback = {
        colour_profile: { dominant_colour: 'Green', hex: '#16A34A', meaning: 'Empathetic and resilient.' },
        avoidance_ladder: [
          { name: 'Hard conversations', severity: 4, why_it_matters: 'Keeps relationships vague and resentful.' },
          { name: 'Starting tasks', severity: 3, why_it_matters: 'Creates last-minute stress.' },
          { name: 'Saying no', severity: 3, why_it_matters: 'Leads to burnout.' }
        ],
        core_blocker: { label: 'People-pleasing loop', evidence: ['Says yes then resents'], starter_action: 'Use a one-sentence boundary this week.' },
        activation_kit: { brp: ['Box breathing 2 min', '60-sec walk'], boundary_script: 'I can’t commit to that this week.', micro_exposure: { target: 'Send one honest message', duration_min: 5, if_then_plan: 'If anxiety spikes, then 3 breaths and hit send.' } }
      }
      return NextResponse.json(fallback)
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate diagnostic lite' }, { status: 500 })
  }
}


