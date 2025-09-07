import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses } from '@/db'
import { eq } from 'drizzle-orm'
import { generateStructuredDayPlan } from '@/lib/structured-ai'
import { buildStructuredPrompt } from '@/lib/structured-prompt-builder'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dayNumber, weatherData, difficulty = 'easy' } = body

    if (!dayNumber || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // Get user preferences and diagnostic responses
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userData[0]
    const userPreferences = {
      tone: user.tone || 'supportive-direct',
      voice: user.voice || 'mentor',
      rawness: user.rawness || 'honest',
      depth: user.depth || 'medium',
      learning: user.learning || 'practical',
      engagement: user.engagement || 'daily'
    }

    // Get diagnostic responses
    const responses = await db
      .select()
      .from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, userId))
      .orderBy(diagnosticResponses.createdAt)

    if (!responses.length) {
      return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })
    }

    // Transform responses to match expected type
    const transformedResponses = responses.map(resp => ({
      question: resp.question && typeof resp.question === 'object' && 'text' in resp.question ? (resp.question as { text: string }).text : `Question ${resp.id}`,
      response: resp.response || '',
      insight: resp.insight || '',
      createdAt: resp.createdAt || new Date()
    }))

    // Map difficulty from your app's format to schema format
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'easy': 'easy',
      'moderate': 'medium', 
      'challenging': 'hard'
    }
    const schemaDifficulty = difficultyMap[difficulty] || 'medium'

    // Build context for the structured prompt
    const context = {
      preferences: {
        tone: userPreferences.tone,
        learningStyle: userPreferences.learning,
        persona: userPreferences.voice,
        relationshipStyle: userPreferences.rawness,
        engagement: userPreferences.engagement,
        depth: userPreferences.depth
      },
      diagnostic: {
        themes: transformedResponses.map(r => r.insight).slice(0, 5),
        insights: transformedResponses.map(r => `${r.question}: ${r.response}`).slice(0, 3),
        responses: transformedResponses.slice(0, 5)
      },
      moods: [], // TODO: Add real mood data
      journals: { insights: [] }, // TODO: Add real journal data
      fullReport: { keyInsights: [] }, // TODO: Add real report data
      previousDay: undefined, // TODO: Fetch previous day
      weatherData: weatherData
    }

    const prompt = buildStructuredPrompt(context, dayNumber, schemaDifficulty)
    console.log('🎯 Generating structured day plan for day', dayNumber, 'with difficulty', schemaDifficulty)
    
    const dayPlan = await generateStructuredDayPlan(prompt)

    // Ensure date is set
    if (!dayPlan.dateISO) {
      dayPlan.dateISO = new Date().toISOString().slice(0, 10)
    }

    console.log('🎯 Successfully generated structured plan for day', dayNumber)

    // Save the structured plan to the user's safety data
    const currentSafety = user.safety || {}
    const currentDailyContent = (user.safety as { dailyContent?: Record<string, unknown> })?.dailyContent || {}
    
    const updatedSafety = {
      ...currentSafety,
      dailyContent: {
        ...currentDailyContent,
        [dayNumber]: {
          structuredPlan: dayPlan,
          theme: dayPlan.theme,
          poeticTitle: dayPlan.dayHeading,
          timestamp: new Date().toISOString(),
          isStructured: true
        }
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    return NextResponse.json({
      dayNumber: dayNumber,
      structuredPlan: dayPlan,
      theme: dayPlan.theme,
      poeticTitle: dayPlan.dayHeading,
      timestamp: new Date().toISOString(),
      isStructured: true
    })

  } catch (error) {
    console.error('Error generating structured daily content:', error)
    return NextResponse.json(
      { error: 'Failed to generate structured daily content' },
      { status: 500 }
    )
  }
}
