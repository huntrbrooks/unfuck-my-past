import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses } from '@/db'
import { ProgramGenerator } from '@/lib/program-generator'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dayNumber, weatherData } = body

    if (!dayNumber || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // Get user preferences and diagnostic responses
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userData[0]
    const userPreferences = {
      tone: user.tone,
      voice: user.voice,
      rawness: user.rawness,
      depth: user.depth,
      learning: user.learning,
      engagement: user.engagement,
      ...user.safety
    }

    // Get diagnostic responses
    const responses = await db
      .select()
      .from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, userId))
      .orderBy(diagnosticResponses.createdAt)

    if (!responses.length) {
      return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })
    }

    // Generate the specific day's content
    const programGenerator = new ProgramGenerator()
    const dailyContent = await programGenerator.generateDailyContent(dayNumber, responses, userPreferences, weatherData)
    
    console.log(`Generated content for day ${dayNumber}:`, dailyContent)
    console.log(`Content length:`, dailyContent.length)
    console.log(`Content preview:`, dailyContent.substring(0, 200))

    // Save the daily content to the user's safety data
    const updatedSafety = {
      ...user.safety,
      dailyContent: {
        ...user.safety?.dailyContent,
        [dayNumber]: {
          content: dailyContent,
          timestamp: new Date().toISOString()
        }
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    return NextResponse.json({
      dayNumber: dayNumber,
      content: dailyContent,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating daily content:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily content' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dayNumber = parseInt(searchParams.get('day') || '1')

    if (dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // Get user data to check if daily content exists
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userData[0]
    const dailyContentData = user.safety?.dailyContent?.[dayNumber]

    if (!dailyContentData) {
      return NextResponse.json({ error: 'Daily content not found' }, { status: 404 })
    }

    return NextResponse.json({
      dayNumber: dayNumber,
      content: dailyContentData.content,
      timestamp: dailyContentData.timestamp
    })

  } catch (error) {
    console.error('Error retrieving daily content:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve daily content' },
      { status: 500 }
    )
  }
}
