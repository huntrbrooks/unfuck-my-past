import { NextRequest, NextResponse } from 'next/server'
import { db, users } from '../../../db'
import { auth } from '@clerk/nextjs/server'

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

    // Update or create user record with onboarding data
    await db.execute(`
      INSERT INTO users (id, tone, voice, rawness, depth, learning, engagement, safety)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) 
      DO UPDATE SET 
        tone = EXCLUDED.tone,
        voice = EXCLUDED.voice,
        rawness = EXCLUDED.rawness,
        depth = EXCLUDED.depth,
        learning = EXCLUDED.learning,
        engagement = EXCLUDED.engagement,
        safety = EXCLUDED.safety
    `, [
      userId,
      tone,
      voice,
      rawness,
      depth,
      learning,
      engagement,
      JSON.stringify({
        ...safety,
        goals,
        experience,
        timeCommitment
      })
    ])

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
