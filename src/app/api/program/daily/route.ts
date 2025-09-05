import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses } from '@/db'
import { ProgramGenerator } from '@/lib/program-generator'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dayNumber, weatherData } = body

    if (!dayNumber || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // Get user preferences and diagnostic responses
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userData[0]
    const userPreferences = {
      tone: user.tone || 'gentle',
      voice: user.voice || 'friend',
      rawness: user.rawness || 'moderate',
      depth: user.depth || 'moderate',
      learning: user.learning || 'text',
      engagement: user.engagement || 'passive',
      ...(user.safety || {})
    }

    // Get diagnostic responses
    const responses = await db
      .select()
      .from(diagnosticResponses)
      .where(eq(diagnosticResponses.userId, userId))
      .orderBy(diagnosticResponses.createdAt)

    if (!responses.length) {
      return NextResponse.json({ error: 'No diagnostic responses found' }, { status: 404 })
    }

    // Transform responses to match expected type
    const transformedResponses = responses.map(resp => ({
      question: resp.question && typeof resp.question === 'object' && 'text' in resp.question ? (resp.question as { text: string }).text : `Question ${resp.id}`,
      response: resp.response || '',
      insight: resp.insight || '',
      createdAt: resp.createdAt || new Date()
    }))

    // Generate the specific day's content
    const programGenerator = new ProgramGenerator()
    const dailyContent = await programGenerator.generateDailyContent(dayNumber, transformedResponses, userPreferences, weatherData)
    // Derive theme and poetic title server-side so it's stable across sessions
    const parseMainFocus = (content: string): string => {
      const match = content.match(/🎯\s*MAIN\s*FOCUS:\s*(.+)/)
      if (match && match[1]) return match[1].trim()
      // fallback: pick first strong line
      const line = (content.split('\n').find(l => l.trim().length > 8) || '').trim()
      return line || 'Daily Healing Practice'
    }
    const hashString = (s: string) => {
      let h = 0
      for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
      return Math.abs(h)
    }
    const stop = new Set(['the','and','a','an','to','of','in','on','for','with','your','you','we','our','is','are','be','this','that','by','from','at','as','into','without','being','their','them','it','about'])
    const extractKeywords = (text: string, limit = 3) => text
      .replace(/[^a-zA-Z\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3 && !stop.has(w))
      .slice(0, limit)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    const deriveTheme = (mainFocus: string): string => {
      const rules: Array<{ re: RegExp; themes: string[] }> = [
        { re: /(emotion|overwhelm|feeling|regulate|regulation)/i, themes: ['Emotional Resilience', 'Calm Response', 'Steady Heart', 'Clear Feeling'] },
        { re: /(boundary|boundaries|limit|space)/i, themes: ['Gentle Boundaries', 'Sacred Space', 'Firm Kindness', 'Quiet Strength'] },
        { re: /(shame|guilt|worth|worthless)/i, themes: ['Self‑Forgiveness', 'Soft Worth', 'Inner Kindness', 'Belonging'] },
        { re: /(trust|relationship|attach|intimacy|connection|connect)/i, themes: ['Honest Connection', 'Open Trust', 'Brave Intimacy', 'Kind Presence'] },
        { re: /(mindful|breath|breathe|ground|present|awareness)/i, themes: ['Grounded Presence', 'Slow Breath', 'Calm Anchor', 'Still Mind'] },
        { re: /(sleep|rest|restore|fatigue|tired)/i, themes: ['Deep Rest', 'Soft Night', 'Restful Mind', 'Gentle Unwind'] },
        { re: /(trigger|react|reaction)/i, themes: ['Pause Power', 'Trigger Tamer', 'Chosen Response', 'Steady Pause'] }
      ]
      for (const r of rules) {
        if (r.re.test(mainFocus)) {
          const idx = hashString(mainFocus) % r.themes.length
          return r.themes[idx]
        }
      }
      const kws = extractKeywords(mainFocus, 3)
      return kws.length ? kws.join(' ') : 'Daily Intention'
    }
    const derivePoeticTitle = (mainFocus: string, theme: string): string => {
      const base = extractKeywords(mainFocus, 2)
      const noun = base[0] || 'Heart'
      const noun2 = base[1] || 'Calm'
      const pools: Record<string, string[]> = {
        default: [
          `Breathing Room for the ${noun}`,
          `A Soft Spine in Storms`,
          `Walking Toward the Quiet ${noun2}`,
          `Where ${noun}s Learn to Rest`,
          `Holding Yourself with Gentle Hands`,
          `Turning Toward the ${noun2}`
        ],
        emotion: [
          `Listening Beneath the Waves`,
          `Tides That Teach ${noun2}`,
          `The Weather Inside Learns Sunlight`
        ],
        boundary: [
          `Fences Made of Light`,
          `A Gate You Hold from Love`,
          `Rooms with Open Windows`
        ],
        trust: [
          `Bridges Built Slowly`,
          `Open Hands, Open Door`,
          `A Yes You Can Believe`
        ]
      }
      const key = /(emotion|overwhelm|feeling)/i.test(mainFocus)
        ? 'emotion'
        : /(boundary|boundaries)/i.test(mainFocus)
        ? 'boundary'
        : /(trust|connect|intimacy|relationship)/i.test(mainFocus)
        ? 'trust'
        : 'default'
      const choices = pools[key]
      const picked = choices[hashString(mainFocus + theme) % choices.length]
      return picked
    }
    const mainFocus = parseMainFocus(dailyContent)
    const theme = deriveTheme(mainFocus)
    const poeticTitle = derivePoeticTitle(mainFocus, theme)
    
    console.log(`Generated content for day ${dayNumber}:`, dailyContent)
    console.log(`Content length:`, dailyContent.length)
    console.log(`Content preview:`, dailyContent.substring(0, 200))

    // Save the daily content to the user's safety data
    const currentSafety = user.safety || {}
    const currentDailyContent = (user.safety as { dailyContent?: Record<string, unknown> })?.dailyContent || {}
    
    const updatedSafety = {
      ...currentSafety,
      dailyContent: {
        ...currentDailyContent,
        [dayNumber]: {
          content: dailyContent,
          theme,
          poeticTitle,
          timestamp: new Date().toISOString()
        }
      }
    }

    await db.update(users)
      .set({ safety: updatedSafety })
      .where(eq(users.id, userId))

    return NextResponse.json({
      dayNumber: dayNumber,
      content: dailyContent,
      theme,
      poeticTitle,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating daily content:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily content' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dayNumber = parseInt(searchParams.get('day') || '1')

    if (dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // Get user data to check if daily content exists
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userData[0]
    const dailyContentData = (user.safety as { dailyContent?: Record<string, { content: string; theme?: string; poeticTitle?: string; timestamp?: string }> })?.dailyContent?.[dayNumber]

    if (!dailyContentData) {
      return NextResponse.json({ error: 'Daily content not found' }, { status: 404 })
    }

    return NextResponse.json({
      dayNumber: dayNumber,
      content: dailyContentData.content,
      theme: dailyContentData.theme,
      poeticTitle: dailyContentData.poeticTitle,
      timestamp: dailyContentData.timestamp
    })

  } catch (error) {
    console.error('Error retrieving daily content:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve daily content' },
      { status: 500 }
    )
  }
}
