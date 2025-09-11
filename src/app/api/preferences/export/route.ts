import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, diagnosticSummaries, journals, moods, progress, purchases, answers } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const resp = await db.select().from(diagnosticResponses).where(eq(diagnosticResponses.userId, userId))
    const sums = await db.select().from(diagnosticSummaries).where(eq(diagnosticSummaries.userId, userId))
    const js = await db.select().from(journals).where(eq(journals.userId, userId))
    const ms = await db.select().from(moods).where(eq(moods.userId, userId))
    const prs = await db.select().from(progress).where(eq(progress.userId, userId))
    const buys = await db.select().from(purchases).where(eq(purchases.userId, userId))
    const ans = await db.select().from(answers).where(eq(answers.userId, userId))

    const jsonBlob = {
      user: user || null,
      preferences: (user?.safety ?? {}) as Record<string, unknown>,
      diagnosticResponses: resp,
      diagnosticSummaries: sums,
      journals: js,
      moods: ms,
      progress: prs,
      purchases: buys,
      answers: ans,
    }

    return new NextResponse(JSON.stringify(jsonBlob, null, 2), {
      headers: {
        'content-type': 'application/json',
        'content-disposition': 'attachment; filename="export.json"'
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



