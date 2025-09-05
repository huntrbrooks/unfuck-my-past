import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { diagnosticResponses, diagnosticSummaries, purchases, progress, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete diagnostic responses
    await db.delete(diagnosticResponses).where(eq(diagnosticResponses.userId, userId))

    // Delete diagnostic summaries (any type)
    await db.delete(diagnosticSummaries).where(eq(diagnosticSummaries.userId, userId))

    // Deactivate diagnostic purchase (requires new purchase next time)
    await db.update(purchases)
      .set({ active: false })
      .where(and(eq(purchases.userId, userId), eq(purchases.product, 'diagnostic')))

    // Delete saved comprehensive report summary
    await db.delete(diagnosticSummaries)
      .where(and(eq(diagnosticSummaries.userId, userId), eq(diagnosticSummaries.type, 'comprehensive_report')))

    // Reset 30-day program data: delete all progress entries
    await db.delete(progress).where(eq(progress.userId, userId))

    // Clear daily content from user's safety data
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (userResult.length > 0) {
      const user = userResult[0]
      const currentSafety = (typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety) || {}
      
      // Remove daily content but preserve other safety data
      const { dailyContent, ...restSafety } = currentSafety
      
      await db.update(users)
        .set({ safety: restSafety })
        .where(eq(users.id, userId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reset diagnostic data:', error)
    return NextResponse.json({ error: 'Failed to reset diagnostic data' }, { status: 500 })
  }
}


