import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '@/db'
import { eq } from 'drizzle-orm'
import { HSI_QUESTIONS, scoreHSI } from '@/lib/hsi'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Always return the static HSI questions
    return NextResponse.json({ questions: HSI_QUESTIONS })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load HSI questions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { trueIds?: number[] }
    const trueIds = Array.isArray(body.trueIds) ? body.trueIds.filter(n => Number.isInteger(n)) : []
    const result = scoreHSI(trueIds)

    // Persist into safety blob for later reporting, but do not affect diagnostic counts
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const user = rows[0]
    const safety = typeof user.safety === 'string' ? JSON.parse(user.safety) : (user.safety || {})
    const nextSafety = { ...safety, hsi: { result, answeredAt: new Date().toISOString() } }
    await db.update(users).set({ safety: nextSafety }).where(eq(users.id, userId))

    return NextResponse.json({ result })
  } catch (e) {
    console.error('HSI save error:', e)
    return NextResponse.json({ error: 'Failed to save HSI' }, { status: 500 })
  }
}


