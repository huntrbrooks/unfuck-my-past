import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries } from '@/db'
import { AIService } from '@/lib/ai-service'
import { eq, desc } from 'drizzle-orm'
import { buildOfflineReport } from '@/lib/offline-report'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Auth with dev fallback
    let uid: string | null = null
    try {
      const a = await auth()
      uid = a.userId
    } catch {}
    if (!uid && process.env.NODE_ENV !== 'production') uid = 'dev-user'
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Accept optional responses from body as a fallback
    const body = await request.json().catch(() => ({} as any))

    let responses = await db.select({
      question: diagnosticResponses.question,
      response: diagnosticResponses.response,
      insight: diagnosticResponses.insight,
      createdAt: diagnosticResponses.createdAt
    }).from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, uid))
      .orderBy(desc(diagnosticResponses.createdAt))
      .limit(50)

    // Fallback A: client provided recent responses
    if (!responses.length && Array.isArray(body?.responses) && body.responses.length > 0) {
      responses = body.responses as any
    }

    // Fallback B: pull most recent stored diagnostic_responses from user_diagnostic_data JSON if ORM table is empty
    if (!responses.length && process.env.DATABASE_URL) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL)
        const data = await sql`
          SELECT diagnostic_responses \n
          FROM user_diagnostic_data \n
          WHERE user_id = ${uid} \n
          LIMIT 1
        `.catch(() => null)
        if (data && Array.isArray(data) && data[0]?.diagnostic_responses) {
          const parsed = Array.isArray(data[0].diagnostic_responses)
            ? data[0].diagnostic_responses
            : JSON.parse(data[0].diagnostic_responses)
          responses = (parsed || []).map((r: any, i: number) => ({
            question: typeof r.question === 'string' ? { question: r.question } : r.question,
            response: r.response,
            insight: r.insight || 'Enhanced response',
            createdAt: new Date().toISOString()
          }))
        }
      } catch {}
    }

    if (!responses.length) return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })

    const userRows = await db.select().from(users).where(eq(users.id, uid)).limit(1)
    if (!userRows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const user = userRows[0]

    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety
    // Enforce one-time regeneration
    if (safetyData?.regeneratedOnce) {
      return NextResponse.json({ error: 'Report has already been regenerated once' }, { status: 400 })
    }
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

    // Include follow-up answers from enhance-data if available
    let merged = [...responses]
    try {
      if (process.env.DATABASE_URL) {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL)
        const followUps = await sql`
          SELECT question, answer, category, created_at FROM diagnostic_followup_responses
          WHERE user_id = ${uid}
          ORDER BY created_at DESC
        `.catch(() => null)
        if (followUps && Array.isArray(followUps)) {
          for (const f of followUps) {
            merged.push({
              question: { question: f.question, category: f.category } as any,
              response: f.answer,
              insight: 'Enhanced response for improved accuracy',
              createdAt: f.created_at,
            } as any)
          }
        }
      }
    } catch {}
    // Merge any followUps sent from client (ids and text only)
    if (body?.followUps && typeof body.followUps === 'object') {
      for (const [id, ans] of Object.entries(body.followUps as Record<string, string>)) {
        const q = id.toString()
        merged.push({
          question: { question: q },
          response: String(ans),
          insight: 'Enhanced response for improved accuracy',
          createdAt: new Date().toISOString(),
        } as any)
      }
    }

    const allResponses = merged
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
      // Fallback to offline report so the user is never blocked
      const offline = buildOfflineReport(
        allResponses.map(r => ({ question: r.question, response: r.response, insight: r.insight })),
        { tone: userPreferences.tone, voice: userPreferences.voice }
      )
      outReport = offline
      outModel = 'offline'
      outTs = new Date().toISOString()
    }

    const now = new Date()
    await db.insert(diagnosticSummaries).values({
      userId: uid,
      type: 'comprehensive_report',
      summary: outReport,
      createdAt: now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: [diagnosticSummaries.userId, diagnosticSummaries.type],
      set: { summary: outReport, updatedAt: now }
    })

    // Mark regeneration used
    await db.update(users).set({ safety: { ...(safetyData || {}), regeneratedOnce: true } }).where(eq(users.id, uid))

    return NextResponse.json({ report: outReport, model: outModel, timestamp: outTs, regeneratedOnce: true })
  } catch (error) {
    console.error('Error regenerating structured report:', error)
    return NextResponse.json({ error: 'Failed to regenerate structured report' }, { status: 500 })
  }
}
 
