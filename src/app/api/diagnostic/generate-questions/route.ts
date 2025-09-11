import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '../../../../db'
import { eq } from 'drizzle-orm'
import { generateDiagnosticQuestions } from '../../../../lib/diagnostic/generate'
import { mapLegacyToOnboardingPrefs } from '../../../../lib/diagnostic/mapper'
import { HSI_QUESTIONS } from '@/lib/hsi'

export async function POST() {
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

    // Map legacy onboarding data to new format
    const legacyData = {
      tone: user.tone || 'gentle',
      voice: user.voice || 'friend',
      rawness: user.rawness || 'moderate',
      depth: user.depth || 'moderate',
      learning: user.learning || 'text',
      engagement: user.engagement || 'passive',
      safety: safetyData
    }
    
    const onboardingPrefs = mapLegacyToOnboardingPrefs(legacyData)
    console.log('Starting personalized questions generation...')
    console.log('Mapped onboarding preferences:', JSON.stringify(onboardingPrefs, null, 2))

    // Generate questions using the new system
    const result = generateDiagnosticQuestions({ 
      onboarding: onboardingPrefs,
      nowISO: new Date().toISOString()
    })

    console.log('Successfully generated questions:', result.count)
    console.log('Generation rationale:', result.rationale)

    // Convert new format to legacy format for backward compatibility
    const legacyQuestions = result.questions.map((q, index) => ({
      id: index + 1,
      category: q.category,
      question: q.prompt,
      followUp: q.helper,
      options: [],
      adaptive: {
        tone: onboardingPrefs.tones,
        rawness: [onboardingPrefs.guidanceStrength],
        depth: [onboardingPrefs.depth]
      },
      aiPrompt: `Analyze this response for patterns related to: ${q.tags.join(', ')}`
    }))

    // Create analysis object for backward compatibility
    const analysis = {
      focusAreas: [onboardingPrefs.primaryFocus],
      communicationStyle: onboardingPrefs.tones.join(', '),
      intensityLevel: onboardingPrefs.guidanceStrength,
      depthLevel: onboardingPrefs.depth,
      customCategories: result.questions.map(q => q.category),
      recommendedQuestionCount: result.count,
      rationale: result.rationale
    }

    if (!legacyQuestions || legacyQuestions.length === 0) {
      throw new Error('No questions were generated')
    }

    // Save the analysis and questions to the database
    const updatedSafety = {
      ...safetyData,
      diagnosticAnalysis: analysis,
      personalizedQuestions: legacyQuestions,
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
      questions: legacyQuestions,
      hsi: { questions: HSI_QUESTIONS },
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

export async function GET() {
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
