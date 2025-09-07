export interface DiagnosticQuestion {
  id: number
  category: 'trauma' | 'patterns' | 'relationships' | 'self-image' | 'coping' | 'goals'
  question: string
  followUp?: string
  options?: string[]
  adaptive?: {
    tone: string[]
    rawness: string[]
    depth: string[]
  }
  aiPrompt?: string
}

export const diagnosticQuestions: DiagnosticQuestion[] = [
  // Trauma & Past Experiences
  {
    id: 1,
    category: 'trauma',
    question: "What's the most significant event from your past that still affects you today?",
    followUp: "How does this event show up in your current life?",
    adaptive: {
      tone: ['direct', 'raw'],
      rawness: ['intense', 'extreme'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Analyze the user's trauma response and identify patterns. Look for: avoidance behaviors, hypervigilance, emotional dysregulation, or resilience indicators."
  },
  {
    id: 2,
    category: 'trauma',
    question: "When you think about your childhood, what emotion comes up most strongly?",
    adaptive: {
      tone: ['gentle', 'analytical'],
      rawness: ['mild', 'moderate'],
      depth: ['surface', 'moderate']
    },
    aiPrompt: "Assess emotional patterns and attachment style. Identify if the user tends toward: anxious, avoidant, secure, or disorganized attachment."
  },
  {
    id: 3,
    category: 'trauma',
    question: "What's something you've never told anyone about your past?",
    adaptive: {
      tone: ['raw', 'direct'],
      rawness: ['intense', 'extreme'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Evaluate shame patterns and self-disclosure comfort. Look for: internalized shame, fear of judgment, or breakthrough readiness."
  },

  // Behavioral Patterns
  {
    id: 4,
    category: 'patterns',
    question: "What's a behavior you keep repeating even though you know it's not good for you?",
    followUp: "What do you think keeps you stuck in this pattern?",
    adaptive: {
      tone: ['direct', 'analytical'],
      rawness: ['moderate', 'intense'],
      depth: ['moderate', 'deep']
    },
    aiPrompt: "Identify self-sabotage patterns and resistance to change. Look for: cognitive distortions, emotional reasoning, or lack of self-compassion."
  },
  {
    id: 5,
    category: 'patterns',
    question: "How do you typically respond when things don't go your way?",
    options: [
      "I get angry and blame others",
      "I withdraw and isolate myself", 
      "I try to fix everything immediately",
      "I feel overwhelmed and freeze",
      "I analyze what went wrong"
    ],
    adaptive: {
      tone: ['analytical', 'direct'],
      rawness: ['mild', 'moderate'],
      depth: ['surface', 'moderate']
    },
    aiPrompt: "Assess stress response patterns and emotional regulation. Identify: fight, flight, freeze, or fawn responses."
  },
  {
    id: 6,
    category: 'patterns',
    question: "What's your biggest fear about changing?",
    adaptive: {
      tone: ['gentle', 'raw'],
      rawness: ['moderate', 'intense'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Evaluate change resistance and fear patterns. Look for: fear of loss, fear of success, or fear of the unknown."
  },

  // Relationships
  {
    id: 7,
    category: 'relationships',
    question: "What's the most toxic relationship you've ever been in?",
    followUp: "What patterns do you see in your relationships?",
    adaptive: {
      tone: ['raw', 'direct'],
      rawness: ['intense', 'extreme'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Analyze relationship patterns and boundaries. Identify: codependency, people-pleasing, or boundary issues."
  },
  {
    id: 8,
    category: 'relationships',
    question: "How do you handle conflict with people you care about?",
    options: [
      "I avoid it at all costs",
      "I get defensive and attack",
      "I try to fix it immediately",
      "I need time to process first",
      "I communicate openly"
    ],
    adaptive: {
      tone: ['analytical', 'gentle'],
      rawness: ['mild', 'moderate'],
      depth: ['moderate', 'deep']
    },
    aiPrompt: "Assess conflict resolution style and emotional maturity. Look for: avoidance, aggression, or healthy communication patterns."
  },
  {
    id: 9,
    category: 'relationships',
    question: "What do you think people really think about you?",
    adaptive: {
      tone: ['gentle', 'raw'],
      rawness: ['moderate', 'intense'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Evaluate self-perception vs. reality. Identify: projection, self-criticism, or distorted thinking patterns."
  },

  // Self-Image & Identity
  {
    id: 10,
    category: 'self-image',
    question: "What's the story you tell yourself about who you are?",
    adaptive: {
      tone: ['analytical', 'gentle'],
      rawness: ['moderate', 'intense'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Analyze self-narrative and identity formation. Look for: limiting beliefs, self-sabotage narratives, or authentic self-expression."
  },
  {
    id: 11,
    category: 'self-image',
    question: "What would you change about yourself if you could?",
    followUp: "Why do you think this matters so much?",
    adaptive: {
      tone: ['gentle', 'direct'],
      rawness: ['mild', 'moderate'],
      depth: ['moderate', 'deep']
    },
    aiPrompt: "Assess self-acceptance and body image. Identify: perfectionism, comparison traps, or unrealistic standards."
  },
  {
    id: 12,
    category: 'self-image',
    question: "When was the last time you felt truly proud of yourself?",
    adaptive: {
      tone: ['gentle', 'analytical'],
      rawness: ['mild', 'moderate'],
      depth: ['surface', 'moderate']
    },
    aiPrompt: "Evaluate self-worth and achievement patterns. Look for: imposter syndrome, difficulty accepting praise, or healthy self-esteem."
  },

  // Coping Mechanisms
  {
    id: 13,
    category: 'coping',
    question: "What do you do when you're feeling overwhelmed or stressed?",
    options: [
      "I distract myself with work/activities",
      "I eat, drink, or use substances",
      "I withdraw from everyone",
      "I talk to someone I trust",
      "I exercise or move my body"
    ],
    adaptive: {
      tone: ['analytical', 'gentle'],
      rawness: ['mild', 'moderate'],
      depth: ['moderate', 'deep']
    },
    aiPrompt: "Assess coping mechanisms and stress management. Identify: healthy vs. unhealthy coping, avoidance, or adaptive strategies."
  },
  {
    id: 14,
    category: 'coping',
    question: "What's your biggest trigger, and how do you react when it happens?",
    adaptive: {
      tone: ['raw', 'direct'],
      rawness: ['intense', 'extreme'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Evaluate trigger responses and emotional regulation. Look for: fight/flight responses, dissociation, or healthy coping skills."
  },
  {
    id: 15,
    category: 'coping',
    question: "How do you treat yourself when you make a mistake?",
    adaptive: {
      tone: ['gentle', 'raw'],
      rawness: ['moderate', 'intense'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Assess self-compassion and inner critic. Identify: self-criticism, perfectionism, or self-forgiveness patterns."
  },

  // Goals & Future
  {
    id: 16,
    category: 'goals',
    question: "What's the biggest thing holding you back from the life you want?",
    adaptive: {
      tone: ['direct', 'analytical'],
      rawness: ['moderate', 'intense'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Evaluate barriers to change and goal achievement. Look for: external vs. internal barriers, limiting beliefs, or realistic obstacles."
  },
  {
    id: 17,
    category: 'goals',
    question: "What would your ideal life look like in 5 years?",
    followUp: "What's stopping you from having that now?",
    adaptive: {
      tone: ['gentle', 'analytical'],
      rawness: ['mild', 'moderate'],
      depth: ['moderate', 'deep']
    },
    aiPrompt: "Assess vision clarity and goal-setting ability. Identify: realistic vs. unrealistic goals, motivation, or action planning."
  },
  {
    id: 18,
    category: 'goals',
    question: "What's one thing you know you need to do but keep avoiding?",
    adaptive: {
      tone: ['raw', 'direct'],
      rawness: ['intense', 'extreme'],
      depth: ['deep', 'profound']
    },
    aiPrompt: "Evaluate procrastination and avoidance patterns. Look for: fear of failure, perfectionism, or lack of motivation."
  }
]

export function getAdaptiveQuestions(userPreferences: {
  tone: string
  rawness: string
  depth: string
  goals: string[]
  experience: string
}, questionCount: number = 5): DiagnosticQuestion[] {
  // Filter questions based on user preferences
  const filteredQuestions = diagnosticQuestions.filter(q => {
    if (!q.adaptive) return true
    
    const toneMatch = !q.adaptive.tone || q.adaptive.tone.includes(userPreferences.tone)
    const rawnessMatch = !q.adaptive.rawness || q.adaptive.rawness.includes(userPreferences.rawness)
    const depthMatch = !q.adaptive.depth || q.adaptive.depth.includes(userPreferences.depth)
    
    return toneMatch && rawnessMatch && depthMatch
  })

  // Prioritize questions based on user goals
  const goalCategories = userPreferences.goals.map(goal => {
    switch (goal) {
      case 'healing': return ['trauma', 'coping']
      case 'growth': return ['patterns', 'self-image']
      case 'clarity': return ['self-image', 'goals']
      case 'change': return ['patterns', 'goals']
      default: return []
    }
  }).flat()

  const prioritizedQuestions = filteredQuestions.sort((a, b) => {
    const aGoalMatch = goalCategories.includes(a.category) ? 1 : 0
    const bGoalMatch = goalCategories.includes(b.category) ? 1 : 0
    return bGoalMatch - aGoalMatch
  })

  // Adjust question count based on experience level
  const adjustedCount = userPreferences.experience === 'beginner' 
    ? Math.min(questionCount, 3)
    : userPreferences.experience === 'advanced'
    ? Math.max(questionCount, 8)
    : questionCount

  return prioritizedQuestions.slice(0, adjustedCount)
}

export function generateAIPrompt(
  question: DiagnosticQuestion,
  userPreferences: { tone: string; voice: string; rawness: string; depth: string; learning?: string; goals?: string[] }
): string {
  const basePrompt = question.aiPrompt || "Analyze the user's response for patterns and insights."
  
  return `
You are an expert trauma-informed therapist analyzing a client's response to a diagnostic question.

CLIENT PREFERENCES:
- Communication Style: ${userPreferences.tone}
- Content Intensity: ${userPreferences.rawness}
- Exploration Depth: ${userPreferences.depth}
- Learning Style: ${userPreferences.learning || 'not specified'}
- Goals: ${(userPreferences.goals || []).join(', ')}

QUESTION: ${question.question}

ANALYSIS TASK: ${basePrompt}

Provide a brief, insightful analysis (2-3 sentences) that:
1. Acknowledges their response with empathy
2. Identifies key patterns or themes
3. Offers a gentle insight or observation
4. Matches their preferred communication style (${userPreferences.tone})

Keep the tone ${userPreferences.tone} and depth ${userPreferences.depth}. Be ${userPreferences.rawness} but always trauma-informed and supportive.
`
}



