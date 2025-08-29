import { NextRequest, NextResponse } from 'next/server'
import { db, users } from '../../../db'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      tone,
      voice,
      rawness,
      depth,
      learning,
      engagement,
      safety,
      goals,
      experience,
      timeCommitment
    } = body

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    const safetyData = {
      ...safety,
      goals,
      experience,
      timeCommitment
    }

    if (existingUser.length > 0) {
      // Update existing user
      await db.update(users)
        .set({
          tone,
          voice,
          rawness,
          depth,
          learning,
          engagement,
          safety: safetyData
        })
        .where(eq(users.id, userId))
    } else {
      // Insert new user
      await db.insert(users).values({
        id: userId,
        tone,
        voice,
        rawness,
        depth,
        learning,
        engagement,
        safety: safetyData
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding data saved successfully'
    })

  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}
