import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, progress } from '../../../../db'
import { eq, desc, and } from 'drizzle-orm'
import { getProgramProgress } from '../../../../lib/program-content'

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's completed days
    const progressResult = await db.select({
      day: progress.day,
      completedAt: progress.completedAt
    })
    .from(progress)
    .where(eq(progress.userId, userId))
    .orderBy(desc(progress.completedAt))

    const completedDays = progressResult.map(p => p.day)
    const progressData = getProgramProgress(userId, completedDays)

    return NextResponse.json(progressData)

  } catch (error) {
    console.error('Error getting program progress:', error)
    return NextResponse.json(
      { error: 'Failed to get program progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { day } = body

    if (!day || day < 1 || day > 30) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // Check if day is already completed
    const existingProgress = await db.select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.day, day)))
      .limit(1)

    if (existingProgress.length > 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Day already completed'
      })
    }

    // Mark day as completed
    await db.insert(progress).values({
      userId,
      day,
      completedAt: new Date()
    })

    // Get updated progress
    const progressResult = await db.select({
      day: progress.day,
      completedAt: progress.completedAt
    })
    .from(progress)
    .where(eq(progress.userId, userId))
    .orderBy(desc(progress.completedAt))

    const completedDays = progressResult.map(p => p.day)
    const progressData = getProgramProgress(userId, completedDays)

    return NextResponse.json({
      success: true,
      message: `Day ${day} completed successfully`,
      progress: progressData
    })

  } catch (error) {
    console.error('Error updating program progress:', error)
    return NextResponse.json(
      { error: 'Failed to update program progress' },
      { status: 500 }
    )
  }
}
