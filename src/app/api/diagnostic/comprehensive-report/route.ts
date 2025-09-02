import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries } from '@/db'
import { AIService } from '@/lib/ai-service'
import { eq, desc, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has paid for the comprehensive report
    // This would typically check against a payments table
    // For now, we'll allow access but in production this should verify payment

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
    .limit(20) // Get more responses for comprehensive analysis

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

    // Format responses for AI comprehensive analysis
    const allResponses = responsesResult
      .filter(response => response.response && response.insight)
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

    // Generate comprehensive diagnostic report using GPT-4.1
    const aiService = new AIService()
    const comprehensiveReport = await aiService.generateComprehensiveReport(allResponses, userPreferences)

    // Save the comprehensive report to database
    const updatedSafety = {
      ...safetyData,
      comprehensiveReport: {
        content: comprehensiveReport.insight,
        model: comprehensiveReport.model,
        timestamp: comprehensiveReport.timestamp
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    // Also save to diagnosticSummaries table
    await db.insert(diagnosticSummaries).values({
      userId: userId,
      type: 'comprehensive_report',
      summary: comprehensiveReport.insight,
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: [diagnosticSummaries.userId, diagnosticSummaries.type],
      set: {
        summary: comprehensiveReport.insight,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      report: comprehensiveReport.insight,
      model: comprehensiveReport.model,
      timestamp: comprehensiveReport.timestamp,
      responseCount: allResponses.length
    })

  } catch (error) {
    console.error('Error generating comprehensive report:', error)
    return NextResponse.json(
      { error: 'Failed to generate comprehensive report' },
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

    // Get the comprehensive report from database
    const reportResult = await db
      .select()
      .from(diagnosticSummaries)
      .where(and(
        eq(diagnosticSummaries.userId, userId),
        eq(diagnosticSummaries.type, 'comprehensive_report')
      ))
      .limit(1)

    if (reportResult.length === 0) {
      return NextResponse.json({ error: 'No comprehensive report found' }, { status: 404 })
    }

    // The report is stored as plain text, not JSON
    const report = reportResult[0].summary

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Error fetching comprehensive report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comprehensive report' },
      { status: 500 }
    )
  }
}
