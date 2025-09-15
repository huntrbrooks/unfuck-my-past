import { FullReportSchema, type FullReport } from '@/lib/fullReportSchema'
import { extractHighSignal } from '@/lib/highSignalExtractor'
import { pickArchetype, colourStory, type SixScores } from '@/lib/persona'
import { formatReportMarkdown } from '@/lib/formatReport'

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

  // Structured full report generator with schema validation and formatter
  async generateStructuredFullReport(
    allResponses: Array<{ question: string; response: string; insight: string; questionId?: string }>,
    userPreferences: { tone: string; voice: string; rawness: string; depth: string; learning?: string; engagement?: string; goals?: string[]; experience?: string; minutesPerDay?: number }
  ): Promise<{ json: FullReport; formatted: string; model: string; timestamp: string }> {
    // Helper: sanitize LLM JSON to meet strict caps and enums before schema parse
    const sanitizeFullReportDraft = (draft: any): any => {
      if (!draft || typeof draft !== 'object') return draft
      const clone = JSON.parse(JSON.stringify(draft))
      // Trim executive summary length
      if (typeof clone.executiveSummary === 'string') {
        clone.executiveSummary = clone.executiveSummary.trim()
        if (clone.executiveSummary.length > 700) clone.executiveSummary = clone.executiveSummary.slice(0, 700).trim()
      }
      // Truncate quotes with caps; coerce questionId to string
      const clampQuote = (q?: string, max: number = 140) => (typeof q === 'string' ? q.trim().slice(0, max) : q)
      if (clone.mostTellingQuote) {
        if (clone.mostTellingQuote.quote) clone.mostTellingQuote.quote = clampQuote(clone.mostTellingQuote.quote, 180)
        if (clone.mostTellingQuote.questionId != null) clone.mostTellingQuote.questionId = String(clone.mostTellingQuote.questionId)
      }
      if (clone.traumaAnalysis?.evidence && Array.isArray(clone.traumaAnalysis.evidence)) {
        clone.traumaAnalysis.evidence = clone.traumaAnalysis.evidence.map((e: any) => ({
          questionId: String(e?.questionId ?? ''),
          quote: clampQuote(e?.quote, 140)
        })).filter((e: any) => e.questionId && e.quote)
      }
      // Scores and toxicity bounds
      const clamp10 = (n: any) => {
        const v = Math.round(Number(n))
        return isFinite(v) ? Math.min(10, Math.max(1, v)) : 5
      }
      if (clone.scores) {
        for (const k of ['resilience','vulnerability','selfAwareness','boundaries','emotionalRegulation','growthOrientation']) {
          if (k in clone.scores) clone.scores[k] = clamp10(clone.scores[k])
        }
      }
      if (clone.toxicity) {
        clone.toxicity.overall = clamp10(clone.toxicity.overall)
        if (clone.toxicity.subscales) {
          for (const k of ['selfCriticism','avoidance','anxiety','externalPressures']) {
            if (k in clone.toxicity.subscales) clone.toxicity.subscales[k] = clamp10(clone.toxicity.subscales[k])
          }
        }
        if (typeof clone.toxicity.justification === 'string' && clone.toxicity.justification.length > 260) {
          clone.toxicity.justification = clone.toxicity.justification.slice(0, 260).trim()
        }
        const conf = String(clone.toxicity.confidence || '').toLowerCase()
        clone.toxicity.confidence = ['low','medium','high'].includes(conf) ? conf : 'medium'
      }
      // Normalize behavioral patterns for downstream visual (prefer arrays)
      if (Array.isArray(clone.behavioralPatterns)) {
        clone.behavioralPatterns = clone.behavioralPatterns.map((l: any) => {
          const toArray = (val: any) => {
            if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean)
            if (typeof val === 'string') return val.split(/\s*(?:→|->|,)\s*/).map((s) => s.trim()).filter(Boolean)
            return []
          }
          const cycleArr = toArray(l?.cycle)
          // Ensure breakPoint mentions a fromState if possible
          let fromState = ''
          const bp = String(l?.breakPoint || '')
          for (const s of cycleArr) { if (bp.toLowerCase().includes(s.toLowerCase())) { fromState = s; break } }
          if (!fromState && cycleArr.length) fromState = cycleArr[Math.floor(cycleArr.length / 2)]
          return {
            name: String(l?.name || 'Behavioral Loop'),
            trigger: String(l?.trigger || 'Trigger'),
            cycle: cycleArr.join(' → '),
            impact: String(l?.impact || ''),
            breakPoint: fromState ? `From ${fromState}: ${bp}` : bp
          }
        }).slice(0, 2)
      }

      // Normalize roadmap stage enums and action caps
      const mapStage = (s: any) => {
        const t = String(s || '').toLowerCase()
        if (t.startsWith('imm')) return 'immediate'
        if (t.startsWith('short')) return 'shortTerm'
        if (t.startsWith('med')) return 'medium'
        if (t.startsWith('long')) return 'longTerm'
        if (t.startsWith('asp')) return 'aspirational'
        return 'shortTerm'
      }
      if (Array.isArray(clone.roadmap)) {
        clone.roadmap = clone.roadmap.map((step: any) => ({
          stage: mapStage(step?.stage),
          action: typeof step?.action === 'string' ? step.action.slice(0, 140) : '',
          rationale: typeof step?.rationale === 'string' ? step.rationale : '',
          successMarker: typeof step?.successMarker === 'string' ? step.successMarker : ''
        })).slice(0, 5)
      }
      // Recommendation tags whitelist + duration bounds
      const tagSet = new Set(['Anxiety','Clarity','Sleep','Energy','Relationships'])
      if (Array.isArray(clone.recommendations)) {
        clone.recommendations = clone.recommendations.map((r: any) => ({
          action: String(r?.action || ''),
          whyItWorks: String(r?.whyItWorks || ''),
          habitStack: String(r?.habitStack || ''),
          durationMin: Math.min(30, Math.max(1, Math.round(Number(r?.durationMin || 10)))),
          tags: Array.isArray(r?.tags) ? r.tags.map((t: any) => String(t)).filter((t: string) => tagSet.has(t)).slice(0, 3) : ['Clarity']
        }))
      }
      // Ensure resources have name and valid type
      const resTypes = new Set(['app','book','article','podcast','service','crisis'])
      if (Array.isArray(clone.resources)) {
        clone.resources = clone.resources
          .map((it: any) => ({
            type: resTypes.has(String(it?.type)) ? String(it.type) : 'article',
            name: String(it?.name || '').trim() || 'Resource',
            note: typeof it?.note === 'string' ? it.note : undefined
          }))
          .filter((it: any) => it.name)
      }
      // Personalization + meta guards
      clone.personalization = clone.personalization || {}
      clone.personalization.tone = String(clone.personalization.tone || 'gentle')
      clone.personalization.rawness = String(clone.personalization.rawness || 'moderate')
      clone.personalization.minutesPerDay = Number(clone.personalization.minutesPerDay || 15)
      clone.personalization.learningStyle = String(clone.personalization.learningStyle || 'text')
      clone.personalization.primaryFocus = String(clone.personalization.primaryFocus || 'boundaries')
      clone.meta = clone.meta || {}
      clone.meta.quotesUsed = Number(clone.meta.quotesUsed || (clone.traumaAnalysis?.evidence?.length || 2))
      clone.meta.missingData = Array.isArray(clone.meta.missingData) ? clone.meta.missingData : []
      clone.meta.createdAtISO = clone.meta.createdAtISO || new Date().toISOString()

      // Ensure at least one podcast recommendation exists
      if (Array.isArray(clone.resources)) {
        const hasPodcast = clone.resources.some((r: any) => String(r?.type) === 'podcast')
        if (!hasPodcast) {
          const focus = String(clone.personalization?.primaryFocus || '').toLowerCase()
          let podcast = { type: 'podcast', name: 'Unlocking Us with Brené Brown', note: 'On self-compassion and boundaries.' }
          if (focus.includes('trauma')) {
            podcast = { type: 'podcast', name: 'The Trauma Therapist Podcast', note: 'Trauma-informed coping strategies and healing stories.' }
          } else if (focus.includes('anxiety') || focus.includes('regulation')) {
            podcast = { type: 'podcast', name: 'The Happiness Lab', note: 'Science-backed tools for mood and thought patterns.' }
          }
          clone.resources.push(podcast)
        }
      }
      return clone
    }
    const systemPrompt = `You are the Full Diagnostic Engine for Unfuck Your Past.
Return ONLY valid JSON matching FullReportSchema. Each section will be rendered as a separate card with neon headings.

CRITICAL SECTION STRUCTURE:
Your output will be formatted into 15 distinct sections with specific color themes:
1. Most Telling Quote (clean quote, no formatting)
2. Executive Summary (lime) - findings overview, NO advice
3. Your Colour (from colorProfile) 
4. Your Six Scores (numeric data for chart)
5. Trauma Analysis (orange) - root causes, patterns, blind spots, contradictions
6. Toxicity Score (pink) - overall score + subscales + justification (rendered as a sidebar "spectacle" with large numeric; keep fields concise)
7. How To Lean Into Your Strengths (cyan) - 3-5 strengths with application (will share a split card with Actionable Recommendations; keep bullets concise)
8. Most Important To Address (purple) - core blocker with evidence
9. Hierarchy of Avoidance (chart data)
10. Behavioral Patterns (blue) - loops with Trigger → Effect → Break Point (UI may generate an image from this; keep loops stable)
11. Healing Roadmap (green) - 5 ordered steps with success markers
12. Actionable Recommendations (red) - 5-7 micro-actions ≤15min (shares split card with Strengths; concise bullet points)
13. Next Steps (orange) - 3-5 concrete actions
14. Resources (teal) - apps, books, articles, podcasts (rendered in a sidebar card, not in the main body)
15. Professional Help (blue) - when to seek help (displayed in a sidebar card for emphasis)

CRITICAL SCHEMA REQUIREMENTS:
- ALL questionId fields must be STRINGS (not numbers)
- ALL quotes must be ≤140 chars for evidence, ≤180 for mostTellingQuote  
- roadmap items MUST have "stage" field: "immediate"|"shortTerm"|"medium"|"longTerm"|"aspirational"
- recommendation tags MUST be: "Anxiety"|"Clarity"|"Sleep"|"Energy"|"Relationships"
-- resources MUST have "name" field for each item
  • Output at least 3 total across Apps / Books / Articles / Podcasts. Keep notes concise (≤60 chars). These will be grouped in a SIDEBAR UI as shown: Apps, Books, Articles, Podcasts.
  • Include at least 1 Podcast matched to the user's journey (trauma‑informed healing, CBT, boundaries, or self‑compassion). Give a short reason in note.
  • Professional Help: return ONE concise, bold‑worthy sentence (no underlines/section dividers). This text will be highlighted in a sidebar card.
- personalization and meta objects are REQUIRED

STRICT OUTPUT RULES:
- executiveSummary: 300–700 chars. NO advice, just findings overview with sufficient detail.
- traumaAnalysis: rootCauses (2–4), shapedPatterns (2–3), blindSpots (1–2), contradictions (1–2), evidence (≥2) as { questionId: "string", quote: "≤140 chars" }.
- scores: six integers 1–10 { resilience, vulnerability, selfAwareness, boundaries, emotionalRegulation, growthOrientation }.
- toxicity: overall (1–10), subscales { selfCriticism, avoidance, anxiety, externalPressures } (1–10), confidence: "low"|"medium"|"high", justification: "20–260 chars".
- strengths: 3–5 items { name, whyItMatters, howToApply }.
- coreBlocker: { label: "≤40 chars", impactNow, firstStep: "≤140 chars" }.
- behavioralPatterns: 1–2 items { name, trigger, cycle, impact, breakPoint }.
- roadmap: EXACTLY 5 steps with { stage: "immediate"|"shortTerm"|"medium"|"longTerm"|"aspirational", action: "≤140 chars", rationale, successMarker }.
- recommendations: 5–7 items { action, whyItWorks, habitStack, durationMin: 1–30, tags: ["Anxiety"|"Clarity"|"Sleep"|"Energy"|"Relationships"] }.
- colorProfile: { primary: "Blue"|"Red"|"Green"|"Yellow"|"Purple"|"Orange", secondary?: string, story }.
- mostTellingQuote: { questionId: "string", quote: "≤180 chars" } - CLEAN quote only, no prefixes or formatting.
- resources: ≥2 items { type: "app"|"book"|"article"|"podcast"|"service"|"crisis", name: "required string", note?: string }.
- nextSteps: OPTIONAL array (3–5 concise actions).
- personalization: { tone: string, rawness: string, minutesPerDay: number, learningStyle: string, primaryFocus: string }.
- meta: { quotesUsed: number, missingData: string[], createdAtISO: "ISO string" }.

15-SECTION GOLD STANDARD:
Your output will be formatted into: Most Telling Quote, Executive Summary, Your Colour, Your Six Scores, Trauma Analysis, Toxicity Score, How To Lean Into Your Strengths, Most Important To Address, Hierarchy of Avoidance, Behavioral Patterns, Healing Roadmap, Actionable Recommendations, Next Steps, Resources, Professional Help.

EXAMPLE STRUCTURE:
{
  "mostTellingQuote": { "questionId": "q1", "quote": "Short quote under 180 chars" },
  "executiveSummary": "Detailed findings overview with sufficient depth explaining patterns, contradictions, and key insights discovered from the diagnostic responses. Should be comprehensive yet concise, providing real value to the user without giving advice.",
  "scores": { "resilience": 7, "vulnerability": 5, "selfAwareness": 6, "boundaries": 4, "emotionalRegulation": 5, "growthOrientation": 6 },
  "colorProfile": { "primary": "Blue", "story": "Description..." },
  "traumaAnalysis": { 
    "rootCauses": ["cause1", "cause2"], 
    "shapedPatterns": ["pattern1"], 
    "blindSpots": ["blindspot1"], 
    "contradictions": ["contradiction1"],
    "evidence": [{ "questionId": "q1", "quote": "Short quote under 140 chars" }]
  },
  "toxicity": { "overall": 6, "subscales": { "selfCriticism": 7, "avoidance": 5, "anxiety": 6, "externalPressures": 5 }, "confidence": "medium", "justification": "Explanation..." },
  "strengths": [{ "name": "Self-awareness", "whyItMatters": "Enables growth", "howToApply": "Notice patterns" }],
  "coreBlocker": { "label": "Perfectionism", "impactNow": "Causes delays", "firstStep": "Start small" },
  "behavioralPatterns": [{ "name": "Avoidance Loop", "trigger": "Stress", "cycle": "Trigger → Avoid → Guilt → Relapse", "impact": "Maintains patterns", "breakPoint": "Pause and breathe" }],
  "roadmap": [
    { "stage": "immediate", "action": "Daily breathing", "rationale": "Builds calm", "successMarker": "7 days" },
    { "stage": "shortTerm", "action": "Weekly check-ins", "rationale": "Track progress", "successMarker": "Monthly review" },
    { "stage": "medium", "action": "Boundary practice", "rationale": "Build skills", "successMarker": "Say no twice" },
    { "stage": "longTerm", "action": "Support network", "rationale": "Maintain gains", "successMarker": "2 connections" },
    { "stage": "aspirational", "action": "Mentor others", "rationale": "Solidify learning", "successMarker": "Help 1 person" }
  ],
  "recommendations": [{ "action": "Morning walk", "whyItWorks": "Boosts mood", "habitStack": "After coffee", "durationMin": 10, "tags": ["Energy"] }],
  "resources": [{ "type": "app", "name": "Headspace" }],
  "nextSteps": ["Step 1", "Step 2"],
  "personalization": { "tone": "gentle", "rawness": "moderate", "minutesPerDay": 15, "learningStyle": "text", "primaryFocus": "boundaries" },
  "meta": { "quotesUsed": 2, "missingData": [], "createdAtISO": "2024-01-01T00:00:00.000Z" }
}

GUIDANCE:
- Use onboarding preferences to adapt tone and style.
- Include ≥2 direct quotes ≤140 chars with STRING questionId references.
- Name ≥1 explicit contradiction in traumaAnalysis.contradictions.
- Behavioral patterns use "Trigger → Behavior → Effect → Relapse → Break Point" format.
- Keep recommendations ≤minutesPerDay duration, varied across domains.
- Ensure resources map cleanly to Apps / Books / Articles / Podcasts, each with a short note for side-card presentation.
- Deduce insights from diagnostic responses; keep trauma‑informed and non‑graphic.`

    const amplifierChecklist = [
      'Name a contradiction',
      'Describe time-course of spikes',
      'Include a somatic cue',
      'Note an avoidance strategy',
      'State the cognitive belief line',
      'Point to a smallest leverage interruption',
      'Cite ≥2 direct quotes with questionId',
      'Provide measurable success markers'
    ]

    const signals = extractHighSignal(allResponses)
    const userPayload = {
      onboarding: userPreferences,
      responses: allResponses,
      evidence: signals,
      checklist: amplifierChecklist
    }

    // Structure wrapper for dream-quality results every time
    const structureWrapper = {
      schema: "FullReportSchema",
      onboarding: {
        tone: userPreferences.tone || "direct+gentle",
        guidanceStrength: "moderate",
        depth: userPreferences.depth || "deep",
        primaryFocus: "relationships-boundaries",
        minutesPerDay: userPreferences.minutesPerDay || 15,
        learningStyles: [userPreferences.learning || "text", "visual"],
        engagement: userPreferences.engagement || "active",
        flags: [],
        stress0to10: 6,
        sleep0to10: 6,
        ruminationFreq: "few times/week"
      },
      questions: allResponses.slice(0, 10).map((r, i) => ({ 
        id: r.questionId || `q${i+1}`, 
        prompt: r.question, 
        answer: r.response 
      })),
      requirements: {
        sections: [
          "Most Telling Quote",
          "Executive Summary", 
          "Your Colour",
          "Your Six Scores",
          "Trauma Analysis",
          "Toxicity Score",
          "How To Lean Into Your Strengths",
          "Most Important To Address",
          "Hierarchy of Avoidance",
          "Behavioral Patterns",
          "Healing Roadmap",
          "Actionable Recommendations",
          "Next Steps",
          "Resources",
          "Professional Help"
        ],
        rules: {
          quotes: "≥2 direct, ≤20 words, always tied to questionId",
          contradictions: "≥1 explicit tension in Trauma Analysis",
          loops: "Use Trigger → Behavior → Effect → Relapse → Break Point format",
          roadmap: "5 steps (immediate → aspirational), each with action + success marker",
          recommendations: "5–7, ≤minutesPerDay, varied (body/thought/relational)",
          scores: "6 subscales with numeric ratings",
          colour: "deterministic mapping from scores",
          tone: "adapt phrasing to onboarding.tone/rawness",
          lengthCaps: {
            executiveSummary: "≤120 words",
            perSection: "≤150 words"
          }
        }
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Using this structure wrapper, produce a FullReport JSON STRICTLY matching the schema. Return ONLY JSON.\n${JSON.stringify({ userPayload, structureWrapper })}` }
    ]

    // Prefer OpenAI with response_format json
    const attemptOpenAI = async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 3500, response_format: { type: 'json_object' } })
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error:', response.status, errorText)
        throw new Error(`OpenAI structured request failed: ${response.status} ${errorText}`)
      }
      const data = await response.json()
      const raw = data.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(raw)
      const sanitized = sanitizeFullReportDraft(parsed)
      let validated: any
      try {
        validated = FullReportSchema.parse(sanitized)
      } catch (schemaError) {
        console.error('Schema validation failed - retrying with repair prompt')
        throw schemaError
      }
      // Fill colour from deterministic mapping if scores exist but colourProfile missing/weak
      if (validated?.scores && (!validated.colorProfile || !validated.colorProfile.primary)) {
        const s: SixScores = {
          resilience: validated.scores.resilience,
          vulnerability: validated.scores.vulnerability,
          selfAwareness: validated.scores.selfAwareness,
          boundaries: validated.scores.boundaries,
          emotionalRegulation: validated.scores.emotionalRegulation,
          growthOrientation: validated.scores.growthOrientation,
        }
        const ranked = pickArchetype(s)
        const primary = ranked[0].colour
        const secondary = ranked[1] && (ranked[0].score - ranked[1].score) / ranked[0].score <= 0.08 ? ranked[1].colour : undefined
        validated = { ...validated, colorProfile: { primary, secondary, story: colourStory(primary) } }
      }
      const formatted = formatReportMarkdown(validated)
      return { json: validated, formatted, model: 'gpt-4o-mini', timestamp: new Date().toISOString() }
    }

    // Check API key availability
    if (!this.openaiKey) {
      console.error('No OpenAI API key available')
      throw new Error('OpenAI API key not configured')
    }

    // Retry logic: try primary, then one repair pass if validation fails
    if (this.openaiKey) {
      try {
        return await attemptOpenAI()
      } catch (e) {
        console.error('First OpenAI attempt failed:', e)
        try {
          const repairMessages = [
            messages[0],
            { role: 'user', content: `If your previous JSON missed fields or types, RETURN A FIXED JSON NOW. Re-emit FullReport JSON strictly: ${JSON.stringify(userPayload)}` }
          ]
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.openaiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: repairMessages, max_tokens: 3500, response_format: { type: 'json_object' } })
          })
          if (!response.ok) throw new Error('OpenAI structured repair failed')
          const data = await response.json()
          const raw = data.choices?.[0]?.message?.content || '{}'
          const parsed = JSON.parse(raw)
          const sanitized = sanitizeFullReportDraft(parsed)
          let validated = FullReportSchema.parse(sanitized)
          if (validated?.scores && (!validated.colorProfile || !validated.colorProfile.primary)) {
            const s: SixScores = {
              resilience: validated.scores.resilience,
              vulnerability: validated.scores.vulnerability,
              selfAwareness: validated.scores.selfAwareness,
              boundaries: validated.scores.boundaries,
              emotionalRegulation: validated.scores.emotionalRegulation,
              growthOrientation: validated.scores.growthOrientation,
            }
            const ranked = pickArchetype(s)
            const primary = ranked[0].colour
            const secondary = ranked[1] && (ranked[0].score - ranked[1].score) / ranked[0].score <= 0.08 ? ranked[1].colour : undefined
            validated = { ...validated, colorProfile: { primary, secondary, story: colourStory(primary) } }
          }
          const formatted = formatReportMarkdown(validated)
          return { json: validated, formatted, model: 'gpt-4o-mini', timestamp: new Date().toISOString() }
        } catch (e2) {
          console.error('Structured OpenAI generation failed after repair:', e2)
        }
      }
    }

    // Fallback to Claude as plain JSON text (no response_format)
    if (this.claudeKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': this.claudeKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-3-opus-20240229', max_tokens: 3500, messages })
        })
        if (!response.ok) throw new Error('Claude structured request failed')
        const data = await response.json()
        const raw = data.content?.[0]?.text || '{}'
        let parsed = JSON.parse(raw)
        const sanitized = sanitizeFullReportDraft(parsed)
        let validated = FullReportSchema.parse(sanitized)
        if (validated?.scores && (!validated.colorProfile || !validated.colorProfile.primary)) {
          const s: SixScores = {
            resilience: validated.scores.resilience,
            vulnerability: validated.scores.vulnerability,
            selfAwareness: validated.scores.selfAwareness,
            boundaries: validated.scores.boundaries,
            emotionalRegulation: validated.scores.emotionalRegulation,
            growthOrientation: validated.scores.growthOrientation,
          }
          const ranked = pickArchetype(s)
          const primary = ranked[0].colour
          const secondary = ranked[1] && (ranked[0].score - ranked[1].score) / ranked[0].score <= 0.08 ? ranked[1].colour : undefined
          validated = { ...validated, colorProfile: { primary, secondary, story: colourStory(primary) } }
        }
        const formatted = formatReportMarkdown(validated)
        return { json: validated, formatted, model: 'claude-3-opus', timestamp: new Date().toISOString() }
      } catch (e) {
        console.warn('Structured Claude generation failed, will fallback to unstructured flow:', e)
      }
    }

    throw new Error('Structured generation unavailable - all AI services failed')
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
    userPreferences: { tone: string; voice: string; rawness: string; depth: string },
    hsi?: { totalTrue: number; category: string; patterns: Record<string, boolean> }
  ): Promise<AIResponse> {
    const hsiBlock = hsi ? `\n\nHidden Struggles Index (HSI):\n- Total True: ${hsi.totalTrue}\n- Category: ${hsi.category}\n- Patterns: ${Object.entries(hsi.patterns).filter(([,v])=>v).map(([k])=>k).join(', ') || 'None'}\n` : ''
    const summaryPrompt = `Based on the following diagnostic responses and insights, provide a SHORT, INTRIGUING summary (maximum 3-4 sentences) that creates curiosity and makes the user desperate to learn more. This is for the FREE version - be compelling but don't give away everything.

User Preferences: ${JSON.stringify(userPreferences)}

Responses and Insights:
${allResponses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}
${hsiBlock}

Create a brief, powerful summary that:
- Hints at deep patterns discovered
- Creates emotional intrigue
- Suggests there's much more valuable insight behind the paywall
- Uses the user's preferred tone and voice
- Speaks directly to the user in second person ("you", "your"); never refer to them in third person (no "the user", "they") and do not address anyone not present
- If you refer to yourself, use "I" (not "we") to keep it one-to-one
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
    userPreferences: { tone: string; voice: string; rawness: string; depth: string },
    hsi?: { totalTrue: number; category: string; patterns: Record<string, boolean> }
  ): Promise<AIResponse> {
    const hsiBlock = hsi ? `\n\nHidden Struggles Index (HSI):\n- Total True: ${hsi.totalTrue}\n- Category: ${hsi.category}\n- Patterns: ${Object.entries(hsi.patterns).filter(([,v])=>v).map(([k])=>k).join(', ') || 'None'}\n` : ''
    const insightsPrompt = `Based on the following diagnostic responses, generate 3-4 powerful, specific key insights that will intrigue the user and make them want to learn more. Each insight should be 1-2 sentences maximum.

User Preferences: ${JSON.stringify(userPreferences)}

Responses and Insights:
${allResponses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}
${hsiBlock}

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

Please provide a comprehensive report with the following sections. IMPORTANT FORMAT RULES:
• Do NOT use markdown syntax (no ##, ###, or -)
• Use plain text section headers EXACTLY as shown below, each followed by an underline made of = characters on the next line, matching the header length
• Use • for bullet points (not - or *)
• Each information point must be on its own line
• The healing roadmap must be a clear numbered flow chart like: 1) Step → 2) Step → 3) Step
• Use their preferred tone and voice throughout
• Be comprehensive, insightful, and provide real value
• Avoid emojis in headers; you may use them sparingly in body text if it enhances clarity

EXECUTIVE SUMMARY
Provide a powerful overview of key findings and what this means for their healing journey.

TRAUMA ANALYSIS
Deep dive into trauma patterns, triggers, and psychological impacts.

TOXICITY SCORE & CONFIDENCE
Rate their current toxicity level out of 10, add confidence rating, and explain what this means.

HOW TO LEAN INTO YOUR STRENGTHS
Identify 2-3 key strengths and provide a short paragraph on how to leverage each strength to overcome triggers and self-destructive behaviors.

MOST IMPORTANT TO ADDRESS
A clear call-to-action identifying their most pressing issue and immediate steps to start working on it now.

BEHAVIORAL PATTERNS
Analysis of recurring patterns and their root causes.

HEALING ROADMAP
Step-by-step guidance for their healing journey. Format this as a numbered flow chart: 1) ... → 2) ... → 3) ...

ACTIONABLE RECOMMENDATIONS
Specific, practical steps they can take immediately, with estimated times in parentheses.

RESOURCES AND NEXT STEPS
Additional resources and guidance for continued growth (apps/tools, books/articles, professional help).

Ensure the content strictly follows the format rules above. Return only the report content, no surrounding commentary.`

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
