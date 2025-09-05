import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '@/db'
import { eq } from 'drizzle-orm'

type Achievement = {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

function getSafety(user: any) {
  return typeof user.safety === 'string' ? JSON.parse(user.safety) : (user.safety || {})
}

function setSafety(safety: any) {
  try { return JSON.stringify(safety) } catch { return '{}' }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!rows?.[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const safety = getSafety(rows[0])
  const list: Achievement[] = safety.achievements || []
  const points = (list.filter((a: Achievement) => a.completed).length * 5) || 0
  return NextResponse.json({ achievements: list, points })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!rows?.[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const user = rows[0]
  const safety = getSafety(user)
  const current: Achievement[] = safety.achievements || []

  // Merge updates
  const updates: Achievement[] = Array.isArray(body.achievements) ? body.achievements : []
  const byId = new Map<string, Achievement>()
  ;[...current, ...updates].forEach(a => byId.set(a.id, a))
  const merged = Array.from(byId.values()).sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? -1 : 1))

  // Ensure at least 5 pending by adding placeholders; UI can request generation separately
  while (merged.filter(a => !a.completed).length < 5) {
    merged.push({ id: `pending-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, title: 'New personalized milestone', completed: false, createdAt: new Date().toISOString() })
  }

  safety.achievements = merged
  await db.update(users).set({ safety: setSafety(safety) }).where(eq(users.id, userId))
  const points = merged.filter(a => a.completed).length * 5
  return NextResponse.json({ achievements: merged, points })
}


