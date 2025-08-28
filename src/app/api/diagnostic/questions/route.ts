import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '../../../../db'
import { getAdaptiveQuestions } from '../../../../lib/diagnostic-questions'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences from database
    const userResult = await db.execute(`
      SELECT tone, voice, rawness, depth, learning, engagement, safety
      FROM users 
      WHERE id = $1
    `, [userId])

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User preferences not found. Please complete onboarding first.' }, { status: 404 })
    }

    const user = userResult.rows[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    const userPreferences = {
      tone: user.tone,
      voice: user.voice,
      rawness: user.rawness,
      depth: user.depth,
      learning: user.learning,
      engagement: user.engagement,
      goals: safetyData.goals || [],
      experience: safetyData.experience || 'beginner'
    }

    // Get adaptive questions based on preferences
    const questions = getAdaptiveQuestions(userPreferences, 5)

    return NextResponse.json({
      questions,
      userPreferences
    })

  } catch (error) {
    console.error('Error getting diagnostic questions:', error)
    return NextResponse.json(
      { error: 'Failed to get diagnostic questions' },
      { status: 500 }
    )
  }
}
