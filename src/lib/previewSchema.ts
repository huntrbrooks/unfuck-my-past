import { z } from "zod";

export const Insight = z.object({
  whatWeSaw: z.string().min(20).max(500),
  evidenceQuote: z.string().min(6).max(300).optional(), // Make optional since some don't have it
  whyItMatters: z.string().min(12).max(300),
  microAction: z.string().max(200),     // Increased limit
  tags: z.array(z.string()).min(1)      // Allow any string tags instead of enum
});

export const PreviewSchema = z.object({
  diagnosticSummary: z.string().min(30).max(420), // 2–3 sentences, no advice
  insights: z.array(Insight).length(3),
  confidence: z.object({
    score: z.number().min(0).max(1),     // AI is generating numeric scores
    missingData: z.array(z.string()).default([])
  }),
  teaser: z.string().min(30).max(300), // Increased limit
  safety: z.union([
    z.string(),              // AI sometimes generates safety as a string
    z.object({               // AI sometimes generates safety as an object
      score: z.number().min(0).max(1).optional(),
      isSafe: z.boolean().optional(),
      notes: z.array(z.string()).default([])
    })
  ]).optional()
});

export type Preview = z.infer<typeof PreviewSchema>;
