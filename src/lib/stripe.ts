import Stripe from 'stripe'

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

// Product configurations
export const PRODUCTS = {
  DIAGNOSTIC_REPORT: {
    name: 'Full Diagnostic Report',
    price: 1000, // $10.00 in cents
    description: 'Complete trauma mapping, detailed pattern analysis, and personalized recommendations',
    productId: 'prod_diagnostic_report'
  },
  THIRTY_DAY_PROGRAM: {
    name: '30-Day Healing Program',
    price: 2995, // $29.95 in cents
    description: 'Complete 30-day structured healing program with daily tasks, journaling, and AI guidance',
    productId: 'prod_30_day_program'
  }
}

// Create payment intent
export async function createPaymentIntent(
  productType: 'diagnostic' | 'program',
  userId: string
) {
  const productConfig = productType === 'diagnostic' 
    ? PRODUCTS.DIAGNOSTIC_REPORT 
    : PRODUCTS.THIRTY_DAY_PROGRAM

  try {
    // Create payment intent directly without product creation
    const paymentIntent = await stripe.paymentIntents.create({
      amount: productConfig.price,
      currency: 'usd',
      metadata: {
        userId,
        productType,
        productName: productConfig.name
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })
    
    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

// Verify payment intent
export async function verifyPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Error verifying payment intent:', error)
    throw error
  }
}
