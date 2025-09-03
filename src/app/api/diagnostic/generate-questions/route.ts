import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '../../../../db'
import { eq } from 'drizzle-orm'
import { AIOnboardingAnalyzer } from '../../../../lib/ai-onboarding-analyzer'

export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's onboarding data
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    // Check if user has completed onboarding
    if (!user.tone || !user.voice || !user.rawness || !user.depth) {
      return NextResponse.json({ 
        error: 'Please complete onboarding first' 
      }, { status: 400 })
    }

    // Create onboarding data object
    const onboardingData = {
      tone: user.tone,
      voice: user.voice,
      rawness: user.rawness,
      depth: user.depth,
      learning: user.learning || 'text',
      engagement: user.engagement || 'passive',
      safety: {
        crisisSupport: safetyData.crisisSupport || false,
        contentWarnings: safetyData.contentWarnings || false,
        skipTriggers: safetyData.skipTriggers || false
      },
      goals: safetyData.goals || [],
      experience: safetyData.experience || 'beginner',
      timeCommitment: safetyData.timeCommitment || '15min'
    }

    console.log('Starting personalized questions generation...')
    console.log('Onboarding data:', JSON.stringify(onboardingData, null, 2))

    // Generate personalized questions
    const analyzer = new AIOnboardingAnalyzer()
    const { analysis, questions } = await analyzer.analyzeOnboardingAndGenerateQuestions(onboardingData)

    console.log('Generated analysis:', JSON.stringify(analysis, null, 2))
    console.log('Generated questions count:', questions.length)

    if (!questions || questions.length === 0) {
      throw new Error('No questions were generated')
    }

    // Save the analysis and questions to the database
    const updatedSafety = {
      ...safetyData,
      diagnosticAnalysis: analysis,
      personalizedQuestions: questions,
      questionGenerationTimestamp: new Date().toISOString()
    }

    console.log('Saving to database...')
    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    console.log('Successfully saved personalized questions to database')

    return NextResponse.json({
      success: true,
      analysis,
      questions,
      message: 'Personalized diagnostic questions generated successfully'
    })

  } catch (error) {
    console.error('Error generating personalized questions:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to generate personalized questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's personalized questions
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    const analysis = safetyData.diagnosticAnalysis
    const questions = safetyData.personalizedQuestions

    if (!analysis || !questions) {
      return NextResponse.json({ 
        error: 'No personalized questions found. Please complete onboarding first.' 
      }, { status: 404 })
    }

    return NextResponse.json({
      analysis,
      questions,
      generatedAt: safetyData.questionGenerationTimestamp
    })

  } catch (error) {
    console.error('Error fetching personalized questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personalized questions' },
      { status: 500 }
    )
  }
}
