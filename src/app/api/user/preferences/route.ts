import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      safety: user[0].safety || {}
    })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the preferences structure
    const validPreferences = {
      goals: Array.isArray(body.goals) ? body.goals : [],
      experience: body.experience || 'beginner',
      skipTriggers: Boolean(body.skipTriggers),
      crisisSupport: Boolean(body.crisisSupport),
      timeCommitment: body.timeCommitment || '5min',
      contentWarnings: Boolean(body.contentWarnings)
    }

    // Get current user data to preserve existing safety data
    const currentUser = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
    const currentSafety = currentUser?.safety || {}
    
    // Update user's safety data with new preferences
    await db
      .update(users)
      .set({
        safety: {
          ...validPreferences,
          // Preserve any existing diagnostic data
          diagnosticAnalysis: (currentSafety as { diagnosticAnalysis?: Record<string, unknown> })?.diagnosticAnalysis || {},
          personalizedQuestions: (currentSafety as { personalizedQuestions?: unknown[] })?.personalizedQuestions || []
        }
      })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
