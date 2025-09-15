import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Ensure Node.js runtime for database driver compatibility
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null
    try {
      const authRes = await auth()
      userId = authRes.userId
    } catch (e) {}
    if (!userId && process.env.NODE_ENV !== 'production') {
      userId = 'dev-user'
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body defensively to avoid runtime crashes on malformed JSON
    const body = await request.json().catch(() => ({} as any))
    
    // Normalize incoming payload to avoid spreading undefined/null
    const goals = Array.isArray(body?.goals) ? body.goals : (body?.goals ? [body.goals] : [])
    const safetyBase = (body && typeof body.safety === 'object' && body.safety !== null) ? body.safety : {}
    const safety = {
      ...safetyBase,
      goals,
      experience: body?.experience ?? 'beginner',
      timeCommitment: body?.timeCommitment ?? '15min',
    }
    
    const tone = body?.tone ?? null
    const voice = body?.voice ?? null
    const rawness = body?.rawness ?? null
    const depth = body?.depth ?? null
    const learning = body?.learning ?? null
    const engagement = body?.engagement ?? null
    
    // Save onboarding data to database
    await db.insert(users).values({
      id: userId,
      tone,
      voice,
      rawness,
      depth,
      learning,
      engagement,
      safety,
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        tone,
        voice,
        rawness,
        depth,
        learning,
        engagement,
        safety,
      }
    })

    // Trigger question generation in the background (non-blocking)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin || 'http://localhost:3000')

    fetch(`${appUrl}/api/diagnostic/generate-questions`, {
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
      { error: 'Failed to save onboarding data', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

export async function GET() {
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
