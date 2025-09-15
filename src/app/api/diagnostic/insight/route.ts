import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses } from '../../../../db'
import { AIService } from '../../../../lib/ai-service'
import { generateAIPrompt } from '../../../../lib/diagnostic-questions'
import { generateEnhancedAIPrompt } from '../../../../lib/enhanced-diagnostic-insight'
import { eq } from 'drizzle-orm'
import { validateObject, sanitizeObject, DIAGNOSTIC_RESPONSE_SCHEMA, globalRateLimiter } from '../../../../lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    if (!globalRateLimiter.isAllowed(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedBody = sanitizeObject(body)

    // Debug: Log the received data
    console.log('Received diagnostic insight request:', JSON.stringify(sanitizedBody, null, 2))

    // Validate input
    const validation = validateObject(sanitizedBody, DIAGNOSTIC_RESPONSE_SCHEMA)
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { question, response, useClaude = true } = sanitizedBody

    try {
      // Get user preferences for AI prompt generation using Drizzle ORM
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)

      if (!userResult || userResult.length === 0) {
        return NextResponse.json({ error: 'User preferences not found' }, { status: 404 })
      }

      const user = userResult[0]
      const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety

      // Check if we have enhanced onboarding data
      const hasEnhancedOnboarding = safetyData && 
        safetyData.flags && 
        safetyData.primaryFocus && 
        safetyData.baselines;

      let prompt;
      
      if (hasEnhancedOnboarding) {
        // Use enhanced onboarding data for personalized insights
        const enhancedOnboarding = {
          tones: safetyData.tones || [user.tone || 'gentle'],
          guideStyles: safetyData.guideStyles || [user.voice || 'friend'],
          guidanceStrength: (safetyData.guidanceStrength || user.rawness || 'moderate') as "mild"|"moderate"|"intense",
          depth: (safetyData.depth || user.depth || 'moderate') as "surface"|"moderate"|"deep"|"profound",
          primaryFocus: safetyData.primaryFocus,
          goals: safetyData.goals || [],
          learningStyles: safetyData.learningStyles || [user.learning || 'text'],
          engagement: (safetyData.engagement || user.engagement || 'passive') as "passive"|"moderate"|"active",
          minutesPerDay: (safetyData.timeCommitment === '5min' ? 5 : 
                        safetyData.timeCommitment === '15min' ? 15 :
                        safetyData.timeCommitment === '30min' ? 30 : 15) as 5|15|30|60,
          attentionSpan: safetyData.attentionSpan || 'standard',
          inputMode: (safetyData.inputMode || 'text') as "text"|"voice"|"either",
          flags: safetyData.flags || [],
          stress0to10: parseInt(safetyData.baselines?.stress) || 5,
          sleep0to10: parseInt(safetyData.baselines?.sleep) || 5,
          ruminationFreq: safetyData.baselines?.rumination || 'weekly',
          topicsToAvoid: safetyData.topicsToAvoid || [],
          triggerWords: safetyData.triggerWords || '',
          challenges: safetyData.challenges || [],
          challengeOther: safetyData.challengeOther,
          freeform: safetyData.freeform
        };
        
        console.log('Using enhanced onboarding data for insight generation');
        prompt = generateEnhancedAIPrompt(question, enhancedOnboarding);
        
      } else {
        // Fallback to basic preferences
        const userPreferences = {
          tone: user.tone || 'gentle',
          voice: user.voice || 'friend',
          rawness: user.rawness || 'moderate',
          depth: user.depth || 'moderate',
          learning: user.learning || 'text',
          engagement: user.engagement || 'passive',
          goals: safetyData?.goals || [],
          experience: safetyData?.experience || 'beginner'
        };
        
        console.log('Using basic preferences for insight generation');
        prompt = generateAIPrompt(question, userPreferences);
      }

      // Generate insight using AI
      const aiService = new AIService()
      let insight
      try {
        insight = await aiService.generateInsight(prompt, response, useClaude)
      } catch (aiErr: any) {
        console.error('AI insight generation failed:', aiErr?.message || aiErr)
        return NextResponse.json(
          { error: 'AI service unavailable. Please try again shortly.' },
          { status: 503 }
        )
      }

      // Save the response and insight to database using Drizzle ORM
      await db.insert(diagnosticResponses).values({
        userId: userId,
        question: question,
        response: response,
        insight: insight.insight,
        model: insight.model
      })

      return NextResponse.json({
        insight: insight.insight,
        model: insight.model,
        timestamp: insight.timestamp,
        // Debug info to verify enhanced onboarding usage
        debug: {
          usedEnhancedOnboarding: hasEnhancedOnboarding,
          primaryFocus: hasEnhancedOnboarding ? safetyData.primaryFocus : 'not available',
          guidanceStrength: hasEnhancedOnboarding ? (safetyData.guidanceStrength || user.rawness) : user.rawness,
          flags: hasEnhancedOnboarding ? safetyData.flags : 'not available',
          timeConstraint: hasEnhancedOnboarding ? safetyData.timeCommitment : 'not available'
        }
      })

    } catch (dbError) {
      console.error('Database error in diagnostic insight:', dbError)
      return NextResponse.json(
        { error: 'Failed to process diagnostic response. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Unexpected error in diagnostic insight:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
