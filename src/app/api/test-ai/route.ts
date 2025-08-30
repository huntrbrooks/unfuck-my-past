import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    const claudeKey = process.env.CLAUDE_API_KEY

    const results = {
      openai: { available: false, error: null },
      claude: { available: false, error: null }
    }

    // Test OpenAI
    if (openaiKey) {
      try {
        console.log('Testing OpenAI...')
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'user',
                content: 'Say "OpenAI is working"'
              }
            ],
            max_tokens: 10
          })
        })

        if (response.ok) {
          const data = await response.json()
          results.openai.available = true
          results.openai.response = data.choices[0].message.content
          console.log('OpenAI test successful')
        } else {
          results.openai.error = `Status: ${response.status}`
          console.log('OpenAI test failed:', response.status)
        }
      } catch (error) {
        results.openai.error = error instanceof Error ? error.message : 'Unknown error'
        console.log('OpenAI test error:', error)
      }
    } else {
      results.openai.error = 'No API key configured'
    }

    // Test Claude
    if (claudeKey) {
      try {
        console.log('Testing Claude...')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${claudeKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'Say "Claude is working"'
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          results.claude.available = true
          results.claude.response = data.content[0].text
          console.log('Claude test successful')
        } else {
          results.claude.error = `Status: ${response.status}`
          console.log('Claude test failed:', response.status)
        }
      } catch (error) {
        results.claude.error = error instanceof Error ? error.message : 'Unknown error'
        console.log('Claude test error:', error)
      }
    } else {
      results.claude.error = 'No API key configured'
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error testing AI services:', error)
    return NextResponse.json(
      { error: 'Failed to test AI services' },
      { status: 500 }
    )
  }
}
