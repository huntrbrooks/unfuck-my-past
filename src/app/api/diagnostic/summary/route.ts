import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, answers } from '../../../../db'
import { AIService } from '../../../../lib/ai-service'
import { eq, desc } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Temporarily disable authentication for testing
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Use a test user ID for now
    const userId = 'test-user-123'

    // Get all user responses from the current session using Drizzle ORM
    const answersResult = await db.select({
      questionId: answers.questionId,
      content: answers.content,
      summary: answers.summary,
      createdAt: answers.createdAt
    })
    .from(answers)
    .where(eq(answers.userId, userId))
    .orderBy(desc(answers.createdAt))
    .limit(10)

    if (!answersResult || answersResult.length === 0) {
      return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })
    }

    // Get user preferences using Drizzle ORM
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

    // Format responses for AI summary
    const allResponses = answersResult
      .filter(answer => answer.content && answer.summary) // Filter out null values
      .map((answer, index) => ({
        question: `Question ${index + 1}`,
        response: answer.content || '',
        insight: answer.summary || ''
      }))

    // Generate comprehensive diagnostic summary
    const aiService = new AIService()
    const summary = await aiService.generateDiagnosticSummary(allResponses, userPreferences)

    // Save the summary to database using Drizzle ORM
    const updatedSafety = {
      ...safetyData,
      diagnosticSummary: {
        content: summary.insight,
        model: summary.model,
        timestamp: summary.timestamp
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    return NextResponse.json({
      summary: summary.insight,
      model: summary.model,
      timestamp: summary.timestamp,
      responseCount: allResponses.length
    })

  } catch (error) {
    console.error('Error generating diagnostic summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate diagnostic summary' },
      { status: 500 }
    )
  }
}
