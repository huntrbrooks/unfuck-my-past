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

interface DiagnosticContext {
  responses: DiagnosticResponse[];
  preferences: UserPreferences;
  responseCount?: number;
}

export function buildStructuredDiagnosticPrompt(ctx: DiagnosticContext): string {
  const { responses, preferences, responseCount } = ctx;

  // Hard constraints for structured output
  const RULES = `
FORMAT REQUIREMENTS:
- Output ONLY JSON matching the DiagnosticReport schema (no markdown, no prose, no explanations)
- Use the "Unfuck Your Past" brand voice: direct, honest, supportive but not clinical
- Avoid medical/therapy language - use "patterns", "issues", "healing", "baggage", "your shit"
- Be specific and actionable in all recommendations
- Toxicity scores should be realistic (most people 4-7 range, extreme cases 8-10)
- Focus on empowerment and practical next steps
- Make all content personalized to their specific responses and preferences

CONTENT REQUIREMENTS:
- Executive Summary: Comprehensive overview with 3-5 key findings
- Trauma Analysis: 2-4 primary patterns with severity ratings
- Toxicity Score: Overall score 1-10 with breakdown across 4 areas
- Strengths: 3-6 core strengths with evidence from their responses
- Priorities: 3-5 most important issues ranked by urgency
- Behavioral Patterns: Both destructive (2-4) and adaptive (1-3) patterns
- Healing Roadmap: 3-4 phases with clear milestones
- Recommendations: Immediate (1-2 weeks), short-term (1-3 months), long-term (3-12 months)
- Resources: 3-5 categories with specific tools/resources

BRAND VOICE EXAMPLES:
- "This pattern is keeping you stuck in the same bullshit cycle"
- "Your past doesn't get to run your life anymore"  
- "Time to stop letting this baggage weigh you down"
- "You've got the strength to unfuck this situation"
- "Let's dig into what's really going on here"
- "This shit stops now - here's how"
- "Your trauma doesn't define you, but ignoring it is fucking you over"
`;

  // Build user context
  const userContext = `
USER PREFERENCES:
- Tone: ${preferences.tone || 'supportive-direct'}
- Voice: ${preferences.voice || 'mentor'}
- Rawness Level: ${preferences.rawness || 'moderate'}
- Depth Preference: ${preferences.depth || 'moderate'}
- Learning Style: ${preferences.learning || 'mixed'}
- Engagement Level: ${preferences.engagement || 'active'}
- Experience Level: ${preferences.experience || 'beginner'}
- Goals: ${preferences.goals?.join(', ') || 'healing and growth'}
`;

  // Format diagnostic responses
  const responsesText = responses.map((response, index) => {
    return `
RESPONSE ${index + 1}:
Question: ${response.question}
User's Answer: ${response.response}
Initial Insight: ${response.insight}
---`;
  }).join('\n');

  // Analysis guidelines based on response count
  const analysisGuidelines = `
ANALYSIS GUIDELINES:
- Total responses analyzed: ${responseCount || responses.length}
- Look for patterns across ALL responses, not just individual answers
- Identify recurring themes, emotional patterns, and behavioral tendencies
- Consider what they're NOT saying as much as what they are saying
- Pay attention to language patterns, emotional intensity, and coping mechanisms
- Consider their communication style and emotional availability
- Look for signs of resilience, strength, and existing coping strategies
- Identify both surface-level and deeper underlying issues
- Consider how their preferences should influence the healing approach
`;

  const taskPrompt = `
TASK: Generate a comprehensive diagnostic report based on the user's responses.

This person has completed ${responseCount || responses.length} diagnostic questions and provided thoughtful responses about their past, patterns, and current situation. Your job is to:

1. ANALYZE their responses holistically to identify key trauma patterns, behavioral issues, and strengths
2. ASSESS their current toxicity levels across emotional, behavioral, relationship, and self-worth dimensions  
3. PRIORITIZE the most important issues that need addressing
4. CREATE a personalized healing roadmap with clear phases and milestones
5. PROVIDE specific, actionable recommendations for immediate, short-term, and long-term healing
6. RECOMMEND appropriate resources and support systems

The report should feel like it was written by someone who truly understands their situation and is committed to helping them heal. Be direct about problems but always balance with hope and practical solutions.

Remember: This person is seeking real help and deserves an honest, thorough, and actionable analysis that respects their journey while pushing them toward genuine healing.

Generate a complete DiagnosticReport JSON object that serves as their roadmap to unfucking their past.
`;

  return `${RULES}\n\n${userContext}\n\n${analysisGuidelines}\n\nDIAGNOSTIC RESPONSES:\n${responsesText}\n\n${taskPrompt}`;
}
