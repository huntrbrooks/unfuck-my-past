import { NextRequest, NextResponse } from 'next/server'
import { db, answers } from '../../../db'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's diagnostic responses
    const userAnswers = await db
      .select({
        question: answers.question,
        response: answers.response,
        insight: answers.insight,
        timestamp: answers.createdAt
      })
      .from(answers)
      .where(eq(answers.userId, userId))
      .orderBy(answers.createdAt)

    // Format the responses
    const formattedResponses = userAnswers.map(answer => ({
      question: answer.question,
      response: answer.response,
      insight: answer.insight,
      timestamp: answer.timestamp?.toISOString() || new Date().toISOString()
    }))

    return NextResponse.json({
      responses: formattedResponses
    })

  } catch (error) {
    console.error('Error fetching diagnostic responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagnostic responses' },
      { status: 500 }
    )
  }
}
