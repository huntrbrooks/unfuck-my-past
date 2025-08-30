import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '../../../../db'
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

    console.log('User safety data:', JSON.stringify(safetyData, null, 2))

    // Check if personalized questions exist
    const personalizedQuestions = safetyData.personalizedQuestions
    const diagnosticAnalysis = safetyData.diagnosticAnalysis

    if (personalizedQuestions && diagnosticAnalysis && personalizedQuestions.length > 0) {
      console.log('Using personalized questions:', personalizedQuestions.length)
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

    console.log('No personalized questions found, triggering generation...')
    
    // Try to generate personalized questions immediately
    try {
      const generateResponse = await fetch(`${request.nextUrl.origin}/api/diagnostic/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (generateResponse.ok) {
        console.log('Successfully generated personalized questions')
        // Return the newly generated questions
        const generateData = await generateResponse.json()
        
        // Fetch the updated user data to get the new questions
        const updatedUserResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
        const updatedUser = updatedUserResult[0]
        const updatedSafetyData = typeof updatedUser.safety === 'string' ? JSON.parse(updatedUser.safety) : updatedUser.safety
        
        if (updatedSafetyData.personalizedQuestions && updatedSafetyData.personalizedQuestions.length > 0) {
          return NextResponse.json({
            questions: updatedSafetyData.personalizedQuestions,
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
            analysis: updatedSafetyData.diagnosticAnalysis,
            isPersonalized: true
          })
        }
      }
    } catch (generateError) {
      console.error('Failed to generate personalized questions:', generateError)
    }

    // If generation fails, return error instead of fallback questions
    return NextResponse.json(
      { 
        error: 'Failed to generate personalized questions. Please try again.',
        details: 'AI generation failed, no fallback questions available'
      },
      { status: 500 }
    )

  } catch (error) {
    console.error('Error getting diagnostic questions:', error)
    return NextResponse.json(
      { error: 'Failed to get diagnostic questions' },
      { status: 500 }
    )
  }
}
