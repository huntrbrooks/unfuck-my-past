interface UserContext {
  preferences?: {
    tone?: string;
    learningStyle?: string;
    persona?: string;
    relationshipStyle?: string;
    engagement?: string;
    depth?: string;
  };
  diagnostic?: {
    themes?: string[];
    insights?: string[];
    responses?: any[];
  };
  moods?: Array<{ date: string; mood: number; notes?: string }>;
  journals?: {
    insights?: string[];
    entries?: any[];
  };
  fullReport?: {
    keyInsights?: string[];
    summary?: string;
  };
  previousDay?: {
    theme?: string;
    activity?: string;
    content?: any;
  };
  weatherData?: {
    insight?: {
      weatherSummary?: string;
      activityRecommendations?: string;
      environmentalAdaptations?: string;
      seasonalPractices?: string;
    };
  };
}

export function buildStructuredPrompt(
  ctx: UserContext,
  dayNumber: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): string {
  const { preferences, diagnostic, moods, journals, fullReport, previousDay, weatherData } = ctx;

  // Hard constraints for structured output
  const RULES = `
FORMAT REQUIREMENTS:
- Output ONLY JSON matching the DayPlan schema (no markdown, no prose, no explanations)
- Use kebab-case ids for every step (e.g., "morning-intention", "breath-work")
- "dayHeading" must be <= 20 characters, poetic and engaging
- "theme" must be <= 3 words maximum (regex enforced)
- "difficulty" must be exactly one of: easy | medium | hard
- Sleep & Wellness must have EXACTLY 5 checkable steps
- Guided Practice should have 1-3 practices, each <= 15 minutes
- All step IDs must be unique within their section

CONTENT REQUIREMENTS:
- Maintain edgy, blunt but supportive brand voice ("unfuck your life", direct, honest)
- Never use "diagnostic", "diagnose", "therapy", or medical language
- Journaling prompt = single sentence in quotes
- Reflection = 2-5 short bullets (< 14 words each)
- Avoid repeating yesterday's exact steps; maintain thematic continuity
- Make content actionable and specific to healing trauma/past issues
- Difficulty level should influence complexity and time commitment
- Use language like "your shit", "mess", "baggage" appropriately when fitting
- Focus on practical, real-world healing actions

BRAND VOICE EXAMPLES:
- "Time to unfuck this pattern"
- "Let's dig into what's really going on"
- "Your past doesn't get to run the show anymore"
- "This is where we stop the bullshit and start healing"
`;

  // Compact context blocks with safe fallbacks
  const contextBlocks = [
    `USER PREFERENCES:
Tone: ${preferences?.tone || 'supportive-direct'}
Learning Style: ${preferences?.learningStyle || 'mixed'}
Persona: ${preferences?.persona || 'mentor'}
Relationship Style: ${preferences?.relationshipStyle || 'supportive'}
Engagement: ${preferences?.engagement || 'daily'}
Depth: ${preferences?.depth || 'medium'}`,

    `DIAGNOSTIC INSIGHTS:
Key Themes: ${diagnostic?.themes?.join(', ') || 'emotional processing, self-awareness'}
Core Issues: ${diagnostic?.insights?.slice(0, 3).join('; ') || 'past trauma patterns, emotional regulation'}`,

    `RECENT MOOD TRENDS (last 7 days):
${moods?.slice(-7).map(m => `${m.date}: ${m.mood}/10${m.notes ? ' - ' + m.notes : ''}`).join('\n') || 'Mood data not available'}`,

    `JOURNAL INSIGHTS:
${journals?.insights?.slice(-3).join('\n') || 'No recent journal insights'}`,

    `FULL REPORT KEY INSIGHTS:
${fullReport?.keyInsights?.slice(0, 3).join('\n') || 'Core healing areas identified'}`,

    `YESTERDAY'S PLAN (avoid repetition):
Theme: ${previousDay?.theme || 'N/A'}
Main Activity: ${previousDay?.activity || 'N/A'}
${previousDay?.content ? 'Previous focus: ' + JSON.stringify(previousDay.content).slice(0, 200) + '...' : ''}`,

    `WEATHER CONTEXT:
${weatherData?.insight?.weatherSummary || 'Weather data not available'}
Activity Recommendations: ${weatherData?.insight?.activityRecommendations || 'Indoor/outdoor activities as appropriate'}
Environmental Adaptations: ${weatherData?.insight?.environmentalAdaptations || 'Adapt to current conditions'}`
  ].join('\n\n');

  const taskPrompt = `
TASK: Generate Day ${dayNumber} of a 30-day "Unfuck Your Life" healing program.

DIFFICULTY LEVEL: ${difficulty}
- easy: Gentle introduction, shorter practices, basic concepts (5-10 min activities)
- medium: Moderate challenge, standard practices, deeper exploration (10-20 min activities)
- hard: Intensive work, longer practices, complex emotional processing (20+ min activities)

PROGRESSION NOTES:
- This is day ${dayNumber} of 30, so content should reflect appropriate depth/complexity
- Build on previous work while introducing new elements
- Maintain momentum without overwhelming the user
- Focus on practical, actionable steps for healing past trauma/issues
- Each section should work together cohesively
- Make sure all guided practice steps are clearly actionable
- Ensure sleep wellness steps are specific bedtime routine actions

Generate a complete DayPlan JSON object that helps the user progress one step further on their healing journey.
`;

  return `${RULES}\n\nCONTEXT:\n${contextBlocks}\n\n${taskPrompt}`;
}
