import { NextRequest, NextResponse } from 'next/server'
import { db, users } from '../../../db'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { validateObject, sanitizeObject, ONBOARDING_SCHEMA, globalRateLimiter } from '../../../lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    if (!globalRateLimiter.isAllowed(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ 
        error: 'Please sign in to save your onboarding preferences. You can complete the onboarding process after signing in.' 
      }, { status: 401 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedBody = sanitizeObject(body)

    // Debug: Log the data being validated
    console.log('Onboarding data received:', JSON.stringify(sanitizedBody, null, 2))

    // Validate input
    const validation = validateObject(sanitizedBody, ONBOARDING_SCHEMA)
    if (!validation.isValid) {
      console.log('Validation errors:', validation.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

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
    } = sanitizedBody

    // Prepare safety data
    const safetyData = {
      ...safety,
      goals,
      experience,
      timeCommitment
    }

    try {
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
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

    } catch (dbError) {
      console.error('Database error in onboarding:', dbError)
      return NextResponse.json(
        { error: 'Failed to save onboarding data. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Unexpected error in onboarding:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
