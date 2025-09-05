import { NextResponse } from 'next/server'
import { db, diagnosticResponses } from '../../../../db'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // Authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's diagnostic responses
    const userResponses = await db
      .select({
        question: diagnosticResponses.question,
        response: diagnosticResponses.response,
        insight: diagnosticResponses.insight,
        timestamp: diagnosticResponses.createdAt
      })
      .from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, userId))
      .orderBy(diagnosticResponses.createdAt)

    // Format the responses
    const formattedResponses = userResponses.map((resp, index) => ({
      question: resp.question && typeof resp.question === 'object' && 'text' in resp.question ? (resp.question as { text: string }).text || `Question ${index + 1}` : `Question ${index + 1}`,
      response: resp.response || '',
      insight: resp.insight || '',
      timestamp: resp.timestamp?.toISOString() || new Date().toISOString()
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
