import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries, journals, moods, progress, purchases, answers } from '@/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Optional confirmation token/body can be checked here
    const body = await req.json().catch(() => ({}))
    if (!body?.confirm) {
      return NextResponse.json({ error: 'Missing confirmation' }, { status: 400 })
    }

    // Delete user data (keep user row but clear safety)
    await db.update(users).set({ safety: {} }).where(eq(users.id, userId))
    await db.delete(diagnosticResponses).where(eq(diagnosticResponses.userId, userId))
    await db.delete(diagnosticSummaries).where(eq(diagnosticSummaries.userId, userId))
    await db.delete(journals).where(eq(journals.userId, userId))
    await db.delete(moods).where(eq(moods.userId, userId))
    await db.delete(progress).where(eq(progress.userId, userId))
    await db.delete(purchases).where(eq(purchases.userId, userId))
    await db.delete(answers).where(eq(answers.userId, userId))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



