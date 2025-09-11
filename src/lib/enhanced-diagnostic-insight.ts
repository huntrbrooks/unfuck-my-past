interface DiagnosticQuestion {
  id: number | string;
  category?: string;
  question: string;
  followUp?: string;
  options?: string[];
  adaptive?: {
    tone: string[]
    rawness: string[]
    depth: string[]
  };
  aiPrompt?: string;
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

export function generateEnhancedAIPrompt(
  question: DiagnosticQuestion,
  enhancedOnboarding: EnhancedOnboardingData,
  fallbackPreferences?: { tone: string; voice: string; rawness: string; depth: string; learning?: string; goals?: string[] }
): string {
  
  if (enhancedOnboarding) {
    // Use rich onboarding data for hyper-personalized insights
    const safetyGuards = buildSafetyGuards(enhancedOnboarding);
    const communicationStyle = buildCommunicationStyle(enhancedOnboarding);
    const analysisDepth = buildAnalysisDepth(enhancedOnboarding);
    
    return `
You are an expert trauma-informed analyst providing personalized insights for diagnostic responses.

ENHANCED CLIENT PROFILE:
- Primary Focus: ${enhancedOnboarding.primaryFocus}
- Communication Tones: ${enhancedOnboarding.tones.join(' + ')}
- Guide Styles: ${enhancedOnboarding.guideStyles.join(' + ')}
- Guidance Strength: ${enhancedOnboarding.guidanceStrength}
- Exploration Depth: ${enhancedOnboarding.depth}
- Current Goals: ${enhancedOnboarding.goals.join(', ')}
- Active Challenges: ${enhancedOnboarding.challenges.join(', ')}
- Time Capacity: ${enhancedOnboarding.minutesPerDay} min/day
- Attention Span: ${enhancedOnboarding.attentionSpan}

BASELINE CONTEXT:
- Stress Level: ${enhancedOnboarding.stress0to10}/10
- Sleep Quality: ${enhancedOnboarding.sleep0to10}/10  
- Rumination: ${enhancedOnboarding.ruminationFreq}

SAFETY REQUIREMENTS:
${safetyGuards}

QUESTION CONTEXT: ${question.question}
ANALYSIS TASK: ${question.aiPrompt || `Analyze response for patterns related to ${enhancedOnboarding.primaryFocus}`}

PERSONALIZED INSIGHT REQUIREMENTS:
${communicationStyle}
${analysisDepth}

FOCUS-SPECIFIC ANALYSIS:
${buildFocusSpecificGuidelines(enhancedOnboarding.primaryFocus)}

Provide a ${enhancedOnboarding.attentionSpan === 'micro' ? 'concise (1-2 sentences)' : 'brief (2-3 sentences)'} insight that:
1. Directly relates to their ${enhancedOnboarding.primaryFocus} focus
2. Uses ${enhancedOnboarding.guidanceStrength} intensity language
3. References their specific challenges: ${enhancedOnboarding.challenges.join('/')}
4. Matches their communication preference: ${enhancedOnboarding.tones.join(' + ')} tone
5. Offers actionable direction within their ${enhancedOnboarding.minutesPerDay}-minute capacity

${enhancedOnboarding.freeform ? `SPECIAL CONTEXT: "${enhancedOnboarding.freeform}"` : ''}
`;

  } else {
    // Fallback to basic preferences
    const prefs = fallbackPreferences || { tone: 'gentle', voice: 'friend', rawness: 'moderate', depth: 'moderate' };
    
    return `
You are an expert trauma-informed therapist analyzing a client's response to a diagnostic question.

CLIENT PREFERENCES:
- Communication Style: ${prefs.tone}
- Content Intensity: ${prefs.rawness}
- Exploration Depth: ${prefs.depth}
- Learning Style: ${prefs.learning || 'not specified'}
- Goals: ${(prefs.goals || []).join(', ')}

QUESTION: ${question.question}
ANALYSIS TASK: ${question.aiPrompt || "Analyze the user's response for patterns and insights."}

Provide a brief, insightful analysis (2-3 sentences) that:
1. Acknowledges their response with empathy
2. Identifies key patterns or themes
3. Offers a gentle insight or observation
4. Matches their preferred communication style (${prefs.tone})

Keep the tone ${prefs.tone} and depth ${prefs.depth}. Be ${prefs.rawness} but always trauma-informed and supportive.
`;
  }
}

function buildSafetyGuards(onboarding: EnhancedOnboardingData): string {
  const guards = [];
  
  if (onboarding.topicsToAvoid.length > 0) {
    guards.push(`- STRICTLY AVOID these topics: ${onboarding.topicsToAvoid.join(', ')}`);
  }
  
  if (onboarding.triggerWords) {
    guards.push(`- NEVER use these trigger words: ${onboarding.triggerWords}`);
  }
  
  if (onboarding.flags.includes('PTSD')) {
    guards.push('- PTSD consideration: Be extra gentle with trauma-related content');
  }
  
  if (onboarding.flags.includes('ADHD')) {
    guards.push('- ADHD consideration: Keep insights concise and actionable');
  }
  
  return guards.length > 0 ? guards.join('\n') : '- No specific safety restrictions';
}

function buildCommunicationStyle(onboarding: EnhancedOnboardingData): string {
  const intensity = onboarding.guidanceStrength === 'intense' ? 'direct and challenging' :
                   onboarding.guidanceStrength === 'moderate' ? 'balanced and encouraging' :
                   'gentle and supportive';
                   
  const toneStyle = onboarding.tones.includes('direct') ? 'straightforward' :
                    onboarding.tones.includes('coaching') ? 'motivational' :
                    onboarding.tones.includes('gentle') ? 'nurturing' :
                    'balanced';
                    
  const guideStyle = onboarding.guideStyles.includes('mentor') ? 'wise and experienced' :
                     onboarding.guideStyles.includes('friend') ? 'supportive and relatable' :
                     onboarding.guideStyles.includes('coach') ? 'goal-focused and action-oriented' :
                     onboarding.guideStyles.includes('therapist') ? 'professional and therapeutic' :
                     'balanced and supportive';

  return `
COMMUNICATION STYLE:
- Intensity: ${intensity}
- Tone: ${toneStyle}
- Approach: ${guideStyle}
- Language level: Match their ${onboarding.guidanceStrength} preference
`;
}

function buildAnalysisDepth(onboarding: EnhancedOnboardingData): string {
  const depthGuidance = {
    'surface': 'Focus on immediate, observable patterns. Avoid deep psychological analysis.',
    'moderate': 'Explore underlying patterns and connections. Balance insight with accessibility.',
    'deep': 'Dive into root causes and complex patterns. Provide transformative insights.',
    'profound': 'Explore deep psychological patterns and core beliefs. Offer profound realizations.'
  };

  return `
ANALYSIS DEPTH: ${onboarding.depth}
- ${depthGuidance[onboarding.depth]}
- Attention span: ${onboarding.attentionSpan} (adjust complexity accordingly)
`;
}

function buildFocusSpecificGuidelines(primaryFocus: string): string {
  const focusGuidelines: Record<string, string> = {
    'trauma-processing': `
- Look for: avoidance patterns, somatic responses, dissociation indicators
- Identify: trauma responses (fight/flight/freeze/fawn), safety behaviors
- Focus on: building safety, processing capacity, integration opportunities`,

    'anxiety': `
- Look for: catastrophic thinking, avoidance behaviors, control mechanisms
- Identify: worry patterns, safety behaviors, somatic anxiety symptoms
- Focus on: grounding techniques, exposure opportunities, cognitive reframes`,

    'confidence': `
- Look for: self-criticism, imposter syndrome, comparison patterns
- Identify: achievement anxiety, perfectionism, self-sabotage behaviors
- Focus on: strength recognition, success patterns, confidence building`,

    'relationships': `
- Look for: attachment patterns, boundary issues, communication blocks
- Identify: people-pleasing, conflict avoidance, intimacy fears
- Focus on: connection skills, boundary setting, authentic expression`,

    'sleep': `
- Look for: bedtime resistance, rumination patterns, lifestyle factors
- Identify: sleep hygiene issues, anxiety around sleep, schedule inconsistencies
- Focus on: practical sleep improvements, evening routines, stress management`,

    'habits/consistency': `
- Look for: motivation patterns, streak-breaking triggers, all-or-nothing thinking
- Identify: implementation gaps, environmental barriers, accountability needs
- Focus on: sustainable systems, micro-habits, consistency strategies`,

    'purpose/direction': `
- Look for: values confusion, external validation seeking, meaning-making struggles
- Identify: authentic interests, imposed expectations, direction paralysis
- Focus on: values clarification, purpose exploration, aligned action`,

    'mood regulation': `
- Look for: emotional triggers, regulation strategies, mood pattern awareness
- Identify: emotional dysregulation, coping mechanisms, support systems
- Focus on: emotional skills, trigger management, resilience building`
  };

  return focusGuidelines[primaryFocus] || `
- Look for: patterns specific to ${primaryFocus}
- Identify: related behavioral loops and emotional responses
- Focus on: practical improvements and growth opportunities`;
}
