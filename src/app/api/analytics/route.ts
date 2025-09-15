import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, analyticsEvents } from '@/db'

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null
    try {
      const a = await auth()
      userId = a.userId
    } catch {}
    if (!userId && process.env.NODE_ENV !== 'production') userId = 'dev-user'
    
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
    
    // Map known fields
    const toInsert = {
      userId: userId || event.userId || null,
      sessionId: event?.properties?.sessionId || event.sessionId || null,
      event: String(event.event || 'unknown'),
      path: typeof event?.properties?.path === 'string' ? event.properties.path : (typeof event.path === 'string' ? event.path : null),
      title: typeof event?.properties?.title === 'string' ? event.properties.title : (typeof event.title === 'string' ? event.title : null),
      properties: event.properties ?? null,
      clientTimestamp: event.timestamp ? new Date(event.timestamp) : null,
    }
    
    // In production, you would:
    // 1. Validate the event structure
    // 2. Store in your analytics database
    // 3. Send to external analytics services
    // 4. Apply data retention policies
    
    console.log('Analytics event received:', toInsert)

    // Store in database (skip silently if table missing)
    try {
      await db.insert(analyticsEvents).values(toInsert as any)
    } catch (e: any) {
      console.warn('Analytics insert skipped:', e?.message || e)
    }
    
    // Example: Send to external service
    // await fetch('https://api.posthog.com/capture', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Analytics API error:', error)
    // Do not fail client interactions due to analytics issues
    return NextResponse.json({ success: false })
  }
}
