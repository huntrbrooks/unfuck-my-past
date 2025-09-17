import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '../../../../db'
import { eq } from 'drizzle-orm'
// Switched to AI-driven question generation per product requirements
import { AIOnboardingAnalyzer } from '../../../../lib/ai-onboarding-analyzer'
import { HSI_QUESTIONS } from '@/lib/hsi'

// Ensure Node.js runtime for DB driver compatibility and external fetches
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Dev/preview failure switch
    const previewFail = request.headers.get('x-preview-fail') === 'true' || request.nextUrl.searchParams.get('previewFail') === 'true'
    if (previewFail) {
      return NextResponse.json({ error: 'Preview: forced question generation failure' }, { status: 500 })
    }

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

    // Build AI onboarding payload
    const onboardingData = {
      tone: user.tone || 'gentle',
      voice: user.voice || 'friend',
      rawness: user.rawness || 'moderate',
      depth: user.depth || 'moderate',
      learning: user.learning || 'text',
      engagement: user.engagement || 'moderate',
      goals: safetyData?.goals || [],
      experience: safetyData?.experience || 'beginner',
      timeCommitment: safetyData?.timePerDay || safetyData?.timeCommitment || '15min',
      safety: {
        crisisSupport: !!safetyData?.crisisSupport,
        contentWarnings: !!safetyData?.contentWarnings,
        skipTriggers: !!safetyData?.skipTriggers,
        topicsToAvoid: safetyData?.topicsToAvoid || [],
        triggerWords: safetyData?.triggerWords || ''
      }
    }

    console.log('Starting AI-based question generation...')
    const analyzer = new AIOnboardingAnalyzer({ allowFallback: false })
    const { analysis, questions } = await analyzer.analyzeOnboardingAndGenerateQuestions(onboardingData)

    console.log('AI successfully generated questions:', questions.length)

    // Convert AI format to legacy format for backward compatibility
    const legacyQuestions = questions.map((q, index) => ({
      id: index + 1,
      category: q.category,
      question: q.question,
      followUp: q.followUp,
      options: Array.isArray(q.options) ? q.options : [],
      adaptive: q.adaptive || {
        tone: [onboardingData.tone],
        rawness: [onboardingData.rawness],
        depth: [onboardingData.depth]
      },
      aiPrompt: q.aiPrompt || 'Analyze response for patterns and trauma-informed insights.'
    }))

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
