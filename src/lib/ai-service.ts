interface AIResponse {
  insight: string
  model: string
  timestamp: string
}

export class AIService {
  private openaiKey: string
  private claudeKey: string

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || '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'
    this.claudeKey = process.env.CLAUDE_API_KEY || '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'
  }

  async generateInsight(prompt: string, userResponse: string, useClaude: boolean = false): Promise<AIResponse> {
    // Try OpenAI first (unless Claude is specifically requested)
    if (!useClaude && this.openaiKey) {
      try {
        console.log('Attempting OpenAI insight...')
        const result = await this.generateOpenAIInsight(prompt, userResponse)
        console.log('OpenAI insight successful')
        return result
      } catch (openaiError) {
        console.log('OpenAI insight failed, trying Claude...')
        // Fall through to Claude
      }
    }

    // Try Claude (either as primary or fallback)
    if (this.claudeKey && !this.claudeKey.includes('invalid')) {
      try {
        console.log('Attempting Claude insight...')
        const result = await this.generateClaudeInsight(prompt, userResponse)
        console.log('Claude insight successful')
        return result
      } catch (claudeError) {
        console.log('Claude insight failed, trying OpenAI fallback...')
        // Fall through to OpenAI fallback
      }
    }

    // Try OpenAI as final fallback
    if (this.openaiKey) {
      try {
        console.log('Attempting OpenAI fallback insight...')
        const result = await this.generateOpenAIInsight(prompt, userResponse)
        console.log('OpenAI fallback insight successful')
        return result
      } catch (fallbackError) {
        console.log('OpenAI fallback also failed')
      }
    }

    // If all AI services fail, return a generic response
    console.log('All AI services failed, using generic insight')
    return {
      insight: "I'm having trouble analyzing your response right now. Let's continue with the next question.",
      model: 'fallback',
      timestamp: new Date().toISOString()
    }
  }

  private async generateOpenAIInsight(prompt: string, userResponse: string): Promise<AIResponse> {
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
            content: prompt
          },
          {
            role: 'user',
            content: userResponse
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const insight = data.choices[0]?.message?.content?.trim() || 'Unable to generate insight.'

    return {
      insight,
      model: 'gpt-4',
      timestamp: new Date().toISOString()
    }
  }

  private async generateClaudeInsight(prompt: string, userResponse: string): Promise<AIResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.claudeKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nUser Response: ${userResponse}`
          }
        ]
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const insight = data.content[0]?.text?.trim() || 'Unable to generate insight.'

    return {
      insight,
      model: 'claude-3-sonnet',
      timestamp: new Date().toISOString()
    }
  }

  async generateDiagnosticSummary(
    allResponses: Array<{ question: string; response: string; insight: string }>,
    userPreferences: any
  ): Promise<AIResponse> {
    const summaryPrompt = `
You are an expert trauma-informed therapist creating a comprehensive diagnostic summary.

CLIENT PREFERENCES:
- Communication Style: ${userPreferences.tone}
- Content Intensity: ${userPreferences.rawness}
- Exploration Depth: ${userPreferences.depth}
- Goals: ${userPreferences.goals.join(', ')}

DIAGNOSTIC RESPONSES:
${allResponses.map((r, i) => `Question ${i + 1}: ${r.question}\nResponse: ${r.response}\nInsight: ${r.insight}`).join('\n\n')}

Create a 3-4 paragraph diagnostic summary that:
1. Acknowledges their courage in sharing
2. Identifies 2-3 key patterns or themes
3. Provides gentle, trauma-informed insights
4. Matches their preferred communication style (${userPreferences.tone})
5. Offers hope and next steps

Keep the tone ${userPreferences.tone} and depth ${userPreferences.depth}. Be ${userPreferences.rawness} but always supportive and trauma-informed.
`

    return await this.generateInsight(summaryPrompt, '', false) // Use GPT-4 for summaries
  }
}
