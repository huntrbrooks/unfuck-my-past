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
    // Use Claude-3.5-Sonnet for insights (unless specifically requested to use OpenAI)
    if (useClaude || !this.openaiKey) {
      if (this.claudeKey) {
        try {
          console.log('Attempting Claude-3.5-Sonnet insight...')
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': this.claudeKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 800,
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
            console.log('Claude-3.5-Sonnet insight successful')
            return {
              insight: data.content[0].text,
              model: 'claude-3-5-sonnet',
              timestamp: new Date().toISOString()
            }
          } else {
            console.log('Claude-3.5-Sonnet insight failed, trying OpenAI fallback...')
            throw new Error('Claude request failed')
          }
        } catch (error) {
          // If Claude fails, try OpenAI as fallback
          if (this.openaiKey) {
            try {
              return await this.generateOpenAIInsight(prompt, userResponse)
            } catch {
              throw new Error('Both AI services failed')
            }
          }
          throw error
        }
      }
    }

    // Try OpenAI as primary or fallback
    if (this.openaiKey) {
      try {
        return await this.generateOpenAIInsight(prompt, userResponse)
      } catch (error) {
        // If OpenAI fails and Claude is available, try Claude
        if (this.claudeKey) {
          try {
            console.log('OpenAI failed, trying Claude-3.5-Sonnet...')
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': this.claudeKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 800,
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
              return {
                insight: data.content[0].text,
                model: 'claude-3-5-sonnet',
                timestamp: new Date().toISOString()
              }
            }
          } catch {
            throw new Error('Both AI services failed')
          }
        }
        throw error
      }
    }

    throw new Error('No AI service available')
  }

  private async generateOpenAIInsight(prompt: string, userResponse: string, model: string = 'gpt-4o-mini'): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
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
      model,
      timestamp: new Date().toISOString()
    }
  }

  // Cheap achievement idea generator (fallback heuristic if key missing)
  async generateAchievementIdea(context: string): Promise<string> {
    try {
      const key = (this as unknown as { openaiKey?: string }).openaiKey
      if (!key) {
        // Heuristic fallback
        const ideas = [
          'Log your mood 3 days in a row',
          'Write 2 journal entries this week',
          'Complete Day 1 of the 30‑day program',
          'Revisit your diagnostic results',
          'Add a reflection note to today\'s entry'
        ]
        return ideas[Math.floor(Math.random() * ideas.length)]
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `Given this user context, propose a short achievement (7 words max) that is concrete and trackable. Context: ${context}` }],
          max_tokens: 50
        })
      })
      const data = await res.json()
      return data?.choices?.[0]?.message?.content?.trim() || 'Complete a small win today'
    } catch {
      return 'Complete a small win today'
    }
  }

  async generateDiagnosticSummary(
    allResponses: Array<{ question: string; response: string; insight: string }>,
    userPreferences: { tone: string; voice: string; rawness: string; depth: string }
  ): Promise<AIResponse> {
    const summaryPrompt = `Based on the following diagnostic responses and insights, provide a SHORT, INTRIGUING summary (maximum 3-4 sentences) that creates curiosity and makes the user desperate to learn more. This is for the FREE version - be compelling but don't give away everything.

User Preferences: ${JSON.stringify(userPreferences)}

Responses and Insights:
${allResponses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Create a brief, powerful summary that:
- Hints at deep patterns discovered
- Creates emotional intrigue
- Suggests there's much more valuable insight behind the paywall
- Uses the user's preferred tone and voice
- Ends with a compelling hook that makes them want the full report`

    // Use Claude-3-Opus for diagnostic summary
    if (this.claudeKey) {
      try {
        console.log('Attempting Claude-3-Opus diagnostic summary...')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.claudeKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1500,
            messages: [
              {
                role: 'user',
                content: summaryPrompt
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Claude-3-Opus diagnostic summary successful')
          return {
            insight: data.content[0].text,
            model: 'claude-3-opus',
            timestamp: new Date().toISOString()
          }
        } else {
          console.log('Claude-3-Opus diagnostic summary failed, trying OpenAI fallback...')
          throw new Error('Claude request failed')
        }
      } catch (error) {
        // If Claude fails, try OpenAI as fallback
        if (this.openaiKey) {
          try {
            return await this.generateOpenAIInsight(summaryPrompt, '')
          } catch {
            throw new Error('Both AI services failed')
          }
        }
        throw error
      }
    }

    // Fallback to OpenAI if Claude is not available
    return this.generateInsight(summaryPrompt, '', false)
  }

  async generateKeyInsights(
    allResponses: Array<{ question: string; response: string; insight: string }>,
    userPreferences: { tone: string; voice: string; rawness: string; depth: string }
  ): Promise<AIResponse> {
    const insightsPrompt = `Based on the following diagnostic responses, generate 3-4 powerful, specific key insights that will intrigue the user and make them want to learn more. Each insight should be 1-2 sentences maximum.

User Preferences: ${JSON.stringify(userPreferences)}

Responses and Insights:
${allResponses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Generate insights that:
- Are specific and personal to their responses
- Create emotional resonance
- Hint at deeper patterns without revealing everything
- Use their preferred tone and voice
- Make them curious about the full analysis

Format as a numbered list.`

    // Use Claude-3.5-Sonnet for key insights
    if (this.claudeKey) {
      try {
        console.log('Attempting Claude-3.5-Sonnet key insights...')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.claudeKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 800,
            messages: [
              {
                role: 'user',
                content: insightsPrompt
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Claude-3.5-Sonnet key insights successful')
          return {
            insight: data.content[0].text,
            model: 'claude-3-5-sonnet',
            timestamp: new Date().toISOString()
          }
        } else {
          console.log('Claude-3.5-Sonnet key insights failed, trying OpenAI fallback...')
          throw new Error('Claude request failed')
        }
      } catch (error) {
        // If Claude fails, try OpenAI as fallback
        if (this.openaiKey) {
          try {
            return await this.generateOpenAIInsight(insightsPrompt, '')
          } catch {
            throw new Error('Both AI services failed')
          }
        }
        throw error
      }
    }

    // Fallback to OpenAI if Claude is not available
    return this.generateInsight(insightsPrompt, '', false)
  }

  async generateComprehensiveReport(
    allResponses: Array<{ question: string; response: string; insight: string }>,
    userPreferences: { tone: string; voice: string; rawness: string; depth: string }
  ): Promise<AIResponse> {
    const reportPrompt = `Based on the following diagnostic responses and insights, generate a COMPREHENSIVE diagnostic report that provides deep analysis, actionable insights, and valuable guidance. This is for the PAID version - be thorough and insightful.

User Preferences: ${JSON.stringify(userPreferences)}

Responses and Insights:
${allResponses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Please provide a comprehensive report with the following sections. IMPORTANT: Do NOT use markdown syntax (no ##, ###, or -). Use plain text with clear section headers and proper formatting:

🎯 EXECUTIVE SUMMARY
A powerful overview of key findings and what this means for their healing journey.

🧠 TRAUMA ANALYSIS
Deep dive into trauma patterns, triggers, and psychological impacts.

📊 TOXICITY SCORE ASSESSMENT
Rate their current toxicity level out of 10 and explain what this means.

💪 HOW TO LEAN INTO YOUR STRENGTHS
Identify 2-3 key strengths from their responses and provide a short inspirational paragraph on how to leverage each strength to overcome triggers and self-destructive behaviors.

🚨 MOST IMPORTANT TO ADDRESS
A clear call-to-action section identifying their most pressing issue and providing immediate actionable steps they can take right now to start working on it.

🔄 BEHAVIORAL PATTERNS
Analysis of recurring patterns and their root causes.

🛣️ HEALING ROADMAP
Step-by-step guidance for their healing journey. Format this as a clear flow chart with numbered steps.

⚡ ACTIONABLE RECOMMENDATIONS
Specific, practical steps they can take immediately.

📚 RESOURCES AND NEXT STEPS
Additional resources and guidance for continued growth.

FORMATTING REQUIREMENTS:
• Use plain text headers (no markdown ## or ###)
• Use • for bullet points (not - or *)
• Each information point should be on its own line
• Make the healing roadmap a clear numbered flow chart
• Use their preferred tone and voice throughout
• Be comprehensive, insightful, and provide real value
• Include emojis and make it engaging and visually appealing`

    // Use GPT-4.1 for comprehensive report
    if (this.openaiKey) {
      try {
        console.log('Attempting GPT-4.1 comprehensive report...')
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: reportPrompt
              }
            ],
            max_tokens: 3000
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('GPT-4.1 comprehensive report successful')
          return {
            insight: data.choices[0].message.content,
            model: 'gpt-4o-mini',
            timestamp: new Date().toISOString()
          }
        } else {
          console.log('GPT-4.1 comprehensive report failed, trying Claude fallback...')
          throw new Error('OpenAI request failed')
        }
      } catch (error) {
        // If OpenAI fails, try Claude as fallback
        if (this.claudeKey) {
          try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': this.claudeKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                max_tokens: 3000,
                messages: [
                  {
                    role: 'user',
                    content: reportPrompt
                  }
                ]
              })
            })

            if (response.ok) {
              const data = await response.json()
              console.log('Claude-3-Opus comprehensive report successful')
              return {
                insight: data.content[0].text,
                model: 'claude-3-opus',
                timestamp: new Date().toISOString()
              }
            }
          } catch {
            throw new Error('Both AI services failed')
          }
        }
        throw error
      }
    }

    // Fallback to Claude if OpenAI is not available
    if (this.claudeKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.claudeKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 3000,
            messages: [
              {
                role: 'user',
                content: reportPrompt
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          return {
            insight: data.content[0].text,
            model: 'claude-3-opus',
            timestamp: new Date().toISOString()
          }
        }
      } catch {
        throw new Error('AI service unavailable')
      }
    }

    throw new Error('No AI service available')
  }
}
