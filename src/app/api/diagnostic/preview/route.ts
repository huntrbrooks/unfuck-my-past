import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { PreviewSchema } from "@/lib/previewSchema";
import { mapPreviewLevers } from "@/lib/previewPersonalization";
import { previewUserMsg } from "@/prompts/preview.user";
import { generateLocalPreview } from "@/lib/previewFallback";
import { auth } from '@clerk/nextjs/server';
import { db, users } from '../../../../db';
import { eq } from 'drizzle-orm';
// import { onboarding } from '../../../../db/schema/onboarding';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Preview API called')
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ Preview API: No userId')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('✅ Preview API: User authenticated:', userId)

    const { questions, answers, miniSummaries, crisisNow } = await req.json();
    console.log('📊 Preview API: Request data:', { 
      questionsCount: questions?.length || 0, 
      answersCount: answers?.length || 0,
      crisisNow 
    });

    if (!answers?.length || answers.length < 3) {
      console.log('❌ Preview API: Insufficient answers:', answers?.length || 0)
      return NextResponse.json({ 
        error: `Need at least 3 answers for preview. You currently have ${answers?.length || 0}.` 
      }, { status: 400 });
    }
    
    if (!questions?.length) {
      console.log('❌ Preview API: No questions provided')
      return NextResponse.json({ 
        error: "Questions are required for preview generation." 
      }, { status: 400 });
    }

    // Get user's onboarding data
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userResult[0];
    const safetyData = typeof userData.safety === 'string' ? JSON.parse(userData.safety) : userData.safety;
    console.log('📊 Preview API: Safety data keys:', safetyData ? Object.keys(safetyData) : 'null')

    // Check if we have enhanced onboarding data
    const hasEnhancedOnboarding = safetyData && 
      safetyData.flags && 
      safetyData.primaryFocus && 
      safetyData.baselines;
    console.log('📊 Preview API: Has enhanced onboarding:', hasEnhancedOnboarding)

    let onboardingData;
    
    if (hasEnhancedOnboarding) {
      // Map legacy data to new onboarding format
      onboardingData = {
        userId: userId,
        is18OrOver: true, // Assume true for existing users
        consentToProceed: true,
        crisisCheck: !crisisNow,
        agreeDisclaimer: true,
        tones: safetyData.tones || [userData.tone || 'gentle'],
        guideStyles: safetyData.guideStyles || [userData.voice || 'friend'],
        guidanceStrength: (safetyData.guidanceStrength || userData.rawness || 'moderate') as "mild"|"moderate"|"intense",
        depth: (safetyData.depth || userData.depth || 'moderate') as "surface"|"moderate"|"deep"|"profound",
        primaryFocus: (safetyData.primaryFocus || 'habits/consistency') as "sleep"|"anxiety"|"confidence"|"relationships"|"trauma-processing"|"habits/consistency"|"purpose/direction"|"money/behavior"|"mood regulation"|"addiction/compulsions",
        goals: safetyData.goals || [],
        learningStyles: (safetyData.learningStyles || [userData.learning || 'text']) as ("text"|"visual"|"audio"|"interactive")[],
        engagement: (safetyData.engagement || userData.engagement || 'passive') as "passive"|"moderate"|"active",
        minutesPerDay: (() => {
          const timeCommitment = safetyData.timeCommitment;
          if (timeCommitment === '5min') return 5;
          if (timeCommitment === '15min') return 15;
          if (timeCommitment === '30min') return 30;
          return 15;
        })() as 5|15|30|60,
        attentionSpan: safetyData.attentionSpan || 'standard',
        inputMode: (safetyData.inputMode || 'text') as "text"|"voice"|"either",
        flags: safetyData.flags || [],
        scheduleNote: safetyData.scheduleNote,
        stress0to10: parseInt(safetyData.baselines?.stress) || 5,
        sleep0to10: parseInt(safetyData.baselines?.sleep) || 5,
        ruminationFreq: safetyData.baselines?.rumination || 'weekly',
        topicsToAvoid: safetyData.topicsToAvoid || [],
        triggerWords: safetyData.triggerWords || '',
        challenges: safetyData.challenges || [],
        challengeOther: safetyData.challengeOther,
        freeform: safetyData.freeform,
        anonymizedDataOK: true,
        exportPromiseShown: true
      };
    } else {
      // Fallback to basic preferences
      onboardingData = {
        userId: userId,
        is18OrOver: true,
        consentToProceed: true,
        crisisCheck: !crisisNow,
        agreeDisclaimer: true,
        tones: [userData.tone || 'gentle'],
        guideStyles: [userData.voice || 'friend'],
        guidanceStrength: (userData.rawness || 'moderate') as "mild"|"moderate"|"intense",
        depth: (userData.depth || 'moderate') as "surface"|"moderate"|"deep"|"profound",
        primaryFocus: 'habits/consistency' as "sleep"|"anxiety"|"confidence"|"relationships"|"trauma-processing"|"habits/consistency"|"purpose/direction"|"money/behavior"|"mood regulation"|"addiction/compulsions", // Default
        goals: safetyData?.goals || [],
        learningStyles: [userData.learning || 'text'] as ("text"|"visual"|"audio"|"interactive")[],
        engagement: (userData.engagement || 'passive') as "passive"|"moderate"|"active",
        minutesPerDay: 15, // Default
        attentionSpan: 'standard',
        inputMode: 'text',
        flags: [],
        scheduleNote: '',
        stress0to10: 5,
        sleep0to10: 5,
        ruminationFreq: 'weekly',
        topicsToAvoid: [],
        triggerWords: '',
        challenges: [],
        challengeOther: '',
        freeform: '',
        anonymizedDataOK: true,
        exportPromiseShown: true
      };
    }

    const levers = { ...mapPreviewLevers(onboardingData as any), crisisNow: !!crisisNow };

    // Simple in-memory cache (per server instance) to make preview generation reliable
    // Keyed by a hash of userId + questions + answers; TTL 5 minutes
    const cacheKey = createHash("sha256")
      .update(JSON.stringify({ userId, questions, answers }))
      .digest("hex");
    const now = Date.now();
    const ttlMs = 5 * 60 * 1000;
    const cached = previewCache.get(cacheKey);
    if (cached && now - cached.ts < ttlMs) {
      console.log("🧠 Preview API: Returning cached preview");
      return NextResponse.json(cached.data);
    }

    const system = `You are the Diagnostic Preview Engine for Unfuck Your Past.

OUTPUT: Return valid JSON EXACTLY matching these fields (no extras, no markdown):
{
  "diagnosticSummary": string,              // 2–3 sentences; include EXACTLY ONE user quote (≤20 words)
  "insights": [                             // exactly 3 items
    {
      "whatWeSaw": string,                  // 1–2 sentences in user's phrasing; unique per insight
      "evidenceQuote": string,              // one short direct quote; you may append (Q1) or (Q2) inline
      "whyItMatters": string,               // personal impact (e.g., “keeps all-or-nothing thinking”)
      "microAction": string,                // ≤ minutesCap; habit-stacked; vary types (reflective/physical/relational)
      "tags": string[]                      // first tag is a short Label (e.g., "Discipline vs Compassion"); others are topical (e.g., Anxiety, Sleep)
    }
  ],
  "confidence": {                           // numeric score + specific gaps
    "score": number,                        // 0..1; map 0.0–0.59=LOW, 0.6–0.79=MEDIUM, ≥0.8=HIGH
    "missingData": string[]                 // 1–3 concrete gaps (e.g., “No detail on weekends”, “Sleep patterns unclear”)
  },
  "teaser": string,                         // ONE sentence upsell; tie to primaryFocus; no hype words
  "safety": string|{ "score"?:number, "isSafe"?:boolean, "notes"?: string[] }
}

RULES
- Use levers: tone (gentle|tough-love|clinical|spiritual|neutral), rawness (low|medium|high), depth (light|medium|deep), minutesCap (2|5|10), primaryFocus.
- Diagnostic Summary: Anchor in their words with one quote; frame a contradiction (no advice).
- Insights (3):
  • Each feels unique. At least one highlights a contradiction.
  • evidenceQuote is a single string (≤20 words). If helpful, append the question id as (Q1) style.
  • microAction ≤ minutesCap, habit-stacked, and varied: one reflective (journal), one physical (breath/walk), one relational (message/boundary).
  • Use tags: first tag is a punchy Label; additional tags topical.
- Confidence: set score by answer length/consistency; include 1–3 specific missingData items.
- Teaser: focus-tied intrigue (Trauma Map, Avoidance Hierarchy, Core Blocker, 5-step plan) in ONE sentence.
- Personalization examples:
  • Gentle: “If you’re comfortable…”; Tough-love + high rawness: blunt phrasing (no slurs, minimal profanity only if necessary).
  • Learning styles: text → journal prompt; visual → quick sketch; audio → voice note.
- Safety: if crisisNow=true, soften tone and choose down-regulating microActions.

STYLE
- Plain English. No clichés. No therapy claims.
- Always speak directly to the user in second person ("you", "your").
- Never talk about the user in third person or as if they are not present.
- When referring to yourself, use "I" rather than "we" to maintain a direct one‑to‑one voice.`;
    const userMessage = previewUserMsg({ onboarding: onboardingData, levers, questions, answers, miniSummaries });

    console.log('🤖 Preview API: Calling AI model...')
    let json: unknown | null = null;
    try {
      const raw = await callLLM({ system, messages: [userMessage], temperature: 0.3 });
      console.log('🤖 Preview API: AI response received, length:', raw?.length || 0)
      if (raw && raw.trim().length > 0) {
        try {
          json = JSON.parse(raw);
          console.log('✅ Preview API: JSON parsing successful')
        } catch (parseError) {
          console.error('❌ Preview API: JSON parsing failed, will fall back:', parseError)
        }
      }
    } catch (aiError) {
      console.error('❌ Preview API: AI service error, will fall back:', aiError)
    }

    // Try schema validation if we have JSON
    if (json) {
      const parsed = PreviewSchema.safeParse(json);
      if (parsed.success) {
        console.log('✅ Preview API: Schema validation passed')
        previewCache.set(cacheKey, { data: parsed.data, ts: now });
        // Persist latest successful preview for seamless loads
        try {
          const updatedSafety = {
            ...(safetyData || {}),
            lastStructuredPreview: {
              content: parsed.data,
              timestamp: new Date().toISOString()
            }
          };
          await db.update(users).set({ safety: updatedSafety }).where(eq(users.id, userId));
        } catch (persistErr) {
          console.warn('⚠️ Preview API: Failed to persist preview to user profile', persistErr);
        }
        return NextResponse.json(parsed.data);
      }
      console.error('❌ Preview API: Schema validation failed, will fall back')
    }

    // Local fallback to ensure the UI still gets structured content
    console.log('🛟 Preview API: Using local fallback generator')
    const fallback = generateLocalPreview(questions, answers, {
      tone: (levers as any).tone,
      rawness: (levers as any).rawness,
      depth: (levers as any).depth,
      minutesCap: (levers as any).minutesCap,
      primaryFocus: (levers as any).primaryFocus,
      teaserVariant: (levers as any).teaserVariant,
    });
    previewCache.set(cacheKey, { data: fallback, ts: now });
    // Persist fallback as well so UI has something on next load
    try {
      const updatedSafety = {
        ...(safetyData || {}),
        lastStructuredPreview: {
          content: fallback,
          timestamp: new Date().toISOString()
        }
      };
      await db.update(users).set({ safety: updatedSafety }).where(eq(users.id, userId));
    } catch (persistErr) {
      console.warn('⚠️ Preview API: Failed to persist fallback preview', persistErr);
    }
    return NextResponse.json(fallback);
  } catch (error) {
    console.error('Preview generation error:', error);
    
    // Provide more specific error messages
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('No AI service available')) {
        errorMessage = "AI analysis service is temporarily unavailable. Please try again in a moment.";
        statusCode = 503;
      } else if (error.message.includes('User not found')) {
        errorMessage = "User profile not found. Please complete onboarding first.";
        statusCode = 404;
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = "Please sign in to generate your diagnostic preview.";
        statusCode = 401;
      } else if (error.message.includes('Invalid JSON')) {
        errorMessage = "AI response formatting error. Please try again.";
        statusCode = 502;
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// utils

async function callLLM({ system, messages, temperature }: { system: string; messages: any[]; temperature: number }) {
  // Use the existing AI service pattern
  const openaiKey = process.env.OPENAI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  // Try OpenAI first
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: system },
            ...messages
          ],
          temperature,
          max_tokens: 2000
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('OpenAI error:', error);
    }
  }

  // Fallback to Claude
  if (claudeKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            { role: 'user', content: `${system}\n\n${messages[0].content}` }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0].text;
      }
    } catch (error) {
      console.error('Claude error:', error);
    }
  }

  throw new Error('No AI service available');
}

// Module-level cache (cleared on server restart/redeploy)
const previewCache: Map<string, { data: unknown; ts: number }> = (globalThis as any).__uypPreviewCache || new Map();
// @ts-ignore attach to global for hot-reload friendliness
(globalThis as any).__uypPreviewCache = previewCache;

// Return latest saved preview (fast path for seamless loads)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userResult[0];
    const safetyData = typeof userData.safety === 'string' ? JSON.parse(userData.safety) : userData.safety;
    const last = safetyData?.lastStructuredPreview?.content;
    if (last) {
      return NextResponse.json(last);
    }

    // Return a normal JSON payload to avoid 204 + JSON issues
    return NextResponse.json({ cached: false });
  } catch (error) {
    console.error('GET preview error:', error);
    return NextResponse.json({ error: 'Failed to load cached preview' }, { status: 500 });
  }
}
