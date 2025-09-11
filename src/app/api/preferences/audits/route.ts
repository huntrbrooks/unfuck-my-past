import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, preferenceAudits } from '@/db'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const audits = await db
      .select()
      .from(preferenceAudits)
      .where(eq(preferenceAudits.userId, userId))
      .orderBy(desc(preferenceAudits.id))
      .limit(25)

    return NextResponse.json({ audits })
  } catch (error) {
    console.error('Error listing preference audits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const auditId = Number(body?.auditId)
    if (!auditId) return NextResponse.json({ error: 'auditId required' }, { status: 400 })

    const auditRows = await db
      .select()
      .from(preferenceAudits)
      .where(eq(preferenceAudits.id, auditId))
      .limit(1)

    if (!auditRows.length) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    const snapshot = auditRows[0].changes as Record<string, unknown>

    const current = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const currentSafety = (current?.[0]?.safety ?? {}) as Record<string, unknown>
    const nextSafety = { ...currentSafety, ...snapshot }

    await db.update(users).set({ safety: nextSafety }).where(eq(users.id, userId))

    await db.insert(preferenceAudits).values({ userId, changes: snapshot })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error reverting preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



