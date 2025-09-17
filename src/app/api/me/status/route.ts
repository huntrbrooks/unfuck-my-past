import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticSummaries } from '@/db'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  try {
    let userId: string | null = null
    try {
      const authRes = await auth()
      userId = authRes.userId
    } catch (e) {}
    if (!userId && process.env.NODE_ENV !== 'production') {
      userId = 'dev-user'
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const user = userRows[0]

    const onboardingCompleted = Boolean(
      user && user.tone && user.voice && user.rawness && user.depth
    )

    // Prefer safety.diagnosticSummary, fallback to diagnosticSummaries table
    const safetyData: any = user && (typeof user.safety === 'string' ? JSON.parse(user.safety as any) : user.safety)
    const hasSafetySummary = Boolean(safetyData && safetyData.diagnosticSummary && safetyData.diagnosticSummary.content)

    let hasSummaryRow = false
    if (!hasSafetySummary) {
      const sum = await db.select().from(diagnosticSummaries).where(eq(diagnosticSummaries.userId, userId)).limit(1)
      hasSummaryRow = sum.length > 0
    }

    // Consider questions generated as a ready state that unlocks dashboard
    const hasQuestions = Boolean(safetyData && Array.isArray(safetyData.personalizedQuestions) && safetyData.personalizedQuestions.length > 0)
    const diagnosticCompleted = Boolean(hasSafetySummary || hasSummaryRow || hasQuestions)

    const nextStep = !onboardingCompleted ? 'onboarding' : (!diagnosticCompleted ? 'diagnostic' : 'unlocked')

    return NextResponse.json({ onboardingCompleted, diagnosticCompleted, nextStep })
  } catch (error) {
    console.error('status endpoint error', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}


