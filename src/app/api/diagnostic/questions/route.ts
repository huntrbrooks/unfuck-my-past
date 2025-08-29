import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '../../../../db'
import { getAdaptiveQuestions } from '../../../../lib/diagnostic-questions'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences from database using Drizzle ORM
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User preferences not found. Please complete onboarding first.' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    // Check if personalized questions exist
    const personalizedQuestions = safetyData.personalizedQuestions
    const diagnosticAnalysis = safetyData.diagnosticAnalysis

    if (personalizedQuestions && diagnosticAnalysis) {
      // Use personalized questions
      return NextResponse.json({
        questions: personalizedQuestions,
        userPreferences: {
          tone: user.tone || 'gentle',
          voice: user.voice || 'friend',
          rawness: user.rawness || 'moderate',
          depth: user.depth || 'moderate',
          learning: user.learning || 'text',
          engagement: user.engagement || 'passive',
          goals: safetyData.goals || [],
          experience: safetyData.experience || 'beginner'
        },
        analysis: diagnosticAnalysis,
        isPersonalized: true
      })
    }

    // Fallback to adaptive questions if no personalized questions exist
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

    const questions = getAdaptiveQuestions(userPreferences, 5)

    return NextResponse.json({
      questions,
      userPreferences,
      isPersonalized: false
    })

  } catch (error) {
    console.error('Error getting diagnostic questions:', error)
    return NextResponse.json(
      { error: 'Failed to get diagnostic questions' },
      { status: 500 }
    )
  }
}
