interface DiagnosticResponse {
  question: string
  response: string
  insight: string
  timestamp: string
}

interface UserProfile {
  tone: string
  voice: string
  rawness: string
  depth: string
  learning: string
  engagement: string
  goals: string[]
  experience: string
  timeCommitment: string
}

interface TraumaAvoidanceHierarchy {
  level: number
  category: string
  description: string
  examples: string[]
  avoidancePatterns: string[]
  impact: 'low' | 'moderate' | 'high' | 'severe'
}

interface PersonalityBreakdown {
  primaryTraits: Array<{
    trait: string
    strength: number
    description: string
    positiveAspects: string[]
    challenges: string[]
  }>
  coreBeliefs: string[]
  behavioralPatterns: string[]
  emotionalTendencies: string[]
}

interface StrengthsWeaknesses {
  greatestStrengths: Array<{
    strength: string
    description: string
    evidence: string
    potential: string
  }>
  biggestWeaknesses: Array<{
    weakness: string
    description: string
    impact: string
    growthOpportunity: string
  }>
  hiddenStrengths: string[]
  blindSpots: string[]
}

interface WorldviewAnalysis {
  limitingBeliefs: Array<{
    belief: string
    origin: string
    impact: string
    reframe: string
  }>
  coreValues: string[]
  decisionMakingPatterns: string[]
  relationshipDynamics: string[]
  successBarriers: string[]
}

interface HealingRecommendations {
  primaryTechnique: {
    name: string
    description: string
    whyEffective: string
    implementation: string[]
    expectedOutcomes: string[]
  }
  secondaryTechniques: Array<{
    name: string
    description: string
    whenToUse: string
  }>
  timeline: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  resources: string[]
}

interface ComprehensiveReport {
  freeSummary: {
    keyInsights: string[]
    primaryPatterns: string[]
    immediateRecommendations: string[]
    nextSteps: string[]
  }
  fullReport: {
    traumaAvoidanceHierarchy: TraumaAvoidanceHierarchy[]
    personalityBreakdown: PersonalityBreakdown
    strengthsWeaknesses: StrengthsWeaknesses
    worldviewAnalysis: WorldviewAnalysis
    healingRecommendations: HealingRecommendations
    additionalInsights: {
      growthPotential: string
      riskFactors: string[]
      supportNeeds: string[]
      successFactors: string[]
    }
  }
}

interface DiagnosticReport {
  executiveSummary: string
  traumaAnalysis: {
    identifiedTraumas: string[]
    impactAssessment: string
    copingMechanisms: string[]
  }
  personalityProfile: {
    strengths: string[]
    challenges: string[]
    patterns: string[]
  }
  healingRecommendations: {
    immediateActions: string[]
    longTermStrategies: string[]
    professionalSupport: string[]
  }
  riskAssessment: {
    riskFactors: string[]
    safetyRecommendations: string[]
    crisisResources: string[]
  }
  personalizedInsights: string[]
  nextSteps: string[]
}

interface ReportGenerationRequest {
  diagnosticResponses: Array<{
    question: string
    response: string
    insight: string
  }>
  diagnosticSummary: string
  userPreferences: { tone: string; voice: string; rawness: string; depth: string }
  masterPrompt: string
}

export class DiagnosticReportGenerator {
  private openaiKey: string

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || ''
  }

  async generateComprehensiveReport(
    responses: DiagnosticResponse[],
    userProfile: UserProfile,
    summary: string
  ): Promise<ComprehensiveReport> {
    try {
      // Generate free summary first
      const freeSummary = await this.generateFreeSummary(responses, userProfile)
      
      // Generate full comprehensive report
      const fullReport = await this.generateFullReport(responses, userProfile, summary)
      
      return {
        freeSummary,
        fullReport
      }
    } catch (error) {
      console.error('Error generating comprehensive report:', error)
      return this.getFallbackReport(responses, userProfile)
    }
  }

  private async generateFreeSummary(
    responses: DiagnosticResponse[],
    userProfile: UserProfile
  ): Promise<ComprehensiveReport['freeSummary']> {
    const prompt = `Based on the following diagnostic responses and user profile, generate a brief but insightful free summary that provides value while encouraging the user to purchase the full report.

User Profile: ${JSON.stringify(userProfile)}

Diagnostic Responses:
${responses.map((r, i) => `${i + 1}. ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Generate a free summary with:
1. 3-4 key insights about their patterns and behaviors
2. 2-3 primary patterns you've identified
3. 2-3 immediate recommendations they can act on
4. 2-3 next steps that hint at the value of the full report

Format as JSON with keys: keyInsights, primaryPatterns, immediateRecommendations, nextSteps
Each should be an array of strings.`

    try {
      const response = await this.callOpenAI(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating free summary:', error)
      return this.getFallbackFreeSummary(responses, userProfile)
    }
  }

  private async generateFullReport(
    responses: DiagnosticResponse[],
    userProfile: UserProfile,
    summary: string
  ): Promise<ComprehensiveReport['fullReport']> {
    const prompt = `Based on the following diagnostic responses, user profile, and summary, generate a comprehensive diagnostic report that provides deep insights and actionable recommendations.

User Profile: ${JSON.stringify(userProfile)}
Summary: ${summary}

Diagnostic Responses:
${responses.map((r, i) => `${i + 1}. ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Generate a comprehensive report with the following structure:

1. TRAUMA AVOIDANCE HIERARCHY (5-7 levels):
   - Each level should have: level (number), category (string), description (string), examples (array), avoidancePatterns (array), impact ('low'|'moderate'|'high'|'severe')

2. PERSONALITY BREAKDOWN:
   - primaryTraits: array of {trait, strength (1-10), description, positiveAspects, challenges}
   - coreBeliefs: array of strings
   - behavioralPatterns: array of strings
   - emotionalTendencies: array of strings

3. STRENGTHS & WEAKNESSES:
   - greatestStrengths: array of {strength, description, evidence, potential}
   - biggestWeaknesses: array of {weakness, description, impact, growthOpportunity}
   - hiddenStrengths: array of strings
   - blindSpots: array of strings

4. WORLDVIEW ANALYSIS:
   - limitingBeliefs: array of {belief, origin, impact, reframe}
   - coreValues: array of strings
   - decisionMakingPatterns: array of strings
   - relationshipDynamics: array of strings
   - successBarriers: array of strings

5. HEALING RECOMMENDATIONS:
   - primaryTechnique: {name, description, whyEffective, implementation (array), expectedOutcomes (array)}
   - secondaryTechniques: array of {name, description, whenToUse}
   - timeline: {immediate (array), shortTerm (array), longTerm (array)}
   - resources: array of strings

6. ADDITIONAL INSIGHTS:
   - growthPotential: string
   - riskFactors: array of strings
   - supportNeeds: array of strings
   - successFactors: array of strings

Return as valid JSON matching this exact structure.`

    try {
      const response = await this.callOpenAI(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating full report:', error)
      return this.getFallbackFullReport(responses, userProfile)
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openaiKey) {
      throw new Error('No OpenAI API key available')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private getFallbackReport(responses: DiagnosticResponse[], userProfile: UserProfile): ComprehensiveReport {
    return {
      freeSummary: this.getFallbackFreeSummary(responses, userProfile),
      fullReport: this.getFallbackFullReport(responses, userProfile)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getFallbackFreeSummary(_responses: DiagnosticResponse[], _userProfile: UserProfile): ComprehensiveReport['freeSummary'] {
    return {
      keyInsights: [
        "You show strong self-awareness in your responses",
        "There are clear patterns in how you process challenges",
        "Your communication style reflects your personal growth goals"
      ],
      primaryPatterns: [
        "Consistent approach to problem-solving",
        "Emotional processing patterns"
      ],
      immediateRecommendations: [
        "Practice daily reflection on your responses",
        "Identify one pattern you'd like to change this week"
      ],
      nextSteps: [
        "Unlock your full diagnostic report for deeper insights",
        "Discover your trauma avoidance hierarchy",
        "Get personalized healing recommendations"
      ]
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getFallbackFullReport(_responses: DiagnosticResponse[], _userProfile: UserProfile): ComprehensiveReport['fullReport'] {
    return {
      traumaAvoidanceHierarchy: [
        {
          level: 1,
          category: "Surface Level Avoidance",
          description: "Basic avoidance of uncomfortable situations",
          examples: ["Avoiding difficult conversations", "Procrastinating on challenging tasks"],
          avoidancePatterns: ["Distraction", "Busyness"],
          impact: "moderate"
        }
      ],
      personalityBreakdown: {
        primaryTraits: [
          {
            trait: "Self-Awareness",
            strength: 7,
            description: "Strong ability to reflect on personal experiences",
            positiveAspects: ["Growth-oriented", "Introspective"],
            challenges: ["Over-analysis", "Self-criticism"]
          }
        ],
        coreBeliefs: ["Personal growth is important", "Self-reflection leads to improvement"],
        behavioralPatterns: ["Reflective", "Goal-oriented"],
        emotionalTendencies: ["Thoughtful", "Cautious"]
      },
      strengthsWeaknesses: {
        greatestStrengths: [
          {
            strength: "Self-Reflection",
            description: "Ability to examine personal experiences deeply",
            evidence: "Consistent thoughtful responses",
            potential: "Foundation for significant personal growth"
          }
        ],
        biggestWeaknesses: [
          {
            weakness: "Overthinking",
            description: "Tendency to analyze situations excessively",
            impact: "Can lead to paralysis and missed opportunities",
            growthOpportunity: "Develop action-oriented decision making"
          }
        ],
        hiddenStrengths: ["Resilience", "Empathy"],
        blindSpots: ["Impact on others", "Physical stress signals"]
      },
      worldviewAnalysis: {
        limitingBeliefs: [
          {
            belief: "I need to be perfect to be worthy",
            origin: "Early life experiences",
            impact: "Creates pressure and self-criticism",
            reframe: "Progress and growth are more valuable than perfection"
          }
        ],
        coreValues: ["Growth", "Authenticity", "Connection"],
        decisionMakingPatterns: ["Analytical", "Considerate of others"],
        relationshipDynamics: ["Supportive", "Sometimes overly accommodating"],
        successBarriers: ["Perfectionism", "Fear of failure"]
      },
      healingRecommendations: {
        primaryTechnique: {
          name: "Mindfulness-Based Cognitive Therapy",
          description: "Combines mindfulness practices with cognitive restructuring",
          whyEffective: "Addresses both emotional and thought patterns",
          implementation: ["Daily meditation", "Thought challenging exercises", "Body awareness practices"],
          expectedOutcomes: ["Reduced anxiety", "Improved decision making", "Greater emotional regulation"]
        },
        secondaryTechniques: [
          {
            name: "Journaling",
            description: "Regular written reflection on experiences and emotions",
            whenToUse: "Daily practice and during emotional processing"
          }
        ],
        timeline: {
          immediate: ["Start daily meditation", "Begin thought challenging exercises"],
          shortTerm: ["Develop new coping strategies", "Practice emotional regulation"],
          longTerm: ["Integrate new patterns", "Maintain growth momentum"]
        },
        resources: ["Meditation apps", "Therapy workbooks", "Support groups"]
      },
      additionalInsights: {
        growthPotential: "High potential for significant personal transformation with consistent effort",
        riskFactors: ["Perfectionism", "Isolation", "Burnout"],
        supportNeeds: ["Therapeutic support", "Community connection", "Regular check-ins"],
        successFactors: ["Consistency", "Self-compassion", "Support system"]
      }
    }
  }

  async generateFullDiagnosticReport(request: ReportGenerationRequest): Promise<DiagnosticReport> {
    console.log('Generating full diagnostic report with GPT-4.1...')
    
    const prompt = `
${request.masterPrompt}

You are a trauma-informed therapist creating a comprehensive diagnostic report. Based on the diagnostic responses and summary, generate a detailed, professional report that provides deep insights and actionable recommendations.

DIAGNOSTIC RESPONSES:
${request.diagnosticResponses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

DIAGNOSTIC SUMMARY:
${request.diagnosticSummary}

USER PREFERENCES:
${JSON.stringify(request.userPreferences, null, 2)}

Create a comprehensive diagnostic report in JSON format with the following structure:

{
  "executiveSummary": "Brief overview of key findings and recommendations",
  "traumaAnalysis": {
    "identifiedTraumas": ["trauma1", "trauma2"],
    "impactAssessment": "Detailed analysis of how trauma has affected their life",
    "copingMechanisms": ["mechanism1", "mechanism2"]
  },
  "personalityProfile": {
    "strengths": ["strength1", "strength2"],
    "challenges": ["challenge1", "challenge2"],
    "patterns": ["pattern1", "pattern2"]
  },
  "healingRecommendations": {
    "immediateActions": ["action1", "action2"],
    "longTermStrategies": ["strategy1", "strategy2"],
    "professionalSupport": ["support1", "support2"]
  },
  "riskAssessment": {
    "riskFactors": ["factor1", "factor2"],
    "safetyRecommendations": ["recommendation1", "recommendation2"],
    "crisisResources": ["resource1", "resource2"]
  },
  "personalizedInsights": ["insight1", "insight2"],
  "nextSteps": ["step1", "step2"]
}

The report should be:
- Comprehensive and detailed
- Trauma-informed and sensitive
- Actionable and practical
- Professional yet accessible
- Personalized to their specific situation
- Focused on healing and growth
`

    if (this.openaiKey) {
      try {
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
                role: 'system',
                content: 'You are a trauma-informed therapist creating comprehensive diagnostic reports. Provide detailed, professional, and actionable insights while maintaining sensitivity and safety.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          })
        })

        if (response.ok) {
          const data = await response.json()
          const reportText = data.choices[0].message.content
          
          try {
            const report = JSON.parse(reportText)
            console.log('GPT-4.1 diagnostic report generation successful')
            return report
          } catch {
            console.log('GPT-4.1 report parsing failed')
            throw new Error('Failed to parse diagnostic report')
          }
        } else {
          console.log('GPT-4.1 report generation failed')
          throw new Error('GPT-4.1 request failed')
        }
      } catch (error) {
        console.log('GPT-4.1 error:', error)
        throw error
      }
    }

    throw new Error('OpenAI API key not available for diagnostic report generation')
  }
}
