import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '../../../../db'
import { AIService } from '../../../../lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user responses from the current session
    const answersResult = await db.execute(`
      SELECT a.question_id, a.content, a.summary, a.created_at
      FROM answers a
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [userId])

    if (!answersResult.rows || answersResult.rows.length === 0) {
      return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })
    }

    // Get user preferences
    const userResult = await db.execute(`
      SELECT tone, voice, rawness, depth, learning, engagement, safety
      FROM users 
      WHERE id = $1
    `, [userId])

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User preferences not found' }, { status: 404 })
    }

    const user = userResult.rows[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    const userPreferences = {
      tone: user.tone,
      voice: user.voice,
      rawness: user.rawness,
      depth: user.depth,
      learning: user.learning,
      engagement: user.engagement,
      goals: safetyData.goals || [],
      experience: safetyData.experience || 'beginner'
    }

    // Format responses for AI summary
    const allResponses = answersResult.rows.map((answer, index) => ({
      question: `Question ${index + 1}`,
      response: answer.content,
      insight: answer.summary
    }))

    // Generate comprehensive diagnostic summary
    const aiService = new AIService()
    const summary = await aiService.generateDiagnosticSummary(allResponses, userPreferences)

    // Save the summary to database (you might want to create a separate table for this)
    // For now, we'll store it in the user's safety field as a temporary solution
    const updatedSafety = {
      ...safetyData,
      diagnosticSummary: {
        content: summary.insight,
        model: summary.model,
        timestamp: summary.timestamp
      }
    }

    await db.execute(`
      UPDATE users 
      SET safety = $1
      WHERE id = $2
    `, [JSON.stringify(updatedSafety), userId])

    return NextResponse.json({
      summary: summary.insight,
      model: summary.model,
      timestamp: summary.timestamp,
      responseCount: allResponses.length
    })

  } catch (error) {
    console.error('Error generating diagnostic summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate diagnostic summary' },
      { status: 500 }
    )
  }
}
