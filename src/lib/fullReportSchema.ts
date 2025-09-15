import { z } from 'zod'

const Evidence = z.object({
  questionId: z.string(),
  quote: z.string().min(6).max(140)
})

const Subscale = z.object({
  selfCriticism: z.number().int().min(1).max(10),
  avoidance: z.number().int().min(1).max(10),
  anxiety: z.number().int().min(1).max(10),
  externalPressures: z.number().int().min(1).max(10)
})

const Strength = z.object({
  name: z.string().min(2),
  whyItMatters: z.string().min(10),
  howToApply: z.string().min(10),
  evidence: Evidence.optional()
})

const Loop = z.object({
  name: z.string(),
  trigger: z.string(),
  cycle: z.string(),
  impact: z.string(),
  breakPoint: z.string(),
  evidence: Evidence.optional()
})

const RoadStep = z.object({
  stage: z.enum(['immediate', 'shortTerm', 'medium', 'longTerm', 'aspirational']),
  action: z.string().max(140),
  rationale: z.string(),
  successMarker: z.string()
})

const Rec = z.object({
  action: z.string(),
  whyItWorks: z.string(),
  habitStack: z.string(),
  durationMin: z.number().min(1).max(30),
  tags: z.array(z.enum(['Anxiety', 'Clarity', 'Sleep', 'Energy', 'Relationships'])).min(1)
})

export const FullReportSchema = z.object({
  executiveSummary: z.string().min(300).max(700),
  traumaAnalysis: z.object({
    rootCauses: z.array(z.string()).min(2).max(4),
    shapedPatterns: z.array(z.string()).min(2).max(3),
    blindSpots: z.array(z.string()).min(1).max(2),
    contradictions: z.array(z.string()).min(1).max(2),
    evidence: z.array(Evidence).min(2)
  }),
  scores: z.object({
    resilience: z.number().int().min(1).max(10),
    vulnerability: z.number().int().min(1).max(10),
    selfAwareness: z.number().int().min(1).max(10),
    boundaries: z.number().int().min(1).max(10),
    emotionalRegulation: z.number().int().min(1).max(10),
    growthOrientation: z.number().int().min(1).max(10)
  }),
  toxicity: z.object({
    overall: z.number().int().min(1).max(10),
    subscales: Subscale,
    confidence: z.enum(['low', 'medium', 'high']),
    justification: z.string().min(20).max(260)
  }),
  strengths: z.array(Strength).min(3).max(5),
  coreBlocker: z.object({
    label: z.string().max(40),
    impactNow: z.string(),
    firstStep: z.string().max(140),
    evidence: Evidence.optional()
  }),
  behavioralPatterns: z.array(Loop).min(1).max(2),
  roadmap: z.array(RoadStep).length(5),
  recommendations: z.array(Rec).min(5).max(7),
  colorProfile: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    story: z.string()
  }),
  mostTellingQuote: z.object({
    questionId: z.string(),
    quote: z.string().min(6).max(180)
  }),
  resources: z.array(z.object({
    type: z.enum(['app', 'book', 'article', 'podcast', 'service', 'crisis']),
    name: z.string(),
    note: z.string().optional()
  })).min(3),
  nextSteps: z.array(z.string()).min(3).optional(),
  personalization: z.object({
    tone: z.string(),
    rawness: z.string(),
    minutesPerDay: z.number(),
    learningStyle: z.string(),
    primaryFocus: z.string()
  }),
  meta: z.object({
    quotesUsed: z.number().int().min(2),
    missingData: z.array(z.string()).default([]),
    createdAtISO: z.string()
  })
})

export type FullReport = z.infer<typeof FullReportSchema>



