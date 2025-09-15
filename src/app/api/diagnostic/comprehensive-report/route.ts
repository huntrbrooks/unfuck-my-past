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
    
    // Check for enhanced diagnostic data from follow-up questions
    let enhancedResponses = [...responsesResult]
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL!)
      
      // Get follow-up responses if they exist
      const followUpData = await sql`
        SELECT * FROM diagnostic_followup_responses 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `.catch(() => null) // Gracefully handle if table doesn't exist
      
      if (followUpData && Array.isArray(followUpData) && followUpData.length > 0) {
        // Add follow-up responses to the main responses
        followUpData.forEach((followUp: any) => {
          enhancedResponses.push({
            question: { text: followUp.question, category: followUp.category, isFollowUp: true } as any,
            response: followUp.answer,
            insight: 'Enhanced response for improved accuracy',
            createdAt: followUp.created_at
          })
        })
      }
      
      // Get confidence score if available
      const confidenceData = await sql`
        SELECT confidence_score FROM user_diagnostic_data 
        WHERE user_id = ${userId}
        LIMIT 1
      `.catch(() => null)
      
      // Log enhanced data usage for debugging
      if (followUpData && followUpData.length > 0) {
        console.log(`Using enhanced data: ${followUpData.length} follow-up responses, confidence: ${confidenceData?.[0]?.confidence_score || 'N/A'}`)
      }
    } catch (error) {
      console.warn('Could not fetch enhanced diagnostic data:', error)
      // Continue with regular responses if enhanced data unavailable
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
    // Use enhanced responses if available
    const allResponses = enhancedResponses
      .filter(response => response.response && response.insight)
      .map((response, index) => {
        const questionData = typeof response.question === 'string' 
          ? JSON.parse(response.question) 
          : response.question
        return {
          question: questionData?.question || questionData?.text || `Question ${index + 1}`,
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
      // Fallback: generate an offline report so users still get value
      const offline = buildOfflineReport(
        allResponses.map(r => ({ question: r.question, response: r.response, insight: r.insight })),
        { tone: userPreferences.tone, voice: userPreferences.voice }
      )
      normalizedContent = offline
      model = 'offline'
      timestamp = new Date().toISOString()
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

    // Get the comprehensive report from database (most recent)
    const reportResult = await db
      .select()
      .from(diagnosticSummaries)
      .where(and(
        eq(diagnosticSummaries.userId, userId),
        eq(diagnosticSummaries.type, 'comprehensive_report')
      ))
      .orderBy(desc(diagnosticSummaries.updatedAt), desc(diagnosticSummaries.createdAt))
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
