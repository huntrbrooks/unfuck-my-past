import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrefsSchema } from '@/lib/prefsSchema'
import { db, users, preferenceAudits } from '@/db'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = PrefsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = { ...parsed.data }

    // guardrails for crisis
    if (data.crisisNow) {
      data.guidanceStrength = 'mild'
    }

    // Fetch current safety to merge and preserve unrelated fields
    const current = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const currentSafety = (current?.[0]?.safety ?? {}) as Record<string, unknown>

    // Normalize triggerWords: keep as text field; derive array separately if needed client-side
    const nextSafety = {
      ...currentSafety,
      ...data,
    }

    await db.update(users).set({ safety: nextSafety }).where(eq(users.id, userId))

    // Versioning audit (best-effort)
    try {
      await db.insert(preferenceAudits).values({ userId, changes: data })
    } catch (err) {
      // swallow if audits table is missing
      console.warn('preferenceAudits insert failed (non-fatal):', err)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



