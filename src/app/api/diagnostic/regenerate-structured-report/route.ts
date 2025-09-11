import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries } from '@/db'
import { AIService } from '@/lib/ai-service'
import { eq, desc, and } from 'drizzle-orm'
import { buildOfflineReport } from '@/lib/offline-report'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const responses = await db.select({
      question: diagnosticResponses.question,
      response: diagnosticResponses.response,
      insight: diagnosticResponses.insight,
      createdAt: diagnosticResponses.createdAt
    }).from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, userId))
      .orderBy(desc(diagnosticResponses.createdAt))
      .limit(50)

    if (!responses.length) return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!userRows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const user = userRows[0]

    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety
    const userPreferences = {
      tone: user.tone || 'gentle',
      voice: user.voice || 'friend',
      rawness: user.rawness || 'moderate',
      depth: user.depth || 'moderate',
      learning: user.learning || 'text',
      engagement: user.engagement || 'passive',
      goals: safetyData?.goals || [],
      experience: safetyData?.experience || 'beginner',
      minutesPerDay: 20
    }

    const allResponses = responses
      .filter(r => r.response && r.insight)
      .map((r, i) => {
        const q = typeof r.question === 'string' ? JSON.parse(r.question as unknown as string) : r.question
        return { question: q?.question || `Question ${i + 1}`, response: r.response || '', insight: r.insight || '' }
      })

    const ai = new AIService()
    let outReport = ''
    let outModel = 'unknown'
    let outTs = new Date().toISOString()
    try {
      const structured = await ai.generateStructuredFullReport(allResponses, userPreferences)
      outReport = structured.formatted
      outModel = structured.model
      outTs = structured.timestamp
    } catch (e1) {
      return NextResponse.json({ error: 'Structured generation failed' }, { status: 502 })
    }

    const now = new Date()
    await db.insert(diagnosticSummaries).values({
      userId,
      type: 'comprehensive_report',
      summary: outReport,
      createdAt: now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: [diagnosticSummaries.userId, diagnosticSummaries.type],
      set: { summary: outReport, updatedAt: now }
    })

    return NextResponse.json({ report: outReport, model: outModel, timestamp: outTs })
  } catch (error) {
    console.error('Error regenerating structured report:', error)
    return NextResponse.json({ error: 'Failed to regenerate structured report' }, { status: 500 })
  }
}
 
