import { describe, expect, it } from 'vitest'
import { FullReportSchema } from '@/lib/fullReportSchema'

// Minimal sample fixture-like object to assert schema expectations
const sample = {
  executiveSummary: 'Sample executive summary with sufficient length to pass validation and no advice.',
  traumaAnalysis: {
    rootCauses: ['Cause A', 'Cause B'],
    shapedPatterns: ['Pattern A', 'Pattern B'],
    blindSpots: ['Blind A'],
    contradictions: ['Wants rest but punishes rest'],
    evidence: [
      { questionId: 'q1', quote: 'I feel tense after work.' },
      { questionId: 'q2', quote: 'I avoid resting because it feels lazy.' }
    ]
  },
  toxicity: {
    overall: 6,
    subscales: { selfCriticism: 6, avoidance: 5, anxiety: 6, externalPressures: 5 },
    confidence: 'medium',
    justification: 'Based on consistency across answers and specificity in examples.'
  },
  strengths: [
    { name: 'Discipline', whyItMatters: 'Helps sustain change', howToApply: 'Use small daily reps' },
    { name: 'Self-awareness', whyItMatters: 'Enables early detection', howToApply: 'Name the trigger' },
    { name: 'Resilience', whyItMatters: 'Bounce back after slips', howToApply: 'Reset next action' }
  ],
  coreBlocker: {
    label: 'Perfectionism Trap',
    impactNow: 'Delays action and increases stress',
    firstStep: 'Write 3 lines celebrating effort',
    evidence: { questionId: 'q3', quote: 'If it is not perfect, I wait.' }
  },
  behavioralPatterns: [
    {
      name: 'Stress loop',
      trigger: 'Late shift',
      cycle: 'Trigger → Tension → Doomscroll → Shame → Relapse',
      impact: 'Poor sleep and delay next day',
      breakPoint: '2-min breathing at first jaw tension'
    }
  ],
  roadmap: [
    { stage: 'immediate', action: '2-min box breathing', rationale: 'Down-regulate arousal', successMarker: 'Heart rate decreases' },
    { stage: 'shortTerm', action: 'Nightly 1-line win log', rationale: 'Reinforce effort', successMarker: '5/7 nights logged' },
    { stage: 'medium', action: 'Plan B routine', rationale: 'Reduce zero days', successMarker: '4 weeks >70% adherence' },
    { stage: 'longTerm', action: 'Monthly debrief', rationale: 'Spot trends', successMarker: '12 entries in 12 months' },
    { stage: 'aspirational', action: 'Mentor a peer', rationale: 'Identity shift', successMarker: 'One peer supported' }
  ],
  recommendations: [
    { action: 'After brushing teeth, 2-min box breathing', whyItWorks: 'Reduces arousal', habitStack: 'After brushing', durationMin: 2, tags: ['Anxiety'] },
    { action: '10-min walk post-work', whyItWorks: 'State change', habitStack: 'After parking', durationMin: 10, tags: ['Energy'] },
    { action: 'Gratitude 3 lines', whyItWorks: 'Shift attention', habitStack: 'Before bed', durationMin: 3, tags: ['Clarity'] },
    { action: 'Text a friend', whyItWorks: 'Co-regulation', habitStack: 'After dinner', durationMin: 2, tags: ['Relationships'] },
    { action: 'Screens off 30 min before bed', whyItWorks: 'Sleep hygiene', habitStack: '9:30pm alarm', durationMin: 5, tags: ['Sleep'] }
  ],
  resources: [
    { type: 'app', name: 'Calm' },
    { type: 'book', name: 'Atomic Habits' }
  ],
  personalization: { tone: 'gentle', rawness: 'mild', minutesPerDay: 20, learningStyle: 'text', primaryFocus: 'discipline' },
  meta: { quotesUsed: 2, missingData: [], createdAtISO: new Date().toISOString() }
}

describe('FullReportSchema contract', () => {
  it('validates sample structure and depth signals', () => {
    const parsed = FullReportSchema.safeParse(sample)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    const r = parsed.data
    expect(r.traumaAnalysis.contradictions.length).toBeGreaterThan(0)
    expect(r.traumaAnalysis.evidence.length).toBeGreaterThanOrEqual(2)
    expect(r.meta.quotesUsed).toBeGreaterThanOrEqual(2)
    r.recommendations.forEach(rec => expect(rec.durationMin).toBeLessThanOrEqual(r.personalization.minutesPerDay))
  })
})



