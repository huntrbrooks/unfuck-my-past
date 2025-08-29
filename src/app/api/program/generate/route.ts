import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, answers } from '../../../../db'
import { eq } from 'drizzle-orm'
import { AIProgramGenerator } from '../../../../lib/ai-program-generator'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and preferences
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    // Get diagnostic responses
    const responsesResult = await db.select({
      questionId: answers.questionId,
      content: answers.content,
      summary: answers.summary,
      createdAt: answers.createdAt
    })
    .from(answers)
    .where(eq(answers.userId, userId))
    .orderBy(answers.createdAt)

    if (!responsesResult || responsesResult.length === 0) {
      return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })
    }

    // Get diagnostic summary
    const diagnosticSummary = safetyData.diagnosticSummary?.content || 'No summary available'

    // Format responses for AI
    const diagnosticResponses = responsesResult.map((response, index) => ({
      question: `Question ${response.questionId}`,
      response: response.content || '',
      insight: response.summary || '',
      timestamp: response.createdAt?.toISOString() || new Date().toISOString()
    }))

    // Create user profile
    const userProfile = {
      tone: user.tone || 'gentle',
      voice: user.voice || 'friend',
      rawness: user.rawness || 'moderate',
      depth: user.depth || 'moderate',
      learning: user.learning || 'text',
      engagement: user.engagement || 'passive',
      goals: safetyData.goals || [],
      experience: safetyData.experience || 'beginner',
      timeCommitment: safetyData.timeCommitment || '15min'
    }

    // Generate personalized program
    const programGenerator = new AIProgramGenerator()
    const personalizedProgram = await programGenerator.generatePersonalizedProgram(
      diagnosticResponses,
      userProfile,
      diagnosticSummary
    )

    // Save the personalized program to the database
    const updatedSafety = {
      ...safetyData,
      personalizedProgram: {
        days: personalizedProgram,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    return NextResponse.json({
      success: true,
      program: personalizedProgram,
      message: 'Personalized program generated successfully'
    })

  } catch (error) {
    console.error('Error generating personalized program:', error)
    return NextResponse.json(
      { error: 'Failed to generate personalized program' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's personalized program
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    const personalizedProgram = safetyData.personalizedProgram

    if (!personalizedProgram) {
      return NextResponse.json({ 
        error: 'No personalized program found. Please complete the diagnostic first.' 
      }, { status: 404 })
    }

    return NextResponse.json({
      program: personalizedProgram.days,
      generatedAt: personalizedProgram.generatedAt,
      version: personalizedProgram.version
    })

  } catch (error) {
    console.error('Error fetching personalized program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personalized program' },
      { status: 500 }
    )
  }
}
