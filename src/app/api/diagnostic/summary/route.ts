import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries } from '../../../../db'
import { AIService } from '../../../../lib/ai-service'
import { eq, desc } from 'drizzle-orm'

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences and existing summary
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    // Check if there's an existing diagnostic summary
    if (safetyData.diagnosticSummary) {
      return NextResponse.json({
        summary: safetyData.diagnosticSummary.content,
        keyInsights: safetyData.keyInsights?.content || '',
        model: safetyData.diagnosticSummary.model,
        timestamp: safetyData.diagnosticSummary.timestamp
      })
    }

    return NextResponse.json({ summary: '', keyInsights: '' })

  } catch (error) {
    console.error('Error fetching diagnostic summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagnostic summary' },
      { status: 500 }
    )
  }
}

export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user responses from the current session using Drizzle ORM
    const responsesResult = await db.select({
      question: diagnosticResponses.question,
      response: diagnosticResponses.response,
      insight: diagnosticResponses.insight,
      createdAt: diagnosticResponses.createdAt
    })
    .from(diagnosticResponses)
    .where(eq(diagnosticResponses.userId, userId))
    .orderBy(desc(diagnosticResponses.createdAt))
    .limit(10)

    if (!responsesResult || responsesResult.length === 0) {
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
    const allResponses = responsesResult
      .filter(response => response.response && response.insight) // Filter out null values
      .map((response, index) => {
        const questionData = typeof response.question === 'string' 
          ? JSON.parse(response.question) 
          : response.question
        return {
          question: questionData?.question || `Question ${index + 1}`,
          response: response.response || '',
          insight: response.insight || ''
        }
      })

    // Generate short, intriguing diagnostic summary and key insights
    const aiService = new AIService()
    const summary = await aiService.generateDiagnosticSummary(allResponses, userPreferences)
    const keyInsights = await aiService.generateKeyInsights(allResponses, userPreferences)

    // Save the summary and insights to database using Drizzle ORM
    const updatedSafety = {
      ...safetyData,
      diagnosticSummary: {
        content: summary.insight,
        model: summary.model,
        timestamp: summary.timestamp
      },
      keyInsights: {
        content: keyInsights.insight,
        model: keyInsights.model,
        timestamp: keyInsights.timestamp
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    // Also save to diagnosticSummaries table for comprehensive report access
    await db.insert(diagnosticSummaries).values({
      userId: userId,
      type: 'comprehensive',
      summary: summary.insight,
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: [diagnosticSummaries.userId, diagnosticSummaries.type],
      set: {
        summary: summary.insight,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      summary: summary.insight,
      keyInsights: keyInsights.insight,
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
