import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, purchases } from '../../../../db'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's purchases
    const userPurchases = await db.select({
      product: purchases.product,
      active: purchases.active,
      createdAt: purchases.createdAt
    })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.active, true)))

    // Apply 30-day validity window for the 30-day healing program
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    const now = Date.now()

    const purchasesList = userPurchases.map((p) => {
      const created = new Date(p.createdAt as Date)
      const isProgram = p.product === 'program'
      const withinWindow = now - created.getTime() <= THIRTY_DAYS_MS
      const active = Boolean(p.active) && (!isProgram || withinWindow)
      const expiresAt = isProgram ? new Date(created.getTime() + THIRTY_DAYS_MS).toISOString() : undefined
      return {
        product: p.product,
        active,
        createdAt: created.toISOString(),
        ...(expiresAt ? { expiresAt } : {})
      }
    })

    return NextResponse.json(purchasesList)

  } catch (error) {
    console.error('Error getting user purchases:', error)
    return NextResponse.json(
      { error: 'Failed to get user purchases' },
      { status: 500 }
    )
  }
}
