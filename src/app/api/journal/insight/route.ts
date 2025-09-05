import { NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-service'

export async function POST(request: Request) {
  try {
    const { content, mood } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    const prompt = `You are an empathetic, trauma-informed journaling assistant. Given a user's journal entry and optional mood, generate 3 short, supportive insights (1–2 sentences each) that help the user notice patterns, validate feelings, and suggest a gentle next step. Avoid therapy jargon, be human and practical.

Mood (optional): ${mood || 'not provided'}`

    const ai = new AIService()
    const res = await (ai as any).generateOpenAIInsight(prompt, content, 'gpt-4o-mini')

    // Parse insights into an array of strings
    const text: string = res.insight || ''
    const lines = text
      .split('\n')
      .map((l) => l.trim().replace(/^[-•\d.\s]+/, ''))
      .filter((l) => l.length > 0)

    const insights = lines.length >= 3 ? lines.slice(0, 3) : [text].filter(Boolean)

    return NextResponse.json({ insights, model: res.model, timestamp: res.timestamp })
  } catch (error) {
    console.error('Journal insight error', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}


