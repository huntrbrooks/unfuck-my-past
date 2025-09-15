import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses } from '@/db'
import { eq, desc } from 'drizzle-orm'

type MissingDataItem = {
  category: string
  description: string
  importance: 'high' | 'medium' | 'low'
}

const DEFAULT_MISSING: MissingDataItem[] = [
  { category: 'Coping Mechanisms', description: 'No detail on how you currently manage your urges', importance: 'high' },
  { category: 'Communication Patterns', description: 'Unclear how you communicate your boundaries', importance: 'high' },
  { category: 'Support System', description: 'Limited information about your support network', importance: 'medium' },
  { category: 'Daily Routines', description: 'Missing details about your daily habits and routines', importance: 'medium' },
  { category: 'Triggers & Stressors', description: 'Little clarity on what situations are most challenging', importance: 'high' },
  { category: 'Relationships', description: 'Unclear patterns in relationships that may impact healing', importance: 'medium' },
  { category: 'Future Vision', description: 'Goals and markers of progress need clarification', importance: 'medium' },
  { category: 'Physical Health', description: 'Limited insight into mind-body connection and care', importance: 'low' }
]

function calculateConfidence(baseCount: number, followUpCount: number): number {
  // Base confidence from original responses (max 70%)
  const baseComponent = Math.min(70, baseCount * 10)
  // Increased contribution from follow-ups so users can reach 95% even with fewer base answers
  // Each follow-up adds up to ~7 points, capped at 55 from follow-ups overall
  const followUpBonus = Math.min(55, followUpCount * 7)
  const total = baseComponent + followUpBonus
  // Ensure between 20 and 95
  return Math.max(20, Math.min(95, Math.round(total)))
}

async function loadFollowUps(userId: string) {
  if (!process.env.DATABASE_URL) return { rows: [], count: 0, categories: new Set<string>() }
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    const rows = await sql`
      SELECT question, answer, category, created_at
      FROM diagnostic_followup_responses
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `.catch(() => []) as any[]
    const categories = new Set<string>()
    for (const r of rows) {
      if (r?.category) categories.add(String(r.category))
    }
    return { rows, count: rows.length, categories }
  } catch {
    return { rows: [], count: 0, categories: new Set<string>() }
  }
}

async function loadPersistedConfidence(userId: string): Promise<number | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    const res = await sql`
      SELECT confidence_score
      FROM user_diagnostic_data
      WHERE user_id = ${userId}
      LIMIT 1
    `.catch(() => null) as any
    const val = res?.[0]?.confidence_score
    if (typeof val === 'number' && !Number.isNaN(val)) return Math.max(0, Math.min(100, Math.round(val)))
    return null
  } catch {
    return null
  }
}

function computeMissingData(answeredCategories: Set<string>): MissingDataItem[] {
  // Prioritize high -> medium -> low and remove categories already covered
  const missing = DEFAULT_MISSING.filter(m => !answeredCategories.has(m.category))
  // Cap to top 4 most important items for brevity
  const importanceOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 }
  return missing
    .sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance])
    .slice(0, 4)
}

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

    const body = await request.json().catch(() => ({} as any))
    const providedResponses = Array.isArray(body?.diagnosticResponses) ? body.diagnosticResponses : null
    const providedFollowUps: Array<{ id?: string; category?: string }> = Array.isArray(body?.followUps)
      ? body.followUps
      : []

    // Load base diagnostic responses
    let baseResponsesCount = 0
    if (providedResponses) {
      baseResponsesCount = providedResponses.length
    } else {
      const rows = await db.select({
        question: diagnosticResponses.question,
        response: diagnosticResponses.response,
        insight: diagnosticResponses.insight,
        createdAt: diagnosticResponses.createdAt
      }).from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, uid))
      .orderBy(desc(diagnosticResponses.createdAt))
      .limit(50)
      baseResponsesCount = rows.length
    }

    // Load follow-ups and any persisted confidence
    const followUps = await loadFollowUps(uid)
    const extraCategories = new Set<string>()
    for (const f of providedFollowUps) {
      if (f?.category) extraCategories.add(String(f.category))
    }
    const combinedCategories = new Set<string>([
      ...Array.from(followUps.categories),
      ...Array.from(extraCategories)
    ])
    const combinedFollowUpCount = followUps.count + providedFollowUps.length
    const persisted = await loadPersistedConfidence(uid)

    const answeredCategories = combinedCategories
    const missingData = computeMissingData(answeredCategories)

    // Compute a fresh confidence based on currently known answers (including just-submitted ones)
    const computedNow = calculateConfidence(baseResponsesCount, combinedFollowUpCount)

    // If we have a persisted value, prefer the higher of the two to avoid stale DB values
    // from masking recent client-side answers that haven't been written yet.
    const confidence = typeof persisted === 'number'
      ? Math.max(Math.max(20, Math.min(95, persisted)), computedNow)
      : computedNow

    return NextResponse.json({ confidence, missingData })
  } catch (error) {
    console.error('Error analyzing confidence:', error)
    return NextResponse.json({ error: 'Failed to analyze confidence' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Auth with dev fallback
    let uid: string | null = null
    try {
      const a = await auth()
      uid = a.userId
    } catch {}
    if (!uid && process.env.NODE_ENV !== 'production') uid = 'dev-user'
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Count base responses
    const rows = await db.select({ id: diagnosticResponses.createdAt })
      .from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, uid))
      .orderBy(desc(diagnosticResponses.createdAt))
      .limit(50)
    const baseResponsesCount = rows.length

    const followUps = await loadFollowUps(uid)
    const persisted = await loadPersistedConfidence(uid)
    const answeredCategories = followUps.categories
    const missingData = computeMissingData(answeredCategories)
    const computedNow = calculateConfidence(baseResponsesCount, followUps.count)
    const confidence = typeof persisted === 'number'
      ? Math.max(Math.max(20, Math.min(95, persisted)), computedNow)
      : computedNow

    return NextResponse.json({ confidence, missingData })
  } catch (error) {
    console.error('Error analyzing confidence (GET):', error)
    return NextResponse.json({ error: 'Failed to analyze confidence' }, { status: 500 })
  }
}
