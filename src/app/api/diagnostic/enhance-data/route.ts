import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    // Auth with dev fallback
    let userId: string | null = null
    try {
      const a = await auth()
      userId = a.userId
    } catch {}
    if (!userId && process.env.NODE_ENV !== 'production') {
      userId = 'dev-user'
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      questionId, 
      question, 
      answer, 
      category, 
      existingResponses 
    } = await request.json()

    // Optional database connection (skip writes if not configured)
    let sql: any | null = null
    if (process.env.DATABASE_URL) {
      const { neon } = await import('@neondatabase/serverless')
      sql = neon(process.env.DATABASE_URL!)
    }
    
    // First, check if we have a diagnostic_responses table
    let totalFollowUps = 0
    if (sql) {
      try {
        // Store the follow-up answer
        await sql`
          INSERT INTO diagnostic_followup_responses (
            user_id,
            question_id,
            question,
            answer,
            category,
            created_at
          ) VALUES (
            ${userId},
            ${questionId},
            ${question},
            ${answer},
            ${category},
            NOW()
          ) ON CONFLICT (user_id, question_id) 
          DO UPDATE SET 
            answer = EXCLUDED.answer,
            updated_at = NOW()
        `
        // Count total follow-ups after upsert
        const cnt = await sql`SELECT COUNT(*)::int AS cnt FROM diagnostic_followup_responses WHERE user_id = ${userId}`
        totalFollowUps = Number(cnt?.[0]?.cnt || 0)
      } catch (dbError) {
        // If table doesn't exist, create it
        await sql`
          CREATE TABLE IF NOT EXISTS diagnostic_followup_responses (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            question_id TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, question_id)
          )
        `
        
        // Try again
        await sql`
          INSERT INTO diagnostic_followup_responses (
            user_id,
            question_id,
            question,
            answer,
            category,
            created_at
          ) VALUES (
            ${userId},
            ${questionId},
            ${question},
            ${answer},
            ${category},
            NOW()
          ) ON CONFLICT (user_id, question_id) 
          DO UPDATE SET 
            answer = EXCLUDED.answer,
            updated_at = NOW()
        `
        const cnt = await sql`SELECT COUNT(*)::int AS cnt FROM diagnostic_followup_responses WHERE user_id = ${userId}`
        totalFollowUps = Number(cnt?.[0]?.cnt || 0)
      }
    }

    // Create enhanced responses by combining existing and new data
    const enhancedResponses = [...existingResponses]
    
    // Add the follow-up response as an enhanced diagnostic response
    enhancedResponses.push({
      question: { text: question, category, isFollowUp: true },
      response: answer,
      insight: await generateInsight(question, answer, category),
      model: 'enhanced',
      timestamp: new Date().toISOString()
    })

    // Store enhanced diagnostic data for report generation
    if (sql) {
      const baseCount = Array.isArray(existingResponses) ? existingResponses.length : 0
      const newConfidence = computeConfidenceFromCounts(baseCount, totalFollowUps)
      try {
        await sql`
          INSERT INTO user_diagnostic_data (
            user_id,
            diagnostic_responses,
            enhanced_data,
            confidence_score,
            updated_at
          ) VALUES (
            ${userId},
            ${JSON.stringify(existingResponses)},
            ${JSON.stringify({ followUpAnswers: [{ questionId, question, answer, category }] })},
            ${newConfidence},
            NOW()
          ) ON CONFLICT (user_id) 
          DO UPDATE SET 
            enhanced_data = 
              CASE 
                WHEN user_diagnostic_data.enhanced_data IS NULL 
                THEN EXCLUDED.enhanced_data
                ELSE jsonb_set(
                  user_diagnostic_data.enhanced_data::jsonb,
                  '{followUpAnswers}',
                  COALESCE(
                    (user_diagnostic_data.enhanced_data::jsonb->'followUpAnswers')::jsonb,
                    '[]'::jsonb
                  ) || EXCLUDED.enhanced_data::jsonb->'followUpAnswers'
                )
              END,
            confidence_score = EXCLUDED.confidence_score,
            updated_at = NOW()
        `
      } catch (dbError) {
        // If table doesn't exist, create it
        await sql`
          CREATE TABLE IF NOT EXISTS user_diagnostic_data (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            diagnostic_responses JSONB,
            enhanced_data JSONB,
            confidence_score INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
        
        // Try again
        await sql`
          INSERT INTO user_diagnostic_data (
            user_id,
            diagnostic_responses,
            enhanced_data,
            confidence_score,
            updated_at
          ) VALUES (
            ${userId},
            ${JSON.stringify(existingResponses)},
            ${JSON.stringify({ followUpAnswers: [{ questionId, question, answer, category }] })},
            ${newConfidence},
            NOW()
          ) ON CONFLICT (user_id) 
          DO UPDATE SET 
            enhanced_data = 
              CASE 
                WHEN user_diagnostic_data.enhanced_data IS NULL 
                THEN EXCLUDED.enhanced_data
                ELSE jsonb_set(
                  user_diagnostic_data.enhanced_data::jsonb,
                  '{followUpAnswers}',
                  COALESCE(
                    (user_diagnostic_data.enhanced_data::jsonb->'followUpAnswers')::jsonb,
                    '[]'::jsonb
                  ) || EXCLUDED.enhanced_data::jsonb->'followUpAnswers'
                )
              END,
            confidence_score = EXCLUDED.confidence_score,
            updated_at = NOW()
        `
      }
    }

    return NextResponse.json({
      success: true,
      enhancedResponses,
      newConfidence: computeConfidenceFromCounts(Array.isArray(existingResponses) ? existingResponses.length : 0, totalFollowUps)
    })
  } catch (error) {
    console.error('Error enhancing diagnostic data:', error)
    return NextResponse.json(
      { error: 'Failed to enhance diagnostic data' },
      { status: 500 }
    )
  }
}

async function generateInsight(question: string, answer: string, category: string): Promise<string> {
  // Try to generate insight with OpenAI
  const openaiKey = process.env.OPENAI_API_KEY
  
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a trauma-informed therapist providing brief, compassionate insights about client responses. Keep insights to 2-3 sentences, focusing on patterns and strengths.'
            },
            {
              role: 'user',
              content: `Category: ${category}\nQuestion: ${question}\nClient Response: ${answer}\n\nProvide a brief therapeutic insight about this response.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      }
    } catch (error) {
      console.error('Error generating insight with OpenAI:', error)
    }
  }
  
  // Fallback insight based on category
  return generateFallbackInsight(category, answer)
}

function generateFallbackInsight(category: string, answer: string): string {
  const answerLength = answer.length
  const isDetailed = answerLength > 100
  
  const insights: Record<string, string[]> = {
    'Coping Mechanisms': [
      isDetailed 
        ? 'Your awareness of your coping strategies shows self-reflection and readiness for growth. Building on these existing tools will strengthen your resilience.'
        : 'Identifying your coping strategies is an important step. Exploring these further will help develop more robust support systems.',
    ],
    'Communication Patterns': [
      isDetailed
        ? 'Your understanding of your communication patterns reveals important insights. This awareness is the foundation for developing healthier boundary-setting skills.'
        : 'Recognizing communication challenges is valuable. This opens opportunities to explore new ways of expressing your needs.',
    ],
    'Support System': [
      isDetailed
        ? 'Your reflection on support systems shows both strengths and areas for growth. Nurturing these connections will be vital for your healing journey.'
        : 'Understanding your support network helps identify where additional resources might be beneficial.',
    ],
    'Daily Routines': [
      isDetailed
        ? 'Your daily practices reveal important self-care elements. These routines can become anchors for incorporating healing work.'
        : 'Examining daily patterns helps identify opportunities for supportive practices and self-care.',
    ],
    'Triggers & Stressors': [
      isDetailed
        ? 'Your ability to identify triggers demonstrates strong self-awareness. This insight will guide the development of specific coping strategies.'
        : 'Recognizing triggers is the first step toward managing them effectively. This awareness opens pathways for healing.',
    ],
    'Future Vision': [
      isDetailed
        ? 'Your vision for healing shows hope and direction. These goals will serve as guideposts throughout your journey.'
        : 'Having healing goals provides motivation and direction. Clarifying these further will strengthen your path forward.',
    ],
    'Physical Health': [
      isDetailed
        ? 'Your body awareness reveals the mind-body connection in your experience. This insight supports holistic healing approaches.'
        : 'Noticing physical patterns helps integrate body-based healing practices into your journey.',
    ],
    'Relationships': [
      isDetailed
        ? 'Your relationship insights reveal patterns that are ready for transformation. This awareness is crucial for developing healthier connections.'
        : 'Identifying relationship patterns is an important step toward creating more fulfilling connections.',
    ]
  }
  
  return insights[category]?.[0] || 'Your response provides valuable information that will help personalize your healing journey. This self-awareness is an important strength.'
}

function calculateNewConfidence(existingResponses: any[], enhancedResponses: any[]): number {
  const baseCount = existingResponses.length
  const enhancedCount = enhancedResponses.length
  
  // Base confidence from original responses (max 70%)
  let confidence = Math.min(70, baseCount * 10)
  
  // Add up to 25% for follow-up responses
  const followUpBonus = Math.min(25, (enhancedCount - baseCount) * 5)
  confidence += followUpBonus
  
  // Ensure between 20 and 95
  return Math.max(20, Math.min(95, Math.round(confidence)))
}

// Helper used when we only know counts (e.g., totalFollowUps from DB)
function computeConfidenceFromCounts(baseCount: number, followUpCount: number): number {
  const baseComponent = Math.min(70, baseCount * 10)
  const followUpBonus = Math.min(55, followUpCount * 7)
  const total = baseComponent + followUpBonus
  return Math.max(20, Math.min(95, Math.round(total)))
}
