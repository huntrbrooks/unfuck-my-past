import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { SixScoresSchema } from '@/ai/schema/persona'
import { PERSONA_SYSTEM, PERSONA_USER } from '@/ai/prompts/persona'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function isValidSixScores(payload: any): payload is { scores: Record<string, number> } {
  if (!payload || typeof payload !== 'object') return false
  const s = payload.scores
  const keys = ['resilience','vulnerability','self_awareness','boundaries','emotional_regulation','growth_orientation']
  if (!s || typeof s !== 'object') return false
  for (const k of keys) {
    if (typeof s[k] !== 'number') return false
    if (s[k] < 0 || s[k] > 10) return false
  }
  return true
}

export async function POST(req: NextRequest) {
  try {
    const { onboarding, answers } = await req.json()
    try {
      if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PERSONA_SYSTEM },
          { role: 'user', content: PERSONA_USER(onboarding, answers) }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 400
      })

      const data = JSON.parse(r.choices?.[0]?.message?.content ?? '{}')
      if (!isValidSixScores(data)) {
        console.warn('Invalid persona scores from AI, using fallback')
        const fallback = {
          scores: {
            resilience: 6,
            vulnerability: 5,
            self_awareness: 6,
            boundaries: 4,
            emotional_regulation: 5,
            growth_orientation: 6
          }
        }
        return NextResponse.json(fallback)
      }
      return NextResponse.json(data)
    } catch (apiErr) {
      console.error('Persona API error:', apiErr)
      // Always return fallback to keep UI working
      const fallback = {
        scores: {
          resilience: 6,
          vulnerability: 5,
          self_awareness: 6,
          boundaries: 4,
          emotional_regulation: 5,
          growth_orientation: 6
        }
      }
      return NextResponse.json(fallback)
    }
  } catch (e) {
    console.error('Persona API outer error:', e)
    // Always return fallback to keep UI working
    const fallback = {
      scores: {
        resilience: 6,
        vulnerability: 5,
        self_awareness: 6,
        boundaries: 4,
        emotional_regulation: 5,
        growth_orientation: 6
      }
    }
    return NextResponse.json(fallback)
  }
}


