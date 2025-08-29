import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '../../../../db'
import { getAdaptiveQuestions } from '../../../../lib/diagnostic-questions'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable authentication for testing
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Use a test user ID for now
    const userId = 'test-user-123'

    // Get user preferences from database using Drizzle ORM
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User preferences not found. Please complete onboarding first.' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    const userPreferences = {
      tone: user.tone || 'gentle',
      voice: user.voice || 'friend',
      rawness: user.rawness || 'moderate',
      depth: user.depth || 'moderate',
      learning: user.learning || 'text',
      engagement: user.engagement || 'passive',
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
