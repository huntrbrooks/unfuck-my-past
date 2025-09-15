import { NextResponse } from 'next/server'

export async function POST() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasClaude = !!process.env.CLAUDE_API_KEY
  const env = process.env.NODE_ENV || 'development'
  return NextResponse.json({
    message: hasOpenAI || hasClaude
      ? `AI services reachable: ${hasOpenAI ? 'OpenAI' : ''}${hasOpenAI && hasClaude ? ' + ' : ''}${hasClaude ? 'Claude' : ''}. (${env})`
      : `No AI keys detected in this environment (${env}).`,
    openai: hasOpenAI,
    claude: hasClaude,
    env
  })
}


