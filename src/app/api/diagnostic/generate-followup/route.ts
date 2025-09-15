import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface FollowUpQuestion {
  id: string
  question: string
  category: string
  placeholder: string
  importance: 'high' | 'medium' | 'low'
  context?: string
}

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

    const { missingData, diagnosticResponses, userProfile } = await request.json()
    
    // Try to generate with OpenAI first
    const openaiKey = process.env.OPENAI_API_KEY
    
    if (openaiKey) {
      try {
        const questions = await generateWithOpenAI(missingData, diagnosticResponses, userProfile, openaiKey)
        return NextResponse.json({ questions })
      } catch (error) {
        console.error('OpenAI generation failed, using fallback:', error)
      }
    }
    
    // Fallback to rule-based generation
    const questions = generateFallbackQuestions(missingData, diagnosticResponses, userProfile)
    
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating follow-up questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' },
      { status: 500 }
    )
  }
}

async function generateWithOpenAI(
  missingData: any[],
  responses: any[],
  profile: any,
  apiKey: string
): Promise<FollowUpQuestion[]> {
  const prompt = `You are a trauma-informed therapist creating follow-up questions to better understand a client.

MISSING DATA AREAS:
${missingData.map(d => `- ${d.category}: ${d.description} (${d.importance} priority)`).join('\n')}

CLIENT PROFILE:
- Communication Style: ${profile.tone} tone, ${profile.voice} voice
- Engagement Level: ${profile.engagement}
- Goals: ${profile.goals?.join(', ') || 'Not specified'}

EXISTING RESPONSES SUMMARY:
${responses.slice(0, 3).map(r => `Q: ${r.question?.text || r.question}\nA: ${r.response.substring(0, 150)}...`).join('\n\n')}

Generate 4-6 follow-up questions that:
1. Address the most important missing data areas
2. Are trauma-informed and non-triggering
3. Match the client's communication style
4. Build on their existing responses
5. Are open-ended but specific
6. Include context about why the question matters

Return as JSON array with this structure:
[{
  "id": "unique-id",
  "question": "The question text",
  "category": "Category from missing data",
  "placeholder": "Example answer placeholder",
  "importance": "high/medium/low",
  "context": "Why this question helps their healing"
}]`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a trauma-informed therapist creating personalized follow-up questions. Be compassionate, specific, and focused on gathering actionable information for healing.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const parsed = JSON.parse(content)
  
  // Handle different response formats
  if (Array.isArray(parsed)) {
    return parsed
  } else if (parsed.questions && Array.isArray(parsed.questions)) {
    return parsed.questions
  } else {
    throw new Error('Unexpected response format from OpenAI')
  }
}

function generateFallbackQuestions(
  missingData: any[],
  responses: any[],
  profile: any
): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = []
  
  // Generate questions based on missing data categories
  missingData.forEach(missing => {
    switch (missing.category) {
      case 'Coping Mechanisms':
        questions.push({
          id: `coping-${Date.now()}`,
          question: profile.tone === 'gentle' 
            ? 'Could you share what helps you feel more grounded when things get overwhelming?'
            : 'What specific strategies do you use to manage difficult emotions or triggers?',
          category: 'Coping Mechanisms',
          placeholder: 'I usually try to... (e.g., deep breathing, calling a friend, going for a walk)',
          importance: 'high',
          context: 'Understanding your current coping tools helps us build on what already works and introduce new strategies that fit your style.'
        })
        break
        
      case 'Communication Patterns':
        questions.push({
          id: `boundaries-${Date.now()}`,
          question: profile.tone === 'gentle'
            ? 'How comfortable do you feel expressing your needs to others?'
            : 'How do you typically set and communicate boundaries in your relationships?',
          category: 'Communication Patterns',
          placeholder: 'When I need to set a boundary, I usually...',
          importance: 'high',
          context: 'Healthy boundaries are essential for healing. This helps us understand where you might need support in asserting your needs.'
        })
        break
        
      case 'Support System':
        questions.push({
          id: `support-${Date.now()}`,
          question: 'Who do you turn to when you need emotional support, and how easy is it for you to reach out?',
          category: 'Support System',
          placeholder: 'I have... and I find it easy/difficult to ask for help because...',
          importance: 'medium',
          context: 'Connection accelerates healing. Knowing your support network helps us strengthen these resources.'
        })
        break
        
      case 'Daily Routines':
        questions.push({
          id: `routines-${Date.now()}`,
          question: profile.engagement === 'active'
            ? 'What daily practices or rituals help you maintain your well-being?'
            : 'What does a typical day look like for you?',
          category: 'Daily Routines',
          placeholder: 'My typical day includes...',
          importance: 'medium',
          context: 'Routines provide structure for healing work. This helps us integrate practices that fit naturally into your life.'
        })
        break
        
      case 'Triggers & Stressors':
        questions.push({
          id: `triggers-${Date.now()}`,
          question: profile.tone === 'gentle'
            ? 'What situations tend to be most challenging for you emotionally?'
            : 'What specific triggers or stressors affect you most strongly?',
          category: 'Triggers & Stressors',
          placeholder: 'I find it particularly difficult when...',
          importance: 'high',
          context: 'Identifying triggers helps us develop targeted strategies to navigate difficult moments.'
        })
        break
        
      case 'Future Vision':
        questions.push({
          id: `goals-${Date.now()}`,
          question: 'What would healing look like for you? How would you know you\'re making progress?',
          category: 'Future Vision',
          placeholder: 'I would feel healed when... I would notice progress by...',
          importance: 'medium',
          context: 'Clear goals guide the healing journey. This helps us track meaningful progress together.'
        })
        break
        
      case 'Physical Health':
        questions.push({
          id: `physical-${Date.now()}`,
          question: 'How does stress or emotion show up in your body, and how do you care for your physical well-being?',
          category: 'Physical Health',
          placeholder: 'I notice stress in my body as... I take care of myself by...',
          importance: 'low',
          context: 'The mind-body connection is powerful. Understanding this helps us integrate holistic healing approaches.'
        })
        break
        
      case 'Relationships':
        questions.push({
          id: `relationships-${Date.now()}`,
          question: profile.rawness === 'mild'
            ? 'What patterns do you notice in your relationships that you\'d like to change?'
            : 'What relationship patterns keep repeating that frustrate or hurt you?',
          category: 'Relationships',
          placeholder: 'In my relationships, I tend to...',
          importance: 'medium',
          context: 'Relationship patterns often mirror our internal healing needs. This insight guides relational growth work.'
        })
        break
    }
  })
  
  // Limit to 4-6 questions, prioritizing high importance
  // Always return exactly 4 to keep consistent rounds and enable regeneration cadence
  return questions
    .sort((a, b) => {
      const importanceOrder = { high: 0, medium: 1, low: 2 }
      return importanceOrder[a.importance] - importanceOrder[b.importance]
    })
    .slice(0, Math.min(4, questions.length))
}
