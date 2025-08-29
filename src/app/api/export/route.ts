import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, answers, progress, purchases } from '../../../db'
import { eq } from 'drizzle-orm'
import { ExportData } from '../../../lib/export-utils'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

    // Get diagnostic responses
    const answersResult = await db.select({
      questionId: answers.questionId,
      content: answers.content,
      summary: answers.summary,
      createdAt: answers.createdAt
    })
    .from(answers)
    .where(eq(answers.userId, userId))
    .orderBy(answers.createdAt)

    // Get program progress
    const progressResult = await db.select({
      day: progress.day,
      completedAt: progress.completedAt
    })
    .from(progress)
    .where(eq(progress.userId, userId))
    .orderBy(progress.day)

    // Get purchases
    const purchasesResult = await db.select({
      product: purchases.product,
      createdAt: purchases.createdAt,
      active: purchases.active
    })
    .from(purchases)
    .where(eq(purchases.userId, userId))
    .orderBy(purchases.createdAt)

    // Format data for export
    const exportData: ExportData = {
      user: {
        id: userId,
        preferences: {
          tone: user.tone || 'gentle',
          voice: user.voice || 'friend',
          rawness: user.rawness || 'moderate',
          depth: user.depth || 'moderate',
          learning: user.learning || 'text',
          engagement: user.engagement || 'passive'
        }
      },
      diagnostic: {
        responses: answersResult.map(answer => ({
          question: `Question ${answer.questionId}`,
          response: answer.content || '',
          insight: answer.summary || '',
          timestamp: answer.createdAt?.toISOString() || ''
        })),
        summary: safetyData.diagnosticSummary?.content || 'No diagnostic summary available'
      },
      program: {
        progress: {
          completed: progressResult.length,
          total: 30,
          percentage: Math.round((progressResult.length / 30) * 100),
          currentDay: progressResult.length > 0 ? Math.max(...progressResult.map(p => p.day)) + 1 : 1,
          streak: calculateStreak(progressResult.map(p => p.day))
        },
        completedDays: progressResult.map(p => ({
          day: p.day,
          title: `Day ${p.day}`,
          completedAt: p.completedAt?.toISOString() || ''
        }))
      },
      purchases: purchasesResult.map(p => ({
        product: p.product,
        purchasedAt: p.createdAt?.toISOString() || '',
        active: p.active ?? false
      }))
    }

    return NextResponse.json(exportData)

  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

function calculateStreak(completedDays: number[]): number {
  if (completedDays.length === 0) return 0
  
  let streak = 0
  const sortedDays = completedDays.sort((a, b) => a - b)
  
  for (let i = 1; i <= Math.max(...sortedDays); i++) {
    if (sortedDays.includes(i)) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}
