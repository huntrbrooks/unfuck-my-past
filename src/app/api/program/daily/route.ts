import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, users, diagnosticResponses } from '@/db'
import { ProgramGenerator } from '@/lib/program-generator'
import { eq } from 'drizzle-orm'
import { generateStructuredDayPlan } from '@/lib/structured-ai'
import { buildStructuredPrompt } from '@/lib/structured-prompt-builder'

// Render a legacy text block from a structured DayPlan so current UI can parse it
const renderLegacyContentFromStructuredPlan = (plan: any): string => {
  const lines: string[] = []
  // Main Focus
  if (plan?.mainFocus?.text) {
    lines.push(`🎯 MAIN FOCUS: ${plan.mainFocus.text}`)
    lines.push('')
  }
  // Guided Practice
  if (Array.isArray(plan?.guidedPractice) && plan.guidedPractice.length) {
    lines.push('🌅 GUIDED PRACTICE')
    plan.guidedPractice.forEach((gp: any) => {
      const title = gp?.title || 'Practice'
      const dur = gp?.durationMinutes ? ` (${gp.durationMinutes} minutes)` : ''
      lines.push(`${title}${dur}`)
      if (Array.isArray(gp?.steps)) {
        gp.steps.forEach((s: any, idx: number) => {
          if (s?.text) lines.push(`• ${s.text}`)
        })
      }
    })
    lines.push('')
  }
  // Daily Challenge
  if (plan?.dailyChallenge?.activity) {
    lines.push('⚡ DAILY CHALLENGE')
    const dur = plan.dailyChallenge.durationMinutes ? ` (${plan.dailyChallenge.durationMinutes} minutes)` : ''
    lines.push(`Main Activity${dur}`)
    lines.push(plan.dailyChallenge.activity)
    if (Array.isArray(plan.dailyChallenge.steps) && plan.dailyChallenge.steps.length) {
      lines.push('Step-by-step instructions:')
      plan.dailyChallenge.steps.forEach((s: any, idx: number) => {
        if (s?.text) lines.push(`${idx + 1}. ${s.text}`)
      })
    }
    if (Array.isArray(plan.dailyChallenge.successIndicators) && plan.dailyChallenge.successIndicators.length) {
      lines.push('Success indicators:')
      plan.dailyChallenge.successIndicators.forEach((si: string) => lines.push(`• ${si}`))
    }
    if (plan.dailyChallenge.energyAdaptations) {
      lines.push('Energy Level Adaptations:')
      if (plan.dailyChallenge.energyAdaptations.low) lines.push(`Low: ${plan.dailyChallenge.energyAdaptations.low}`)
      if (plan.dailyChallenge.energyAdaptations.medium) lines.push(`Medium: ${plan.dailyChallenge.energyAdaptations.medium}`)
      if (plan.dailyChallenge.energyAdaptations.high) lines.push(`High: ${plan.dailyChallenge.energyAdaptations.high}`)
    }
    lines.push('')
  }
  // Journaling Prompt
  if (plan?.journalingPrompt?.prompt) {
    lines.push('📝 JOURNALING PROMPT')
    lines.push('Primary Question:')
    lines.push(`"${plan.journalingPrompt.prompt}"`)
    lines.push('')
  }
  // Reflection
  if (Array.isArray(plan?.reflection?.bullets) && plan.reflection.bullets.length) {
    lines.push('🌙 REFLECTION')
    lines.push('Evening Review Questions:')
    plan.reflection.bullets.forEach((b: string) => lines.push(`• ${b}`))
    lines.push('')
  }
  // Weather & Environment
  if (plan?.weatherEnvironment) {
    lines.push('🌤️ WEATHER & ENVIRONMENT')
    if (plan.weatherEnvironment.summary) lines.push(`Summary: ${plan.weatherEnvironment.summary}`)
    if (Array.isArray(plan.weatherEnvironment.cues) && plan.weatherEnvironment.cues.length) {
      lines.push('Cues:')
      plan.weatherEnvironment.cues.forEach((c: string) => lines.push(`• ${c}`))
    }
    lines.push('')
  }
  // Sleep & Wellness
  if (plan?.sleepWellness && Array.isArray(plan.sleepWellness.steps)) {
    lines.push('😴 SLEEP & WELLNESS')
    lines.push('Pre-bedtime Routine:')
    plan.sleepWellness.steps.forEach((s: any, idx: number) => {
      if (s?.text) lines.push(`${idx + 1}. ${s.text}`)
    })
    lines.push('')
  }
  // Holistic Healing Bonus
  if (plan?.holisticHealingBonus) {
    lines.push('🌿 HOLISTIC HEALING BONUS')
    if (plan.holisticHealingBonus.text) {
      lines.push('Optional Practice:')
      lines.push(`• ${plan.holisticHealingBonus.text}`)
    }
    if (Array.isArray(plan.holisticHealingBonus.steps) && plan.holisticHealingBonus.steps.length) {
      plan.holisticHealingBonus.steps.forEach((s: any) => {
        if (s?.text) lines.push(`• ${s.text}`)
      })
    }
  }
  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dayNumber, weatherData, difficulty } = body

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

    // Helper functions for both structured and legacy generation
    const parseMainFocus = (content: string): string => {
      const match = content.match(/🎯\s*MAIN\s*FOCUS:\s*(.+)/)
      if (match && match[1]) return match[1].trim()
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

    // Render a legacy text block from a structured DayPlan so current UI can parse it
    const renderLegacyContentFromStructuredPlan = (plan: any): string => {
      const lines: string[] = []
      // Main Focus
      if (plan?.mainFocus?.text) {
        lines.push(`🎯 MAIN FOCUS: ${plan.mainFocus.text}`)
        lines.push('')
      }
      // Guided Practice
      if (Array.isArray(plan?.guidedPractice) && plan.guidedPractice.length) {
        lines.push('🌅 GUIDED PRACTICE')
        plan.guidedPractice.forEach((gp: any) => {
          const title = gp?.title || 'Practice'
          const dur = gp?.durationMinutes ? ` (${gp.durationMinutes} minutes)` : ''
          lines.push(`${title}${dur}`)
          if (Array.isArray(gp?.steps)) {
            gp.steps.forEach((s: any, idx: number) => {
              if (s?.text) lines.push(`• ${s.text}`)
            })
          }
        })
        lines.push('')
      }
      // Daily Challenge
      if (plan?.dailyChallenge?.activity) {
        lines.push('⚡ DAILY CHALLENGE')
        const dur = plan.dailyChallenge.durationMinutes ? ` (${plan.dailyChallenge.durationMinutes} minutes)` : ''
        lines.push(`Main Activity${dur}`)
        lines.push(plan.dailyChallenge.activity)
        if (Array.isArray(plan.dailyChallenge.steps) && plan.dailyChallenge.steps.length) {
          lines.push('Step-by-step instructions:')
          plan.dailyChallenge.steps.forEach((s: any, idx: number) => {
            if (s?.text) lines.push(`${idx + 1}. ${s.text}`)
          })
        }
        if (Array.isArray(plan.dailyChallenge.successIndicators) && plan.dailyChallenge.successIndicators.length) {
          lines.push('Success indicators:')
          plan.dailyChallenge.successIndicators.forEach((si: string) => lines.push(`• ${si}`))
        }
        if (plan.dailyChallenge.energyAdaptations) {
          lines.push('Energy Level Adaptations:')
          if (plan.dailyChallenge.energyAdaptations.low) lines.push(`Low: ${plan.dailyChallenge.energyAdaptations.low}`)
          if (plan.dailyChallenge.energyAdaptations.medium) lines.push(`Medium: ${plan.dailyChallenge.energyAdaptations.medium}`)
          if (plan.dailyChallenge.energyAdaptations.high) lines.push(`High: ${plan.dailyChallenge.energyAdaptations.high}`)
        }
        lines.push('')
      }
      // Journaling Prompt
      if (plan?.journalingPrompt?.prompt) {
        lines.push('📝 JOURNALING PROMPT')
        lines.push('Primary Question:')
        lines.push(`"${plan.journalingPrompt.prompt}"`)
        lines.push('')
      }
      // Reflection
      if (Array.isArray(plan?.reflection?.bullets) && plan.reflection.bullets.length) {
        lines.push('🌙 REFLECTION')
        lines.push('Evening Review Questions:')
        plan.reflection.bullets.forEach((b: string) => lines.push(`• ${b}`))
        lines.push('')
      }
      // Weather & Environment
      if (plan?.weatherEnvironment) {
        lines.push('🌤️ WEATHER & ENVIRONMENT')
        if (plan.weatherEnvironment.summary) lines.push(`Summary: ${plan.weatherEnvironment.summary}`)
        if (Array.isArray(plan.weatherEnvironment.cues) && plan.weatherEnvironment.cues.length) {
          lines.push('Cues:')
          plan.weatherEnvironment.cues.forEach((c: string) => lines.push(`• ${c}`))
        }
        lines.push('')
      }
      // Sleep & Wellness
      if (plan?.sleepWellness && Array.isArray(plan.sleepWellness.steps)) {
        lines.push('😴 SLEEP & WELLNESS')
        lines.push('Pre-bedtime Routine:')
        plan.sleepWellness.steps.forEach((s: any, idx: number) => {
          if (s?.text) lines.push(`${idx + 1}. ${s.text}`)
        })
        lines.push('')
      }
      // Holistic Healing Bonus
      if (plan?.holisticHealingBonus) {
        lines.push('🌿 HOLISTIC HEALING BONUS')
        if (plan.holisticHealingBonus.text) {
          lines.push('Optional Practice:')
          lines.push(`• ${plan.holisticHealingBonus.text}`)
        }
        if (Array.isArray(plan.holisticHealingBonus.steps) && plan.holisticHealingBonus.steps.length) {
          plan.holisticHealingBonus.steps.forEach((s: any) => {
            if (s?.text) lines.push(`• ${s.text}`)
          })
        }
      }
      return lines.join('\n')
    }

    // Try structured generation first, fall back to current system
    let dayPlan
    let isStructured = false
    
    try {
      console.log('🎯 Attempting structured generation for day', dayNumber)
      
      // Map difficulty from your app's format to schema format
      const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        'easy': 'easy',
        'moderate': 'medium', 
        'challenging': 'hard'
      }
      const schemaDifficulty = difficultyMap[difficulty || 'easy'] || 'medium'

      // Build context for structured generation
      const context = {
        preferences: {
          tone: userPreferences.tone,
          learningStyle: userPreferences.learning,
          persona: userPreferences.voice,
          relationshipStyle: userPreferences.rawness,
          engagement: userPreferences.engagement,
          depth: userPreferences.depth
        },
        diagnostic: {
          themes: transformedResponses.map(r => r.insight).slice(0, 5),
          insights: transformedResponses.map(r => `${r.question}: ${r.response}`).slice(0, 3),
          responses: transformedResponses.slice(0, 5)
        },
        moods: [], // TODO: Add real mood data
        journals: { insights: [] }, // TODO: Add real journal data
        fullReport: { keyInsights: [] }, // TODO: Add real report data
        previousDay: undefined, // TODO: Fetch previous day
        weatherData: weatherData
      }

      const prompt = buildStructuredPrompt(context, dayNumber, schemaDifficulty)
      const structuredPlan = await generateStructuredDayPlan(prompt)

      if (!structuredPlan.dateISO) {
        structuredPlan.dateISO = new Date().toISOString().slice(0, 10)
      }

      const legacyContent = renderLegacyContentFromStructuredPlan(structuredPlan)

      dayPlan = {
        structuredPlan,
        theme: structuredPlan.theme,
        poeticTitle: structuredPlan.dayHeading,
        content: legacyContent,
        isStructured: true
      }
      isStructured = true
      console.log('🎯 Structured generation successful for day', dayNumber)

    } catch (structuredError) {
      console.warn('🎯 Structured generation failed, falling back to text-based:', structuredError)
      
      // Fall back to current system
      const programGenerator = new ProgramGenerator()
      const userPrefsWithDifficulty = { ...userPreferences, difficulty: difficulty || 'easy' }
      const dailyContent = await programGenerator.generateDailyContent(dayNumber, transformedResponses, userPrefsWithDifficulty, weatherData)
      
      // Parse using existing logic
      const mainFocus = parseMainFocus(dailyContent)
      const theme = deriveTheme(mainFocus)
      const poeticTitle = derivePoeticTitle(mainFocus, theme)
      
      dayPlan = {
        content: dailyContent,
        theme,
        poeticTitle,
        isStructured: false
      }
      console.log('🎯 Text-based generation successful for day', dayNumber)
    }

    // Save the daily content to the user's safety data
    const currentSafety = user.safety || {}
    const currentDailyContent = (user.safety as { dailyContent?: Record<string, unknown> })?.dailyContent || {}
    
    if (isStructured) {
      // Save structured plan
      const updatedSafety = {
        ...currentSafety,
        dailyContent: {
          ...currentDailyContent,
          [dayNumber]: {
            structuredPlan: dayPlan.structuredPlan,
            theme: dayPlan.theme,
            poeticTitle: dayPlan.poeticTitle,
            content: dayPlan.content,
            timestamp: new Date().toISOString(),
            isStructured: true
          }
        }
      }
      
      await db.update(users)
        .set({ safety: updatedSafety })
        .where(eq(users.id, userId))

      return NextResponse.json({
        dayNumber: dayNumber,
        structuredPlan: dayPlan.structuredPlan,
        theme: dayPlan.theme,
        poeticTitle: dayPlan.poeticTitle,
        content: dayPlan.content,
        timestamp: new Date().toISOString(),
        isStructured: true
      })
    } else {
      // Save legacy text format
      console.log(`Generated content for day ${dayNumber}:`, dayPlan.content)
      console.log(`Content length:`, dayPlan.content?.length || 0)
      console.log(`Content preview:`, dayPlan.content?.substring(0, 200) || '')
      
      const updatedSafety = {
        ...currentSafety,
        dailyContent: {
          ...currentDailyContent,
          [dayNumber]: {
            content: dayPlan.content,
            theme: dayPlan.theme,
            poeticTitle: dayPlan.poeticTitle,
            timestamp: new Date().toISOString(),
            isStructured: false
          }
        }
      }

      await db.update(users)
        .set({ safety: updatedSafety })
        .where(eq(users.id, userId))

      return NextResponse.json({
        dayNumber: dayNumber,
        content: dayPlan.content,
        theme: dayPlan.theme,
        poeticTitle: dayPlan.poeticTitle,
        timestamp: new Date().toISOString(),
        isStructured: false
      })
    }

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
    const dailyContentData = (user.safety as { dailyContent?: Record<string, { content?: string; structuredPlan?: any; theme?: string; poeticTitle?: string; timestamp?: string; isStructured?: boolean }> })?.dailyContent?.[dayNumber]

    if (!dailyContentData) {
      return NextResponse.json({ error: 'Daily content not found' }, { status: 404 })
    }

    // Return structured or legacy format based on what's stored
    if (dailyContentData.isStructured && dailyContentData.structuredPlan) {
      const content = dailyContentData.content || renderLegacyContentFromStructuredPlan(dailyContentData.structuredPlan)
      return NextResponse.json({
        dayNumber: dayNumber,
        structuredPlan: dailyContentData.structuredPlan,
        theme: dailyContentData.theme,
        poeticTitle: dailyContentData.poeticTitle,
        content,
        timestamp: dailyContentData.timestamp,
        isStructured: true
      })
    } else {
      return NextResponse.json({
        dayNumber: dayNumber,
        content: dailyContentData.content,
        theme: dailyContentData.theme,
        poeticTitle: dailyContentData.poeticTitle,
        timestamp: dailyContentData.timestamp,
        isStructured: false
      })
    }

  } catch (error) {
    console.error('Error retrieving daily content:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve daily content' },
      { status: 500 }
    )
  }
}
