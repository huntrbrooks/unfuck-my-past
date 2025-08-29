import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, answers } from '../../../../db'
import { AIService } from '../../../../lib/ai-service'
import { generateAIPrompt } from '../../../../lib/diagnostic-questions'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Temporarily disable authentication for testing
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Use a test user ID for now
    const userId = 'test-user-123'

    const body = await request.json()
    const { question, response, useClaude = false } = body

    if (!question || !response) {
      return NextResponse.json({ error: 'Question and response are required' }, { status: 400 })
    }

    // Get user preferences for AI prompt generation using Drizzle ORM
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User preferences not found' }, { status: 404 })
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

    // Generate AI prompt
    const prompt = generateAIPrompt(question, userPreferences)

    // Generate insight using AI
    const aiService = new AIService()
    const insight = await aiService.generateInsight(prompt, response, useClaude)

    // Save the response and insight to database using Drizzle ORM
    await db.insert(answers).values({
      userId: userId,
      questionId: question.id,
      modality: 'text',
      content: response,
      summary: insight.insight
    })

    return NextResponse.json({
      insight: insight.insight,
      model: insight.model,
      timestamp: insight.timestamp
    })

  } catch (error) {
    console.error('Error generating insight:', error)
    return NextResponse.json(
      { error: 'Failed to generate insight' },
      { status: 500 }
    )
  }
}
