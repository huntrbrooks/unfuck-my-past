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
    const formattedResponses = userResponses.map((resp, index) => {
      let questionText = `Question ${index + 1}`
      
      // Extract question text from the stored question object
      if (resp.question && typeof resp.question === 'object') {
        const questionObj = resp.question as any
        // Try different possible properties for the question text
        questionText = questionObj.question || questionObj.text || questionObj.title || `Question ${index + 1}`
      }
      
      return {
        question: resp.question, // Keep the full question object for the DiagnosticReport component
        response: resp.response || '',
        insight: resp.insight || '',
        timestamp: resp.timestamp?.toISOString() || new Date().toISOString()
      }
    })

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
