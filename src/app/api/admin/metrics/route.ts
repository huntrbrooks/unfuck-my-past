import { NextRequest, NextResponse } from 'next/server'
import { db, users, diagnosticResponses, purchases, progress, analyticsEvents } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  try {
    // Basic KPIs via Drizzle selects
    const [{ c: onboardingUsers }] = await db
      .select({ c: sql<number>`cast(count(*) as int)` })
      .from(users)

    const [{ c: diagnosticUsers }] = await db
      .select({ c: sql<number>`cast(count(distinct ${diagnosticResponses.userId}) as int)` })
      .from(diagnosticResponses)

    const [{ v: avgDiagnosticAnswerCharsRaw }] = await db
      .select({ v: sql<number>`coalesce(avg(length(${diagnosticResponses.response})), 0)` })
      .from(diagnosticResponses)

    const [{ c: fullReport }] = await db
      .select({ c: sql<number>`cast(count(*) as int)` })
      .from(purchases)
      .where(sql`${purchases.product} = 'diagnostic'`)

    const [{ c: program }] = await db
      .select({ c: sql<number>`cast(count(*) as int)` })
      .from(purchases)
      .where(sql`${purchases.product} = 'program'`)

    const [{ c: usersWithProgress }] = await db
      .select({ c: sql<number>`cast(count(distinct ${progress.userId}) as int)` })
      .from(progress)

    const [{ v: avgFurthestDayRaw }] = await db
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
      .limit(1)

    const [{ v: avgSessionSecondsRaw }] = await db
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
      .limit(1)

    const [{ v: avgVisitsPerUserRaw }] = await db
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
      .limit(1)

    return NextResponse.json({
      onboardingUsers: Number(onboardingUsers ?? 0),
      diagnosticUsers: Number(diagnosticUsers ?? 0),
      avgDiagnosticAnswerChars: Number((avgDiagnosticAnswerCharsRaw ?? 0).toFixed?.(1) ?? 0),
      purchases: {
        fullReport: Number(fullReport ?? 0),
        program: Number(program ?? 0),
      },
      program: {
        usersWithProgress: Number(usersWithProgress ?? 0),
        avgFurthestDay: Number((avgFurthestDayRaw ?? 0).toFixed?.(1) ?? 0),
      },
      engagement: {
        avgSessionSeconds: Number((avgSessionSecondsRaw ?? 0).toFixed?.(1) ?? 0),
        avgVisitsPerUser: Number((avgVisitsPerUserRaw ?? 0).toFixed?.(2) ?? 0)
      }
    })
  } catch (e: any) {
    console.error('admin metrics error', e)
    return NextResponse.json({ error: 'Failed to compute metrics' }, { status: 500 })
  }
}


