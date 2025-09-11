import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries } from '@/db'
import { AIService } from '@/lib/ai-service'
import { FullReportSchema } from '@/lib/fullReportSchema'
import { formatReportMarkdown } from '@/lib/formatReport'
import { formatComprehensiveReport } from '@/lib/report-formatter'
import { eq, desc, and } from 'drizzle-orm'
import { buildOfflineReport } from '@/lib/offline-report'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    // Use request to avoid unused variable warning
    if (!request) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    
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
          insight: response.insight || '',
          questionId: (questionData?.id || questionData?.questionId || `${index + 1}`) as string
        }
      })

    // Try structured path first (no fallbacks)
    const aiService = new AIService()
    let normalizedContent: string
    let model = 'unknown'
    let timestamp = new Date().toISOString()
    try {
      const structured = await aiService.generateStructuredFullReport(allResponses, { ...userPreferences, minutesPerDay: 20 })
      // already validated & formatted
      normalizedContent = structured.formatted
      model = structured.model
      timestamp = structured.timestamp
    } catch (e1) {
      console.error('Structured generation error details:', e1)
      return NextResponse.json({ 
        error: 'Structured generation failed', 
        details: e1 instanceof Error ? e1.message : String(e1) 
      }, { status: 502 })
    }

    // Save the comprehensive report to database
    const updatedSafety = {
      ...safetyData,
      comprehensiveReport: {
        content: normalizedContent,
        model,
        timestamp
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    // Also save to diagnosticSummaries table
    await db.insert(diagnosticSummaries).values({
      userId: userId,
      type: 'comprehensive_report',
      summary: normalizedContent,
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: [diagnosticSummaries.userId, diagnosticSummaries.type],
      set: {
        summary: normalizedContent,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      report: normalizedContent,
      model,
      timestamp,
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
    // Use request to avoid unused variable warning
    if (!request) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    
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
    const reportRow = reportResult[0]
    const report = reportRow.summary

    return NextResponse.json({
      success: true,
      report,
      createdAt: reportRow.createdAt
    })

  } catch (error) {
    console.error('Error fetching comprehensive report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comprehensive report' },
      { status: 500 }
    )
  }
}
