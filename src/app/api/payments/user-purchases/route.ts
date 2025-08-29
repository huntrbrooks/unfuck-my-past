import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, purchases } from '../../../../db'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
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

    const purchasesList = userPurchases.map((p: any) => ({
      product: p.product,
      active: p.active,
      createdAt: p.createdAt
    }))

    return NextResponse.json(purchasesList)

  } catch (error) {
    console.error('Error getting user purchases:', error)
    return NextResponse.json(
      { error: 'Failed to get user purchases' },
      { status: 500 }
    )
  }
}
