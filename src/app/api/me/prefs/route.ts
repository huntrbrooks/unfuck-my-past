import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const safety = (user?.[0]?.safety ?? {}) as Record<string, unknown>
    return NextResponse.json(safety)
  } catch (error) {
    console.error('Error fetching prefs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



