import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries } from '@/db'
import { AIService } from '@/lib/ai-service'
import { eq, desc } from 'drizzle-orm'
import { formatComprehensiveReport } from '@/lib/report-formatter'
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
      experience: safetyData?.experience || 'beginner'
    }

    const allResponses = responses
      .filter(r => r.response && r.insight)
      .map((r, i) => {
        const q = typeof r.question === 'string' ? JSON.parse(r.question as unknown as string) : r.question
        return { question: q?.question || `Question ${i + 1}`, response: r.response || '', insight: r.insight || '' }
      })

    return NextResponse.json({ error: 'Legacy regenerate is disabled' }, { status: 400 })
  } catch (error) {
    console.error('Error regenerating legacy report:', error)
    return NextResponse.json({ error: 'Failed to regenerate report' }, { status: 500 })
  }
}

 
