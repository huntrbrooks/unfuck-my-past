import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users } from '@/db'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SavedLoopImage = {
  reportKey: string
  index: number
  title: string
  dataUrl: string
  createdAt: string
}

function ensureArray<T>(x: any): T[] { return Array.isArray(x) ? x as T[] : [] }

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const reportKey = searchParams.get('reportKey') || ''

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!userRows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const safety = typeof userRows[0].safety === 'string' ? JSON.parse(userRows[0].safety) : (userRows[0].safety || {})
    const all: SavedLoopImage[] = ensureArray<SavedLoopImage>(safety?.reportAssets?.behavioralLoopImages)
    const filtered = reportKey ? all.filter(i => i.reportKey === reportKey) : all
    return NextResponse.json({ images: filtered })
  } catch (error) {
    console.error('loop-image GET error', error)
    return NextResponse.json({ error: 'Failed to load images' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { reportKey, index, title, dataUrl } = body || {}
    if (!reportKey || typeof index !== 'number' || !title || !dataUrl) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!userRows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const safety = typeof userRows[0].safety === 'string' ? JSON.parse(userRows[0].safety) : (userRows[0].safety || {})
    const all: SavedLoopImage[] = ensureArray<SavedLoopImage>(safety?.reportAssets?.behavioralLoopImages)

    const now = new Date().toISOString()
    const next = all.filter(i => !(i.reportKey === reportKey && i.index === index))
    next.push({ reportKey, index, title, dataUrl, createdAt: now })

    const updatedSafety = {
      ...safety,
      reportAssets: {
        ...(safety?.reportAssets || {}),
        behavioralLoopImages: next
      }
    }

    await db.update(users).set({ safety: updatedSafety }).where(eq(users.id, userId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('loop-image POST error', error)
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
  }
}


