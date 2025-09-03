import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses } from '@/db'
import { ProgramGenerator } from '@/lib/program-generator'
import { eq } from 'drizzle-orm'

export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      tone: user.tone || 'gentle',
      voice: user.voice || 'friend',
      rawness: user.rawness || 'moderate',
      depth: user.depth || 'moderate',
      learning: user.learning || 'text',
      engagement: user.engagement || 'passive',
      ...(user.safety || {})
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

    // Transform responses to match expected type
    const transformedResponses = responses.map(resp => ({
      question: resp.question && typeof resp.question === 'object' && 'text' in resp.question ? (resp.question as any).text : `Question ${resp.id}`,
      response: resp.response || '',
      insight: resp.insight || '',
      createdAt: resp.createdAt || new Date()
    }))

    // Generate the 30-day program
    const programGenerator = new ProgramGenerator()
    const program = await programGenerator.generateProgram(transformedResponses, userPreferences)

    // Save the program to the user's safety data
    const updatedSafety = {
      ...(user.safety || {}),
      program: {
        content: program,
        timestamp: new Date().toISOString()
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    return NextResponse.json({
      program: program,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating program:', error)
    return NextResponse.json(
      { error: 'Failed to generate program' },
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

    // Get user data to check if program exists
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userData[0]
    const programData = (user.safety as any)?.program

    if (!programData) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json({
      program: programData.content,
      timestamp: programData.timestamp
    })

  } catch (error) {
    console.error('Error retrieving program:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve program' },
      { status: 500 }
    )
  }
}
