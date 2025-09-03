import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, programDays, users } from '../../../../../db'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ day: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { day } = await params
    const dayNumber = parseInt(day)
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // Get program day content
    const dayResult = await db.select().from(programDays).where(eq(programDays.day, dayNumber)).limit(1)
    
    if (!dayResult || dayResult.length === 0) {
      return NextResponse.json({ error: 'Program day not found' }, { status: 404 })
    }

    // Get user preferences to determine tone
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const userTone = userResult[0]?.tone || 'gentle'

    const programDay = dayResult[0]
    const content = userTone === 'raw' ? programDay.copyStraight : programDay.copyGentle

    return NextResponse.json({
      day: programDay.day,
      title: programDay.title,
      content,
      metadata: programDay.metadata
    })

  } catch (error) {
    console.error('Error getting program day:', error)
    return NextResponse.json(
      { error: 'Failed to get program day' },
      { status: 500 }
    )
  }
}
