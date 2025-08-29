import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, purchases, users } from '../../../../db'
import { verifyPaymentIntent } from '../../../../lib/stripe'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 })
    }

    // Verify payment intent with Stripe
    const paymentIntent = await verifyPaymentIntent(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Check if payment is for this user
    if (paymentIntent.metadata.userId !== userId) {
      return NextResponse.json({ error: 'Payment intent does not belong to user' }, { status: 403 })
    }

    const productType = paymentIntent.metadata.productType

    // Check if user already has this product
    const existingPurchase = await db.select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.product, productType)))
      .limit(1)

    if (existingPurchase.length > 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Product already purchased',
        productType
      })
    }

    // Record the purchase
    await db.insert(purchases).values({
      userId,
      product: productType,
      stripePaymentIntent: paymentIntentId,
      active: true
    })

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      productType
    })

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
