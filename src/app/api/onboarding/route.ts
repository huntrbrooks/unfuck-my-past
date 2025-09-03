import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Save onboarding data to database
    await db.insert(users).values({
      id: userId,
      tone: body.tone,
      voice: body.voice,
      rawness: body.rawness,
      depth: body.depth,
      learning: body.learning,
      engagement: body.engagement,
      safety: {
        ...body.safety,
        goals: body.goals,
        experience: body.experience,
        timeCommitment: body.timeCommitment
      }
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        tone: body.tone,
        voice: body.voice,
        rawness: body.rawness,
        depth: body.depth,
        learning: body.learning,
        engagement: body.engagement,
        safety: {
          ...body.safety,
          goals: body.goals,
          experience: body.experience,
          timeCommitment: body.timeCommitment
        }
      }
    })

    // Trigger question generation in the background (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/diagnostic/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    }).catch(error => {
      console.error('Background question generation failed:', error)
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding data saved successfully. Generating personalized questions...' 
    })

  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding data' }, 
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userOnboarding = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (userOnboarding.length === 0) {
      return NextResponse.json({ error: 'Onboarding data not found' }, { status: 404 })
    }

    return NextResponse.json({ onboarding: userOnboarding[0] })

  } catch (error) {
    console.error('Error fetching onboarding data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding data' }, 
      { status: 500 }
    )
  }
}
