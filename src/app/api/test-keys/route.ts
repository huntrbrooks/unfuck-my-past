import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 Testing API keys...')
  
  const results = {
    openai: {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyPreview: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 7)}...${process.env.OPENAI_API_KEY.slice(-4)}` : 'Not set',
      working: false,
      error: ''
    },
    anthropic: {
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      keyPreview: process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.substring(0, 7)}...${process.env.ANTHROPIC_API_KEY.slice(-4)}` : 'Not set',
      working: false,
      error: ''
    }
  }

  // Test OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('🤖 Testing OpenAI API...')
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        })
      })

      if (response.ok) {
        results.openai.working = true
        console.log('✅ OpenAI API working')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        results.openai.error = `HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`
        console.log('❌ OpenAI API error:', results.openai.error)
      }
    } catch (error) {
      results.openai.error = error instanceof Error ? error.message : 'Network error'
      console.log('❌ OpenAI API network error:', results.openai.error)
    }
  }

  // Test Anthropic API
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('🤖 Testing Anthropic API...')
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Test' }]
        })
      })

      if (response.ok) {
        results.anthropic.working = true
        console.log('✅ Anthropic API working')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        results.anthropic.error = `HTTP ${response.status}: ${errorData.error?.message || errorData.error?.type || 'Unknown error'}`
        console.log('❌ Anthropic API error:', results.anthropic.error)
      }
    } catch (error) {
      results.anthropic.error = error instanceof Error ? error.message : 'Network error'
      console.log('❌ Anthropic API network error:', results.anthropic.error)
    }
  }

  return NextResponse.json(results)
}
