import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { generateStructuredDiagnosticReport, renderLegacyReportFromStructured } from '@/lib/structured-diagnostic-ai'
import { buildEnhancedDiagnosticPrompt } from '@/lib/enhanced-diagnostic-prompt-builder'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    // Use request to avoid unused variable warning
    if (!request) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    
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
      goals: safetyData?.goals || [],
      experience: safetyData?.experience || 'beginner'
    }

    // Format responses for structured generation
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

    // Build enhanced structured prompt with deeper context
    const structuredPrompt = buildEnhancedDiagnosticPrompt({
      responses: allResponses,
      preferences: userPreferences,
      responseCount: allResponses.length,
      // TODO: Add mood history and journal insights when available
      // moodHistory: userMoodHistory,
      // journalInsights: userJournalInsights
    })

    console.log('🔄 Generating structured diagnostic report...')
    
    // Generate structured diagnostic report
    const structuredReport = await generateStructuredDiagnosticReport(structuredPrompt)
    
    // Convert structured report to legacy text format for existing UI
    const legacyReportText = renderLegacyReportFromStructured(structuredReport)

    // Save both structured and legacy formats
    const updatedSafety = {
      ...safetyData,
      comprehensiveReport: {
        content: legacyReportText,
        structuredData: structuredReport,
        model: 'gpt-4o-structured',
        timestamp: new Date().toISOString(),
        regenerated: true,
        regeneratedAt: new Date().toISOString(),
        isStructured: true
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    // Also save to diagnosticSummaries table
    await db.insert(diagnosticSummaries).values({
      userId: userId,
      type: 'comprehensive_report',
      summary: legacyReportText,
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: [diagnosticSummaries.userId, diagnosticSummaries.type],
      set: {
        summary: legacyReportText,
        updatedAt: new Date()
      }
    })

    console.log('✅ Structured report regenerated successfully')

    return NextResponse.json({
      report: legacyReportText,
      structuredData: structuredReport,
      model: 'gpt-4o-structured',
      timestamp: new Date().toISOString(),
      responseCount: allResponses.length,
      regenerated: true,
      isStructured: true
    })

  } catch (error) {
    console.error('Error regenerating structured diagnostic report:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate structured diagnostic report' },
      { status: 500 }
    )
  }
}
