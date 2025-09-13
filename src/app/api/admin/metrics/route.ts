import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses, purchases, progress, analyticsEvents, diagnosticSummaries } from '@/db'
import { and, eq, sql } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Basic KPIs
    const [onboardingCount] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM ${users}`) as any
    const [diagnosticUsers] = await db.execute(sql`SELECT COUNT(DISTINCT ${diagnosticResponses.userId})::int AS c FROM ${diagnosticResponses}`) as any
    const [avgAnswerLen] = await db.execute(sql`SELECT COALESCE(AVG(LENGTH(${diagnosticResponses.response})),0)::float AS v FROM ${diagnosticResponses}`) as any

    const [fullReportPurchases] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM ${purchases} WHERE ${purchases.product} = 'diagnostic'`) as any
    const [programPurchases] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM ${purchases} WHERE ${purchases.product} = 'program'`) as any

    const [programUsersWithProgress] = await db.execute(sql`SELECT COUNT(DISTINCT ${progress.userId})::int AS c FROM ${progress}`) as any
    const [avgProgramMaxDay] = await db.execute(sql`
      SELECT COALESCE(AVG(max_day),0)::float AS v FROM (
        SELECT ${progress.userId}, MAX(${progress.day}) AS max_day
        FROM ${progress}
        GROUP BY ${progress.userId}
      ) t
    `) as any

    const [avgSessionSeconds] = await db.execute(sql`
      SELECT COALESCE(AVG(sess_seconds),0)::float AS v FROM (
        SELECT session_id, EXTRACT(EPOCH FROM (MAX(server_ts) - MIN(server_ts))) AS sess_seconds
        FROM ${analyticsEvents}
        WHERE event IN ('session_start','heartbeat','session_end','page_view')
        GROUP BY session_id
      ) s
    `) as any

    const [avgVisitsPerUser] = await db.execute(sql`
      SELECT COALESCE(AVG(visits),0)::float AS v FROM (
        SELECT COALESCE(${analyticsEvents.userId}, 'anon') AS uid, COUNT(*) FILTER (WHERE event = 'page_view') AS visits
        FROM ${analyticsEvents}
        GROUP BY uid
      ) t
    `) as any

    return NextResponse.json({
      onboardingUsers: onboardingCount?.rows?.[0]?.c ?? 0,
      diagnosticUsers: diagnosticUsers?.rows?.[0]?.c ?? 0,
      avgDiagnosticAnswerChars: Number((avgAnswerLen?.rows?.[0]?.v ?? 0).toFixed(1)),
      purchases: {
        fullReport: fullReportPurchases?.rows?.[0]?.c ?? 0,
        program: programPurchases?.rows?.[0]?.c ?? 0,
      },
      program: {
        usersWithProgress: programUsersWithProgress?.rows?.[0]?.c ?? 0,
        avgFurthestDay: Number((avgProgramMaxDay?.rows?.[0]?.v ?? 0).toFixed(1)),
      },
      engagement: {
        avgSessionSeconds: Number((avgSessionSeconds?.rows?.[0]?.v ?? 0).toFixed(1)),
        avgVisitsPerUser: Number((avgVisitsPerUser?.rows?.[0]?.v ?? 0).toFixed(2))
      }
    })
  } catch (e: any) {
    console.error('admin metrics error', e)
    return NextResponse.json({ error: 'Failed to compute metrics' }, { status: 500 })
  }
}


