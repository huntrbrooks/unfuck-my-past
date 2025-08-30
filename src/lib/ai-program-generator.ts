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
  private claudeKey: string

  constructor() {
    // SECURITY: Never log API keys - only load from environment variables
    this.openaiKey = process.env.OPENAI_API_KEY || ''
    this.claudeKey = process.env.CLAUDE_API_KEY || ''
    
    if (!this.openaiKey && !this.claudeKey) {
      console.error('No AI API keys found')
    }
  }

  async generatePersonalizedProgram(
    diagnosticResponses: DiagnosticResponse[],
    userProfile: UserProfile,
    summary: string,
    onboardingAnalysis?: any
  ): Promise<PersonalizedDay[]> {
    try {
      // First, try to analyze the diagnostic data with AI
      let analysis: ProgramAnalysis
      
      try {
        analysis = await this.analyzeDiagnosticData(diagnosticResponses, userProfile, summary, onboardingAnalysis)
      } catch (error) {
        console.log('AI analysis failed, using fallback analysis')
        analysis = this.getFallbackAnalysis(diagnosticResponses, userProfile)
      }
      
      // Generate personalized program based on analysis
      const program = await this.createProgramDays(analysis, userProfile)
      
      return program
    } catch (error) {
      console.error('Error generating personalized program:', error)
      // Return a basic fallback program
      return this.getFallbackProgram(userProfile)
    }
  }

  private async analyzeDiagnosticData(
    responses: DiagnosticResponse[],
    userProfile: UserProfile,
    summary: string,
    onboardingAnalysis?: any
  ): Promise<ProgramAnalysis> {
    const prompt = `
You are a trauma-informed therapist analyzing a client's diagnostic responses to create a personalized healing program.

CLIENT PROFILE:
- Communication Style: ${userProfile.tone} tone, ${userProfile.voice} voice
- Engagement Level: ${userProfile.engagement}, ${userProfile.rawness} rawness
- Goals: ${userProfile.goals.join(', ')}
- Experience Level: ${userProfile.experience}
- Time Commitment: ${userProfile.timeCommitment}

${onboardingAnalysis ? `
ONBOARDING ANALYSIS:
- Focus Areas: ${onboardingAnalysis.focusAreas?.join(', ') || 'Not specified'}
- Communication Style: ${onboardingAnalysis.communicationStyle || 'Not specified'}
- Intensity Level: ${onboardingAnalysis.intensityLevel || 'Not specified'}
- Depth Level: ${onboardingAnalysis.depthLevel || 'Not specified'}
- Custom Categories: ${onboardingAnalysis.customCategories?.join(', ') || 'Not specified'}
` : ''}

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

    // Try OpenAI first
    if (this.openaiKey) {
      try {
        console.log('Attempting OpenAI analysis...')
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

        if (response.ok) {
          const data = await response.json()
          const analysisText = data.choices[0].message.content
          
          try {
            const analysis = JSON.parse(analysisText)
            console.log('OpenAI analysis successful')
            return analysis
          } catch (parseError) {
            console.log('OpenAI response parsing failed, trying Claude...')
            throw new Error('Failed to parse OpenAI response')
          }
        } else {
          console.log('OpenAI request failed, trying Claude...')
          throw new Error('OpenAI request failed')
        }
      } catch (openaiError) {
        console.log('OpenAI error:', openaiError)
        // Fall through to Claude
      }
    }

    // Try Claude as fallback
    if (this.claudeKey) {
      try {
        console.log('Attempting Claude analysis...')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
                                  'x-api-key': this.claudeKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
                                  model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          const analysisText = data.content[0].text
          
          try {
            const analysis = JSON.parse(analysisText)
            console.log('Claude analysis successful')
            return analysis
          } catch (parseError) {
            console.log('Claude response parsing failed, using fallback...')
            throw new Error('Failed to parse Claude response')
          }
        } else {
          console.log('Claude request failed, using fallback...')
          throw new Error('Claude request failed')
        }
      } catch (claudeError) {
        console.log('Claude error:', claudeError)
        // Fall through to fallback
      }
    }

    // If both AI services fail, use fallback
    console.log('Both OpenAI and Claude failed, using fallback analysis')
    throw new Error('All AI services failed')
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

    if (!this.openaiKey) {
      throw new Error('OpenAI API key is missing')
    }

    console.log(`Generating content for day ${day}...`)
    
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

    console.log(`Day ${day} OpenAI response status:`, response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenAI API error for day ${day}:`, errorText)
      throw new Error(`Failed to generate content for day ${day}: ${response.status} ${errorText}`)
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

  private getFallbackAnalysis(
    responses: DiagnosticResponse[],
    userProfile: UserProfile
  ): ProgramAnalysis {
    // Extract common themes from responses
    const responseText = responses.map(r => r.response).join(' ')
    const insightText = responses.map(r => r.insight).join(' ')
    
    // Simple keyword analysis
    const keywords = {
      trauma: ['trauma', 'pain', 'hurt', 'abuse', 'neglect'],
      patterns: ['pattern', 'repeat', 'cycle', 'habit'],
      relationships: ['relationship', 'partner', 'family', 'friend'],
      self: ['self', 'confidence', 'worth', 'value'],
      coping: ['cope', 'deal', 'handle', 'manage']
    }
    
    const detectedPatterns: string[] = []
    Object.entries(keywords).forEach(([category, words]) => {
      const count = words.filter(word => 
        responseText.toLowerCase().includes(word) || 
        insightText.toLowerCase().includes(word)
      ).length
      if (count > 0) {
        detectedPatterns.push(category)
      }
    })
    
    return {
      primaryTraumaPatterns: detectedPatterns.length > 0 ? detectedPatterns : ['general healing'],
      coreIssues: ['self-awareness', 'emotional processing', 'behavioral change'],
      healingGoals: userProfile.goals.length > 0 ? userProfile.goals : ['personal growth'],
      recommendedApproach: `${userProfile.tone} and ${userProfile.voice} approach`,
      safetyConsiderations: ['self-compassion', 'gradual progress', 'professional support if needed']
    }
  }

  private getFallbackProgram(userProfile: UserProfile): PersonalizedDay[] {
    const program: PersonalizedDay[] = []
    
    for (let day = 1; day <= 30; day++) {
      const phase = this.getPhaseForDay(day)
      const duration = this.getDurationForDay(day)
      const difficulty = this.getDifficultyForDay(day)
      
      const dayContent: PersonalizedDay = {
        day,
        title: `Day ${day}: ${this.getFallbackFocus(day)}`,
        focus: this.getFallbackFocus(day),
        content: {
          introduction: `Welcome to Day ${day} of your healing journey. Today we focus on ${this.getFallbackFocus(day).toLowerCase()}.`,
          guidedPractice: `Take ${duration} minutes to ${this.getFallbackPractice(day)}.`,
          challenge: this.getFallbackChallenge(day),
          journalingPrompt: this.getFallbackJournalingPrompt(day),
          reflection: `What did you learn about yourself today? How can you apply this tomorrow?`,
          tools: ['Journaling', 'Mindfulness', 'Breathing', 'Self-reflection']
        },
        metadata: {
          category: phase as any,
          duration,
          difficulty: difficulty as any,
          traumaFocus: ['general healing', 'self-awareness']
        }
      }
      
      program.push(dayContent)
    }
    
    return program
  }

  private getFallbackFocus(day: number): string {
    if (day <= 7) return 'Building Self-Awareness'
    if (day <= 14) return 'Processing Emotions'
    if (day <= 21) return 'Integrating Insights'
    return 'Taking Action'
  }

  private getFallbackPractice(day: number): string {
    if (day <= 7) return 'observe your thoughts and feelings without judgment'
    if (day <= 14) return 'explore one challenging emotion in detail'
    if (day <= 21) return 'practice self-compassion and acceptance'
    return 'take one small step toward your healing goals'
  }

  private getFallbackChallenge(day: number): string {
    if (day <= 7) return 'Notice three moments today when you feel triggered or uncomfortable'
    if (day <= 14) return 'Practice responding differently to one challenging situation'
    if (day <= 21) return 'Share one insight with someone you trust'
    return 'Commit to one action that aligns with your healing goals'
  }

  private getFallbackJournalingPrompt(day: number): string {
    if (day <= 7) return 'What patterns do you notice in your thoughts and behaviors?'
    if (day <= 14) return 'What emotions are you avoiding or suppressing?'
    if (day <= 21) return 'How can you be kinder to yourself today?'
    return 'What would your future self thank you for doing today?'
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
