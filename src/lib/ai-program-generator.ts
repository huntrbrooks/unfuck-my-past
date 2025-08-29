interface DiagnosticResponse {
  question: string
  response: string
  insight: string
  timestamp: string
}

interface UserProfile {
  tone: string
  voice: string
  rawness: string
  depth: string
  learning: string
  engagement: string
  goals: string[]
  experience: string
  timeCommitment: string
}

interface PersonalizedDay {
  day: number
  title: string
  focus: string
  content: {
    introduction: string
    guidedPractice: string
    challenge: string
    journalingPrompt: string
    reflection: string
    tools: string[]
  }
  metadata: {
    category: 'awareness' | 'processing' | 'integration' | 'action'
    duration: number
    difficulty: 'easy' | 'moderate' | 'challenging'
    traumaFocus: string[]
  }
}

interface ProgramAnalysis {
  primaryTraumaPatterns: string[]
  coreIssues: string[]
  healingGoals: string[]
  recommendedApproach: string
  safetyConsiderations: string[]
}

export class AIProgramGenerator {
  private openaiKey: string

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || ''
  }

  async generatePersonalizedProgram(
    diagnosticResponses: DiagnosticResponse[],
    userProfile: UserProfile,
    summary: string
  ): Promise<PersonalizedDay[]> {
    try {
      // First, analyze the diagnostic data
      const analysis = await this.analyzeDiagnosticData(diagnosticResponses, userProfile, summary)
      
      // Generate personalized program based on analysis
      const program = await this.createProgramDays(analysis, userProfile)
      
      return program
    } catch (error) {
      console.error('Error generating personalized program:', error)
      throw new Error('Failed to generate personalized program')
    }
  }

  private async analyzeDiagnosticData(
    responses: DiagnosticResponse[],
    userProfile: UserProfile,
    summary: string
  ): Promise<ProgramAnalysis> {
    const prompt = `
You are a trauma-informed therapist analyzing a client's diagnostic responses to create a personalized healing program.

CLIENT PROFILE:
- Communication Style: ${userProfile.tone} tone, ${userProfile.voice} voice
- Engagement Level: ${userProfile.engagement}, ${userProfile.rawness} rawness
- Goals: ${userProfile.goals.join(', ')}
- Experience Level: ${userProfile.experience}
- Time Commitment: ${userProfile.timeCommitment}

DIAGNOSTIC SUMMARY:
${summary}

DIAGNOSTIC RESPONSES:
${responses.map(r => `Q: ${r.question}\nA: ${r.response}\nInsight: ${r.insight}`).join('\n\n')}

ANALYZE AND PROVIDE:
1. Primary trauma patterns (3-5 key patterns)
2. Core issues to address (3-5 main issues)
3. Specific healing goals (3-5 actionable goals)
4. Recommended therapeutic approach
5. Safety considerations for this client

Respond in JSON format:
{
  "primaryTraumaPatterns": ["pattern1", "pattern2"],
  "coreIssues": ["issue1", "issue2"],
  "healingGoals": ["goal1", "goal2"],
  "recommendedApproach": "description",
  "safetyConsiderations": ["consideration1", "consideration2"]
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a trauma-informed therapist specializing in personalized healing programs. Provide analysis in the exact JSON format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error('Failed to analyze diagnostic data')
    }

    const data = await response.json()
    const analysisText = data.choices[0].message.content
    
    try {
      return JSON.parse(analysisText)
    } catch (error) {
      console.error('Failed to parse analysis JSON:', error)
      throw new Error('Invalid analysis response format')
    }
  }

  private async createProgramDays(
    analysis: ProgramAnalysis,
    userProfile: UserProfile
  ): Promise<PersonalizedDay[]> {
    const program: PersonalizedDay[] = []
    
    // Generate 30 days of personalized content
    for (let day = 1; day <= 30; day++) {
      const dayContent = await this.generateDayContent(day, analysis, userProfile)
      program.push(dayContent)
    }
    
    return program
  }

  private async generateDayContent(
    day: number,
    analysis: ProgramAnalysis,
    userProfile: UserProfile
  ): Promise<PersonalizedDay> {
    const phase = this.getPhaseForDay(day)
    const focus = this.getFocusForDay(day, analysis)
    
    const prompt = `
Generate personalized content for Day ${day} of a 30-day trauma healing program.

CLIENT ANALYSIS:
- Trauma Patterns: ${analysis.primaryTraumaPatterns.join(', ')}
- Core Issues: ${analysis.coreIssues.join(', ')}
- Healing Goals: ${analysis.healingGoals.join(', ')}
- Approach: ${analysis.recommendedApproach}

CLIENT PROFILE:
- Tone: ${userProfile.tone}
- Voice: ${userProfile.voice}
- Engagement: ${userProfile.engagement}
- Time: ${userProfile.timeCommitment}

DAY ${day} SPECIFICATIONS:
- Phase: ${phase}
- Focus: ${focus}
- Duration: ${this.getDurationForDay(day)} minutes
- Difficulty: ${this.getDifficultyForDay(day)}

Create content that is:
- Personalized to their specific trauma patterns
- Matches their communication style (${userProfile.tone}, ${userProfile.voice})
- Appropriate for their engagement level (${userProfile.engagement})
- Respectful of their time commitment (${userProfile.timeCommitment})
- Trauma-informed and safety-conscious

Respond in JSON format:
{
  "day": ${day},
  "title": "Engaging title",
  "focus": "Specific focus for this day",
  "content": {
    "introduction": "Personalized introduction",
    "guidedPractice": "Step-by-step practice",
    "challenge": "Daily challenge",
    "journalingPrompt": "Reflective question",
    "reflection": "Closing reflection",
    "tools": ["tool1", "tool2"]
  },
  "metadata": {
    "category": "${phase}",
    "duration": ${this.getDurationForDay(day)},
    "difficulty": "${this.getDifficultyForDay(day)}",
    "traumaFocus": ["focus1", "focus2"]
  }
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a trauma-informed therapist creating personalized healing content. Generate engaging, safe, and effective content in the exact JSON format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to generate content for day ${day}`)
    }

    const data = await response.json()
    const contentText = data.choices[0].message.content
    
    try {
      return JSON.parse(contentText)
    } catch (error) {
      console.error(`Failed to parse day ${day} JSON:`, error)
      // Return fallback content
      return this.getFallbackDayContent(day, analysis, userProfile)
    }
  }

  private getPhaseForDay(day: number): string {
    if (day <= 7) return 'awareness'
    if (day <= 14) return 'processing'
    if (day <= 21) return 'integration'
    return 'action'
  }

  private getFocusForDay(day: number, analysis: ProgramAnalysis): string {
    const patterns = analysis.primaryTraumaPatterns
    const issues = analysis.coreIssues
    
    if (day <= 7) {
      return `Building awareness of ${patterns[0] || 'your patterns'}`
    } else if (day <= 14) {
      return `Processing ${issues[0] || 'core issues'}`
    } else if (day <= 21) {
      return `Integrating new perspectives on ${patterns[1] || 'healing'}`
    } else {
      return `Taking action toward ${analysis.healingGoals[0] || 'your goals'}`
    }
  }

  private getDurationForDay(day: number): number {
    if (day <= 7) return 15
    if (day <= 14) return 20
    if (day <= 21) return 25
    return 30
  }

  private getDifficultyForDay(day: number): string {
    if (day <= 7) return 'easy'
    if (day <= 14) return 'moderate'
    if (day <= 21) return 'moderate'
    return 'challenging'
  }

  private getFallbackDayContent(
    day: number,
    analysis: ProgramAnalysis,
    userProfile: UserProfile
  ): PersonalizedDay {
    const phase = this.getPhaseForDay(day)
    const focus = this.getFocusForDay(day, analysis)
    
    return {
      day,
      title: `Day ${day}: ${focus}`,
      focus,
      content: {
        introduction: `Today we'll focus on ${focus.toLowerCase()}. This is part of your ${phase} phase.`,
        guidedPractice: `Take ${this.getDurationForDay(day)} minutes to reflect on how ${analysis.primaryTraumaPatterns[0] || 'your patterns'} show up in your life.`,
        challenge: `Notice one moment today where you can apply what you're learning.`,
        journalingPrompt: `How does ${focus.toLowerCase()} relate to your healing goals?`,
        reflection: `What did you discover about yourself today?`,
        tools: ['Journaling', 'Mindfulness', 'Self-reflection']
      },
      metadata: {
        category: phase as any,
        duration: this.getDurationForDay(day),
        difficulty: this.getDifficultyForDay(day) as any,
        traumaFocus: analysis.primaryTraumaPatterns.slice(0, 2)
      }
    }
  }
}
