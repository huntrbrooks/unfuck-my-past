import { z } from "zod";

export const TraumaPattern = z.object({
  pattern: z.string().min(5).max(60),
  description: z.string().min(50).max(300),
  severity: z.enum(["Low", "Moderate", "High", "Severe"])
});

export const Strength = z.object({
  strength: z.string().min(5).max(50),
  whyItMatters: z.string().min(30).max(150),
  howToApply: z.string().min(30).max(200)
});

export const CoreBlocker = z.object({
  name: z.string().min(5).max(40),
  impactOnLife: z.string().min(50).max(250),
  firstStep: z.string().min(30).max(200)
});

export const RecurringLoop = z.object({
  cause: z.string().min(10).max(100),
  effect: z.string().min(10).max(100),
  relapse: z.string().min(10).max(100)
});

export const HealingStep = z.object({
  stepNumber: z.number().int().min(1).max(6),
  phase: z.enum(["Immediate", "Short-term", "Medium-term", "Long-term", "Aspirational"]),
  action: z.string().min(20).max(150),
  timeframe: z.string().min(5).max(30)
});

export const QuickWin = z.object({
  action: z.string().min(20).max(120),
  timeRequired: z.string().min(5).max(20),
  whyItWorks: z.string().min(20).max(150)
});

export const App = z.object({
  name: z.string().min(3).max(40),
  purpose: z.string().min(15).max(100)
});

export const Book = z.object({
  title: z.string().min(5).max(60),
  relevance: z.string().min(15).max(100)
});

export const ProfessionalHelp = z.object({
  recommended: z.boolean(),
  reasoning: z.string().min(30).max(200)
});

export const DiagnosticReport = z.object({
  executiveSummary: z.object({
    title: z.string().default("🎯 Executive Summary"),
    narrative: z.string().min(150).max(600)
  }),

  traumaAnalysis: z.object({
    title: z.string().default("🧠 Trauma Analysis"),
    rootCauses: z.string().min(100).max(400),
    currentPatterns: z.string().min(100).max(400),
    blindSpots: z.string().min(80).max(300)
  }),

  toxicityScore: z.object({
    title: z.string().default("📊 Toxicity Score Assessment"),
    overallScore: z.number().int().min(1).max(10),
    breakdown: z.object({
      selfCriticism: z.number().int().min(1).max(10),
      avoidance: z.number().int().min(1).max(10),
      anxiety: z.number().int().min(1).max(10),
      externalPressures: z.number().int().min(1).max(10)
    }),
    confidenceRating: z.enum(["Low", "Medium", "High"])
  }),

  strengths: z.object({
    title: z.string().default("💪 Strengths to Leverage"),
    strengths: z.array(Strength).min(3).max(5)
  }),

  coreBlocker: z.object({
    title: z.string().default("🚨 Core Blocker (Most Important to Address)"),
    name: z.string().min(5).max(40),
    impactOnLife: z.string().min(50).max(250),
    firstStep: z.string().min(30).max(200)
  }),

  behavioralPatterns: z.object({
    title: z.string().default("🔄 Behavioral Patterns"),
    recurringLoops: z.array(RecurringLoop).min(2).max(3),
    leveragePoint: z.string().min(50).max(300)
  }),

  healingRoadmap: z.object({
    title: z.string().default("🛣️ Healing Roadmap"),
    steps: z.array(HealingStep).min(4).max(6)
  }),

  actionableRecommendations: z.object({
    title: z.string().default("⚡ Actionable Recommendations (Quick Wins)"),
    quickWins: z.array(QuickWin).min(5).max(7)
  }),

  resources: z.object({
    title: z.string().default("📚 Resources & Next Steps"),
    apps: z.array(App).min(2).max(3),
    books: z.array(Book).min(2).max(3),
    professionalHelp: ProfessionalHelp
  })
});

export type DiagnosticReport = z.infer<typeof DiagnosticReport>;
export type TraumaPattern = z.infer<typeof TraumaPattern>;
export type Strength = z.infer<typeof Strength>;
export type CoreBlocker = z.infer<typeof CoreBlocker>;
export type RecurringLoop = z.infer<typeof RecurringLoop>;
export type HealingStep = z.infer<typeof HealingStep>;
export type QuickWin = z.infer<typeof QuickWin>;
export type App = z.infer<typeof App>;
export type Book = z.infer<typeof Book>;
export type ProfessionalHelp = z.infer<typeof ProfessionalHelp>;
