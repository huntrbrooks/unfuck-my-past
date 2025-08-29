import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createPaymentIntent } from '../../../../lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productType } = body

    if (!productType || !['diagnostic', 'program'].includes(productType)) {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(productType as 'diagnostic' | 'program', userId)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
