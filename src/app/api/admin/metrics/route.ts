import { NextRequest, NextResponse } from 'next/server'
import { db, users, diagnosticResponses, purchases, progress, analyticsEvents } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  try {
    // Helpers: safe query wrappers that return defaults if tables are missing
    const safeCount = async (fn: () => Promise<Array<{ c: number }>>): Promise<number> => {
      try { const r = await fn(); return Number(r?.[0]?.c ?? 0) } catch (e) { console.warn('safeCount error', e); return 0 }
    }
    const safeNumber = async (fn: () => Promise<Array<{ v: number }>>, digits?: number): Promise<number> => {
      try { const r = await fn(); const v = Number(r?.[0]?.v ?? 0); return typeof digits === 'number' ? Number(v.toFixed(digits)) : v } catch (e) { console.warn('safeNumber error', e); return 0 }
    }

    const onboardingUsers = await safeCount(() => db.select({ c: sql<number>`cast(count(*) as int)` }).from(users))

    const diagnosticUsers = await safeCount(() => db
      .select({ c: sql<number>`cast(count(distinct ${diagnosticResponses.userId}) as int)` })
      .from(diagnosticResponses))

    const avgDiagnosticAnswerChars = await safeNumber(() => db
      .select({ v: sql<number>`coalesce(avg(length(${diagnosticResponses.response})), 0)` })
      .from(diagnosticResponses), 1)

    const fullReport = await safeCount(() => db
      .select({ c: sql<number>`cast(count(*) as int)` })
      .from(purchases)
      .where(sql`${purchases.product} = 'diagnostic'`))

    const program = await safeCount(() => db
      .select({ c: sql<number>`cast(count(*) as int)` })
      .from(purchases)
      .where(sql`${purchases.product} = 'program'`))

    const usersWithProgress = await safeCount(() => db
      .select({ c: sql<number>`cast(count(distinct ${progress.userId}) as int)` })
      .from(progress))

    const avgFurthestDay = await safeNumber(() => db
      .select({
        v: sql<number>`coalesce(
          (select avg(max_day) from (
            select ${progress.userId} as uid, max(${progress.day}) as max_day
            from ${progress}
            group by ${progress.userId}
          ) t), 0
        )`
      })
      .from(progress)
      .limit(1), 1)

    const avgSessionSeconds = await safeNumber(() => db
      .select({
        v: sql<number>`coalesce(
          (select avg(sess_seconds) from (
            select session_id, extract(epoch from (max(server_ts) - min(server_ts))) as sess_seconds
            from ${analyticsEvents}
            where event in ('session_start','heartbeat','session_end','page_view')
            group by session_id
          ) s), 0
        )`
      })
      .from(analyticsEvents)
      .limit(1), 1)

    const avgVisitsPerUser = await safeNumber(() => db
      .select({
        v: sql<number>`coalesce(
          (select avg(visits) from (
            select coalesce(${analyticsEvents.userId}, 'anon') as uid,
                   count(*) filter (where event = 'page_view') as visits
            from ${analyticsEvents}
            group by uid
          ) t), 0
        )`
      })
      .from(analyticsEvents)
      .limit(1), 2)

    return NextResponse.json({
      onboardingUsers,
      diagnosticUsers,
      avgDiagnosticAnswerChars,
      purchases: { fullReport, program },
      program: { usersWithProgress, avgFurthestDay },
      engagement: { avgSessionSeconds, avgVisitsPerUser }
    })
  } catch (e: any) {
    console.error('admin metrics error', e)
    return NextResponse.json({ error: 'Failed to compute metrics' }, { status: 500 })
  }
}


