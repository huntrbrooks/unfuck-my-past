import { z } from "zod";

export const CheckboxStep = z.object({
  id: z.string().min(2),               // kebab-case, stable for persistence
  text: z.string().min(2),
  defaultChecked: z.boolean().default(false),
});

export const GuidedPractice = z.object({
  id: z.string(),
  title: z.string(),                   // bold in UI
  durationMinutes: z.number().int().positive(), // required now to match schema
  steps: z.array(CheckboxStep).min(1).default([]),
});

export const DayPlan = z.object({
  // Meta
  dateISO: z.string(),
  dayHeading: z.string().max(20),      // poetic <= 20 chars
  theme: z.string().max(32),           // <= 3 words (we'll enforce in prompt)
  difficulty: z.enum(["easy","medium","hard"]),

  // New sections
  mainFocus: z.object({ text: z.string().min(10) }), // one clear sentence
  guidedPractice: z.array(GuidedPractice).min(1).max(3),

  // Existing sections
  dailyChallenge: z.object({
    title: z.string().default("Daily Challenge"),
    activity: z.string(),
    durationMinutes: z.number().int().positive(),
    steps: z.array(CheckboxStep).min(1).max(6),
    successIndicators: z.array(z.string()).min(2).max(4),
    energyAdaptations: z.object({
      low: z.string(),
      medium: z.string(),
      high: z.string(),
    }),
  }),

  journalingPrompt: z.object({
    heading: z.string().default("Journaling Prompt"),
    prompt: z.string(), // single sentence in quotes
  }),

  reflection: z.object({
    bullets: z.array(z.string()).min(2).max(5), // short prompts
  }),

  weatherEnvironment: z.object({
    summary: z.string(),    // required now
    cues: z.array(z.string()).min(1).max(4),
  }),

  sleepWellness: z.object({
    title: z.string().default("Sleep & Wellness"),
    steps: z.array(CheckboxStep).length(5), // exactly 5 tickable steps
    notes: z.string(), // required now
  }),

  holisticHealingBonus: z.object({
    text: z.string(),
    steps: z.array(CheckboxStep).default([]),
  }),
});

export type DayPlan = z.infer<typeof DayPlan>;
export type CheckboxStep = z.infer<typeof CheckboxStep>;
export type GuidedPractice = z.infer<typeof GuidedPractice>;