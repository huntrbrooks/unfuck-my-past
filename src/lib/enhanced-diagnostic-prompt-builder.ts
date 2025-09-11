interface DiagnosticResponse {
  question: string;
  response: string;
  insight: string;
}

interface UserPreferences {
  tone?: string;
  voice?: string;
  rawness?: string;
  depth?: string;
  learning?: string;
  engagement?: string;
  goals?: string[];
  experience?: string;
}

interface EnhancedOnboardingData {
  tones: string[];
  guideStyles: string[];
  guidanceStrength: "mild"|"moderate"|"intense";
  depth: "surface"|"moderate"|"deep"|"profound";
  primaryFocus: string;
  goals: string[];
  learningStyles: string[];
  engagement: "passive"|"moderate"|"active";
  minutesPerDay: 5|15|30|60;
  attentionSpan: "micro"|"short"|"standard";
  inputMode: "text"|"voice"|"either";
  flags: string[];
  stress0to10: number;
  sleep0to10: number;
  ruminationFreq: string;
  topicsToAvoid: string[];
  triggerWords?: string;
  challenges: string[];
  challengeOther?: string;
  freeform?: string;
}

interface DiagnosticContext {
  responses: DiagnosticResponse[];
  preferences: UserPreferences;
  enhancedOnboarding?: EnhancedOnboardingData;
  responseCount?: number;
  moodHistory?: Array<{ date: string; mood: number; notes?: string }>;
  journalInsights?: string[];
}

export function buildEnhancedDiagnosticPrompt(ctx: DiagnosticContext): string {
  const { responses, preferences, enhancedOnboarding, responseCount, moodHistory, journalInsights } = ctx;

  // Enhanced rules with your specific requirements
  const RULES = `
CRITICAL REQUIREMENTS:
- Output ONLY JSON matching the DiagnosticReport schema (no markdown, no prose, no explanations)
- Use the "Unfuck Your Past" brand voice: direct, honest, supportive but not clinical
- Avoid medical/therapy language - use "patterns", "issues", "healing", "baggage", "your shit"
- ALWAYS tie insights directly to user's own words and responses - quote them when relevant
- Never output vague advice - everything must be specific and measurable
- Enforce tone/rawness from onboarding settings
- Each report must include at least 1 "aha" insight + 1 core blocker + 5-7 actionable steps

LOCKED REPORT STRUCTURE (always in this exact order):

🎯 Executive Summary
- Condensed narrative of key themes, contradictions, and healing opportunities
- Must reference specific user responses and patterns
- Length: 150-600 characters, punchy and insightful

🧠 Trauma Analysis  
- Root causes & emotional triggers (tied to their specific answers)
- How past events shaped current patterns (use their examples)
- Blind spots or unresolved narratives (what they're not seeing/saying)
- Each section: 80-400 characters

📊 Toxicity Score Assessment
- Overall toxicity score (1–10) based on actual response patterns
- Breakdown: self-criticism, avoidance, anxiety, external pressures (1-10 each)
- Confidence rating (Low/Medium/High) based on answer depth and consistency

💪 Strengths to Leverage
- 3-5 strengths with "why it matters" and "how to apply"
- Must be evident from their actual responses, not generic
- Each strength must have practical application

🚨 Core Blocker (Most Important to Address)
- Name it (short, punchy - the ONE thing holding them back most)
- Impact on life now (specific to their situation from responses)
- First step to loosen its grip (actionable, specific, <15 minutes)

🔄 Behavioral Patterns
- 2-3 recurring loops (cause → effect → relapse pattern from their responses)
- Key leverage point where pattern can break (specific moment/trigger)

🛣️ Healing Roadmap (4-6 steps max)
- Progression: Immediate → Short-term → Medium-term → Long-term → Aspirational
- Each step specific to their trauma patterns and preferences

⚡ Actionable Recommendations (Quick Wins)
- 5-7 VERY specific actions (time-bound, measurable, <15 min each)
- Format: "Action (X minutes) - Why it works for your specific pattern"
- No vague advice like "practice mindfulness" - be ultra-specific

📚 Resources & Next Steps
- 2-3 apps/tools (specific to their trauma patterns)
- 2-3 books/articles (matched to their communication style)
- Professional help recommendation with clear reasoning based on severity

PERSONALIZATION RULES:
- Tone adaptation: ${preferences.tone || 'supportive-direct'} 
- Rawness level: ${preferences.rawness || 'moderate'} (gentle vs tough-love)
- Voice style: ${preferences.voice || 'mentor'}
- Depth preference: ${preferences.depth || 'moderate'}
- Always quote user's actual words when making points
- Reference their specific examples and situations
- Adapt language intensity to their rawness preference

BRAND VOICE ADAPTATION:
Gentle/Mild: "This pattern might be holding you back" → "Here's a way to shift this"
Moderate: "This pattern is keeping you stuck" → "Time to break this cycle"  
Raw/Blunt: "This bullshit pattern is fucking you over" → "Stop this shit now - here's how"

QUALITY STANDARDS:
- Accurate = directly reflects user's unique answers (not stock advice)
- Valuable = "aha" insights (naming hidden blockers, loops, contradictions)
- Actionable = specific, time-bound actions linked to why they work
- Personal = uses their words, references their examples
- Progressive = builds from immediate wins to aspirational goals
`;

  // Enhanced user context with deeper personalization
  const userContext = enhancedOnboarding ? `
ENHANCED USER PROFILE:
- Primary Focus: ${enhancedOnboarding.primaryFocus}
- Communication Tones: ${enhancedOnboarding.tones.join(', ')}
- Guide Styles: ${enhancedOnboarding.guideStyles.join(', ')}
- Guidance Strength: ${enhancedOnboarding.guidanceStrength} (adjust language intensity accordingly)
- Depth Preference: ${enhancedOnboarding.depth}
- Learning Styles: ${enhancedOnboarding.learningStyles.join(', ')}
- Engagement Level: ${enhancedOnboarding.engagement}
- Time Available: ${enhancedOnboarding.minutesPerDay} minutes/day
- Attention Span: ${enhancedOnboarding.attentionSpan}
- Input Preference: ${enhancedOnboarding.inputMode}

BASELINE METRICS:
- Stress Level: ${enhancedOnboarding.stress0to10}/10
- Sleep Quality: ${enhancedOnboarding.sleep0to10}/10
- Rumination Frequency: ${enhancedOnboarding.ruminationFreq}

GOALS & CHALLENGES:
- Primary Goals: ${enhancedOnboarding.goals.join(', ')}
- Current Challenges: ${enhancedOnboarding.challenges.join(', ')}
${enhancedOnboarding.challengeOther ? `- Additional Challenge: ${enhancedOnboarding.challengeOther}` : ''}

SAFETY CONSIDERATIONS:
- Special Flags: ${enhancedOnboarding.flags.join(', ') || 'None'}
- Topics to Avoid: ${enhancedOnboarding.topicsToAvoid.join(', ') || 'None'}
${enhancedOnboarding.triggerWords ? `- Trigger Words: ${enhancedOnboarding.triggerWords}` : ''}

${enhancedOnboarding.freeform ? `ADDITIONAL CONTEXT:
${enhancedOnboarding.freeform}` : ''}

RESPONSE ANALYSIS CONTEXT:
- Total responses: ${responseCount || responses.length}
- Response depth: ${responses.length > 5 ? 'High' : responses.length > 2 ? 'Medium' : 'Low'}
- Communication patterns observed: ${analyzeResponsePatterns(responses)}
- Emotional availability: ${assessEmotionalAvailability(responses)}
` : `
BASIC USER PROFILE:
- Communication Style: ${preferences.tone || 'supportive-direct'} tone, ${preferences.voice || 'mentor'} voice
- Rawness Level: ${preferences.rawness || 'moderate'} (adjust language intensity accordingly)
- Depth Preference: ${preferences.depth || 'moderate'} 
- Learning Style: ${preferences.learning || 'mixed'}
- Engagement Level: ${preferences.engagement || 'active'}
- Experience Level: ${preferences.experience || 'beginner'}
- Stated Goals: ${preferences.goals?.join(', ') || 'healing and growth'}

RESPONSE ANALYSIS CONTEXT:
- Total responses: ${responseCount || responses.length}
- Response depth: ${responses.length > 5 ? 'High' : responses.length > 2 ? 'Medium' : 'Low'}
- Communication patterns observed: ${analyzeResponsePatterns(responses)}
- Emotional availability: ${assessEmotionalAvailability(responses)}
`;

  // Enhanced mood and journal context
  const contextualData = `
ADDITIONAL CONTEXT:
${moodHistory && moodHistory.length > 0 ? `
Recent Mood Patterns (last 7 entries):
${moodHistory.slice(-7).map(m => `${m.date}: ${m.mood}/10${m.notes ? ' - ' + m.notes : ''}`).join('\n')}
Mood trend: ${analyzeMoodTrend(moodHistory)}
` : 'No mood data available'}

${journalInsights && journalInsights.length > 0 ? `
Recent Journal Insights:
${journalInsights.slice(-3).join('\n')}
` : 'No journal insights available'}
`;

  // Format diagnostic responses with enhanced analysis
  const responsesAnalysis = responses.map((response, index) => {
    const wordCount = response.response.split(' ').length;
    const emotionalIntensity = assessEmotionalIntensity(response.response);
    
    return `
RESPONSE ${index + 1} ANALYSIS:
Question: ${response.question}
User's Answer: "${response.response}"
Word Count: ${wordCount} (${wordCount > 50 ? 'detailed' : wordCount > 20 ? 'moderate' : 'brief'})
Emotional Intensity: ${emotionalIntensity}
Initial AI Insight: ${response.insight}
Key Themes Detected: ${extractKeyThemes(response.response)}
---`;
  }).join('\n');

  // Enhanced analysis guidelines using rich onboarding data
  const analysisGuidelines = enhancedOnboarding ? `
ENHANCED ANALYSIS REQUIREMENTS:

PRIMARY FOCUS TARGETING:
- Core focus area: ${enhancedOnboarding.primaryFocus}
- Tailor ALL analysis to this primary concern
- Use their specific challenges: ${enhancedOnboarding.challenges.join(', ')}
- Reference their stated goals: ${enhancedOnboarding.goals.join(', ')}

PERSONALIZATION DEPTH:
- Guidance strength: ${enhancedOnboarding.guidanceStrength} (adapt language intensity)
- Depth preference: ${enhancedOnboarding.depth} (adjust analysis depth)
- Communication tones: ${enhancedOnboarding.tones.join(' + ')}
- Guide styles: ${enhancedOnboarding.guideStyles.join(' + ')}
- Use their exact words and phrases when making points
- Reference their specific examples and situations

BASELINE-CALIBRATED SCORING:
- Stress baseline: ${enhancedOnboarding.stress0to10}/10 (calibrate anxiety scores)
- Sleep baseline: ${enhancedOnboarding.sleep0to10}/10 (factor into overall toxicity)
- Rumination frequency: ${enhancedOnboarding.ruminationFreq} (adjust self-criticism scores)
- Use these baselines to provide realistic, personalized toxicity scores

ACTIONABILITY CONSTRAINTS:
- Max action duration: ${enhancedOnboarding.minutesPerDay <= 5 ? '5 minutes' : enhancedOnboarding.minutesPerDay <= 15 ? '10 minutes' : '15 minutes'}
- Attention span: ${enhancedOnboarding.attentionSpan} (adjust complexity accordingly)
- Learning preference: ${enhancedOnboarding.learningStyles[0] || 'text'} (match recommendation format)
- All actions must fit their actual time availability

SAFETY ENFORCEMENT:
- STRICTLY AVOID these topics: ${enhancedOnboarding.topicsToAvoid.join(', ') || 'None specified'}
${enhancedOnboarding.triggerWords ? `- NEVER use these trigger words: ${enhancedOnboarding.triggerWords}` : ''}
- Special considerations for flags: ${enhancedOnboarding.flags.join(', ') || 'None'}
- Adjust analysis intensity based on safety needs

TRAUMA PATTERN DETECTION (Focus-Specific):
${enhancedOnboarding.primaryFocus === 'trauma-processing' ? `
- Look for: dissociation, hypervigilance, emotional numbing, trust issues
- Detect: avoidance patterns, somatic responses, relationship impacts
` : enhancedOnboarding.primaryFocus === 'anxiety' ? `
- Look for: catastrophic thinking, avoidance behaviors, somatic symptoms
- Detect: worry patterns, safety behaviors, control mechanisms
` : enhancedOnboarding.primaryFocus === 'confidence' ? `
- Look for: self-criticism, imposter syndrome, perfectionism
- Detect: comparison patterns, self-sabotage, achievement anxiety
` : enhancedOnboarding.primaryFocus === 'relationships' ? `
- Look for: attachment patterns, boundary issues, communication blocks
- Detect: people-pleasing, conflict avoidance, intimacy fears
` : `
- Look for patterns specific to ${enhancedOnboarding.primaryFocus}
- Detect related behavioral loops and emotional responses
`}

CONFIDENCE SCORING CRITERIA:
- High: Detailed responses + emotional openness + specific examples + consistent with baseline metrics
- Medium: Some detail + moderate openness + general examples + mostly consistent with baselines
- Low: Brief responses + emotional guardedness + vague examples + inconsistent with stated baselines
` : `
BASIC ANALYSIS REQUIREMENTS:

PATTERN RECOGNITION:
- Look for recurring themes across ALL responses (not just individual answers)
- Identify what they're NOT saying (avoidance patterns, emotional gaps)
- Spot contradictions between stated goals and described behaviors
- Notice language patterns that reveal unconscious beliefs
- Detect trauma responses: hypervigilance, people-pleasing, avoidance, freeze responses

PERSONALIZATION DEPTH:
- Weight responses by emotional depth and detail level
- Adapt language to their rawness preference (${preferences.rawness || 'moderate'})
- Use their exact words and phrases when making points
- Reference their specific examples and situations
- Consider their stated communication preferences

ACTIONABILITY ENFORCEMENT:
- Every recommendation must be:
  * Specific: "10-minute walk after dinner" not "exercise more"
  * Time-bound: exact duration specified
  * Low-friction: takes <15 minutes to start
  * Linked to why: "reduces anxiety by..." not just "good for you"
- Core Blocker must be THE primary issue (not a list)
- Quick wins must be immediately actionable today

TRAUMA PATTERN DETECTION:
- Childhood trauma indicators: perfectionism, people-pleasing, hypervigilance
- Relationship trauma: trust issues, attachment patterns, boundary problems  
- Self-worth trauma: inner critic, imposter syndrome, self-sabotage
- Avoidance patterns: procrastination, emotional numbing, isolation
- Hyperindependence: refusing help, control issues, fear of vulnerability

CONFIDENCE SCORING CRITERIA:
- High: Detailed responses, emotional openness, specific examples, consistent patterns
- Medium: Some detail, moderate openness, general examples, some patterns
- Low: Brief responses, emotional guardedness, vague examples, unclear patterns
`;

  const taskPrompt = enhancedOnboarding ? `
TASK: Generate a hyper-personalized diagnostic report using their rich onboarding profile.

PERSON PROFILE:
- Primary focus: ${enhancedOnboarding.primaryFocus}
- Time capacity: ${enhancedOnboarding.minutesPerDay} min/day, ${enhancedOnboarding.attentionSpan} attention span
- Communication preference: ${enhancedOnboarding.tones.join(' + ')} tone, ${enhancedOnboarding.guideStyles.join(' + ')} style
- Guidance intensity: ${enhancedOnboarding.guidanceStrength}
- Baseline stress: ${enhancedOnboarding.stress0to10}/10, sleep: ${enhancedOnboarding.sleep0to10}/10
- Current challenges: ${enhancedOnboarding.challenges.join(', ')}
${enhancedOnboarding.flags.length > 0 ? `- Special flags: ${enhancedOnboarding.flags.join(', ')}` : ''}

YOUR ENHANCED MISSION:
1. IDENTIFY the core pattern blocking their ${enhancedOnboarding.primaryFocus} progress (be laser-specific)
2. NAME their biggest strength from their ${enhancedOnboarding.goals.join('/')} goals they're not leveraging
3. SPOT the behavioral loop keeping them stuck in ${enhancedOnboarding.primaryFocus} struggles
4. PROVIDE the exact first step (max ${enhancedOnboarding.minutesPerDay <= 5 ? '5 minutes' : enhancedOnboarding.minutesPerDay <= 15 ? '10 minutes' : '15 minutes'}) to break their biggest blocker
5. DELIVER 5-7 actions they can do TODAY (all under ${enhancedOnboarding.minutesPerDay <= 5 ? '5 minutes' : '15 minutes'} each)
6. RECOMMEND resources matching their ${enhancedOnboarding.learningStyles[0] || 'text'} learning style

CRITICAL SUCCESS FACTORS:
- At least one "holy shit, that's exactly it" insight about their ${enhancedOnboarding.primaryFocus} struggles
- Core blocker must be THE thing stopping their ${enhancedOnboarding.primaryFocus} progress
- Quick wins must work with ${enhancedOnboarding.attentionSpan} attention span
- Use ${enhancedOnboarding.guidanceStrength} language intensity (gentle/moderate/intense)
- Calibrate toxicity scores against their baselines (stress: ${enhancedOnboarding.stress0to10}, sleep: ${enhancedOnboarding.sleep0to10})
- Respect their safety boundaries: avoid ${enhancedOnboarding.topicsToAvoid.join(', ') || 'no restrictions'}

${enhancedOnboarding.freeform ? `SPECIAL CONTEXT: "${enhancedOnboarding.freeform}"` : ''}

Generate a DiagnosticReport that feels like it was created by someone who spent hours understanding their ${enhancedOnboarding.primaryFocus} journey and knows exactly what they need to move forward.
` : `
TASK: Generate a comprehensive diagnostic report that feels like it was written by someone who truly gets this person.

This individual has completed ${responseCount || responses.length} diagnostic questions with ${responses.length > 3 ? 'thoughtful depth' : 'moderate engagement'}. Their communication style shows ${preferences.tone || 'balanced'} tendencies with a preference for ${preferences.rawness || 'moderate'} directness.

YOUR MISSION:
1. IDENTIFY the core pattern that's fucking up their life (be specific, not generic)
2. NAME their biggest strength they're not leveraging enough
3. SPOT the behavioral loop they're stuck in (cause → effect → relapse)
4. PROVIDE the exact first step to break their biggest blocker
5. DELIVER 5-7 specific actions they can do TODAY (with time requirements)
6. RECOMMEND resources that match their specific trauma patterns

CRITICAL SUCCESS FACTORS:
- At least one "holy shit, that's exactly it" insight that names something they haven't seen
- Core blocker must be THE thing (not multiple things)
- Quick wins must be specific enough that they can start in the next hour
- Use their language patterns and examples throughout
- Adapt rawness to their preference: ${preferences.rawness || 'moderate'}

Remember: This person deserves a report that feels like you actually listened to them and understand their unique situation. Make it personal, make it actionable, make it transformative.

Generate a complete DiagnosticReport JSON object that serves as their personalized roadmap to unfucking their past.
`;

  return `${RULES}\n\n${userContext}\n\n${contextualData}\n\n${analysisGuidelines}\n\nDIAGNOSTIC RESPONSES:\n${responsesAnalysis}\n\n${taskPrompt}`;
}

// Helper functions for enhanced analysis
function analyzeResponsePatterns(responses: DiagnosticResponse[]): string {
  const patterns = [];
  const avgLength = responses.reduce((sum, r) => sum + r.response.split(' ').length, 0) / responses.length;
  
  if (avgLength > 50) patterns.push('detailed communicator');
  else if (avgLength < 15) patterns.push('concise/guarded');
  else patterns.push('balanced');
  
  const emotionalWords = responses.some(r => 
    /feel|emotion|hurt|pain|sad|angry|scared|anxious|overwhelmed/.test(r.response.toLowerCase())
  );
  if (emotionalWords) patterns.push('emotionally aware');
  
  return patterns.join(', ');
}

function assessEmotionalAvailability(responses: DiagnosticResponse[]): string {
  const totalWords = responses.reduce((sum, r) => sum + r.response.split(' ').length, 0);
  const emotionalDepth = responses.filter(r => 
    /feel|emotion|experience|struggle|difficult|challenging/.test(r.response.toLowerCase())
  ).length;
  
  if (totalWords > 200 && emotionalDepth > responses.length * 0.7) return 'High';
  if (totalWords > 100 && emotionalDepth > responses.length * 0.4) return 'Medium';
  return 'Low';
}

function assessEmotionalIntensity(response: string): string {
  const intensityWords = /very|extremely|really|so|completely|totally|absolutely|overwhelming|devastating|terrible/.test(response.toLowerCase());
  const length = response.split(' ').length;
  
  if (intensityWords && length > 30) return 'High';
  if (intensityWords || length > 20) return 'Medium';
  return 'Low';
}

function extractKeyThemes(response: string): string {
  const themes = [];
  const text = response.toLowerCase();
  
  if (/family|parent|mother|father|childhood/.test(text)) themes.push('family/childhood');
  if (/relationship|partner|love|trust/.test(text)) themes.push('relationships');
  if (/work|job|career|boss/.test(text)) themes.push('work/career');
  if (/anxious|anxiety|worry|stress/.test(text)) themes.push('anxiety');
  if (/depressed|sad|empty|lonely/.test(text)) themes.push('depression');
  if (/angry|rage|frustrated|mad/.test(text)) themes.push('anger');
  if (/control|perfect|failure/.test(text)) themes.push('control/perfectionism');
  
  return themes.length > 0 ? themes.join(', ') : 'general emotional processing';
}

function analyzeMoodTrend(moodHistory: Array<{ mood: number; date: string }>): string {
  if (!moodHistory || moodHistory.length < 3) return 'insufficient data';
  
  const recent = moodHistory.slice(-7);
  const avg = recent.reduce((sum, m) => sum + m.mood, 0) / recent.length;
  const trend = recent[recent.length - 1].mood - recent[0].mood;
  
  if (avg < 4) return `low mood (avg: ${avg.toFixed(1)})`;
  if (avg > 7) return `good mood (avg: ${avg.toFixed(1)})`;
  if (trend > 1) return `improving (avg: ${avg.toFixed(1)}, trending up)`;
  if (trend < -1) return `declining (avg: ${avg.toFixed(1)}, trending down)`;
  return `stable (avg: ${avg.toFixed(1)})`;
}
