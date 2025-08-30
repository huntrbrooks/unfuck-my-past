interface AIResponse {
  insight: string
  model: string
  timestamp: string
}

export class AIService {
  private openaiKey: string
  private claudeKey: string

  constructor() {
    // SECURITY: Never log API keys - only load from environment variables
    this.openaiKey = process.env.OPENAI_API_KEY || ''
    this.claudeKey = process.env.CLAUDE_API_KEY || ''
  }

  async generateInsight(prompt: string, userResponse: string, useClaude: boolean = false): Promise<AIResponse> {
    // Try OpenAI first (unless specifically requested to use Claude)
    if (!useClaude && this.openaiKey) {
      try {
        return await this.generateOpenAIInsight(prompt, userResponse)
      } catch (error) {
        console.log('OpenAI insight failed, trying Claude...')
        // Fall back to Claude if OpenAI fails
      }
    }

    // Try Claude if OpenAI failed or was specifically requested
    if (this.claudeKey) {
      try {
        console.log('Attempting Claude insight...')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.claudeKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
                                  model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [
              {
                role: 'user',
                content: `${prompt}\n\nUser Response: ${userResponse}`
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Claude insight successful')
          return {
            insight: data.content[0].text,
            model: 'claude-3-sonnet',
            timestamp: new Date().toISOString()
          }
        } else {
          console.log('Claude insight failed, trying OpenAI fallback...')
          throw new Error('Claude request failed')
        }
      } catch (error) {
        // If Claude also fails, try OpenAI as fallback
        if (this.openaiKey) {
          try {
            return await this.generateOpenAIInsight(prompt, userResponse)
          } catch (fallbackError) {
            throw new Error('Both AI services failed')
          }
        }
        throw error
      }
    }

    throw new Error('No AI service available')
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
            role: 'user',
            content: `${prompt}\n\nUser Response: ${userResponse}`
          }
        ],
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI request failed')
    }

    const data = await response.json()
    return {
      insight: data.choices[0].message.content,
      model: 'gpt-4',
      timestamp: new Date().toISOString()
    }
  }

  async generateDiagnosticSummary(
    allResponses: Array<{ question: string; response: string; insight: string }>,
    userPreferences: any
  ): Promise<AIResponse> {
    const summaryPrompt = `Based on the following diagnostic responses and insights, provide a comprehensive summary that identifies patterns, themes, and key areas for healing. Focus on actionable insights and avoid generic advice.

User Preferences: ${JSON.stringify(userPreferences)}

Responses and Insights:
${allResponses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Please provide a structured summary that includes:
1. Key patterns identified
2. Primary areas for healing
3. Recommended next steps
4. Safety considerations`

    return this.generateInsight(summaryPrompt, '', false)
  }
}
