import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    // Check if request has body content
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }
    
    // Parse the analytics event
    let event
    try {
      event = await request.json()
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    // Add user ID if available
    if (userId) {
      event.userId = userId
    }
    
    // Add server timestamp
    event.serverTimestamp = new Date().toISOString()
    
    // In production, you would:
    // 1. Validate the event structure
    // 2. Store in your analytics database
    // 3. Send to external analytics services
    // 4. Apply data retention policies
    
    console.log('Analytics event received:', event)
    
    // Example: Store in database (you'd need to create an analytics table)
    // await db.insert(analyticsEvents).values({
    //   userId: event.userId,
    //   event: event.event,
    //   properties: event.properties,
    //   timestamp: new Date(event.timestamp)
    // })
    
    // Example: Send to external service
    // await fetch('https://api.posthog.com/capture', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to process analytics event' },
      { status: 500 }
    )
  }
}
