import { z } from "zod";

export const PrefsSchema = z.object({
  tones: z.array(z.string()).min(1),
  guideStyles: z.array(z.string()).min(1),
  guidanceStrength: z.enum(["mild","moderate","intense"]),
  depth: z.enum(["surface","moderate","deep","profound"]),
  primaryFocus: z.enum(["sleep","anxiety","confidence","relationships","trauma-processing","habits/consistency","purpose/direction","money/behavior","mood regulation","addiction/compulsions"]),
  goals: z.array(z.string()).min(1),
  learningStyles: z.array(z.enum(["text","visual","audio","interactive"])).min(1),
  engagement: z.enum(["passive","moderate","active"]),
  minutesPerDay: z.union([z.literal(5),z.literal(15),z.literal(30),z.literal(60)]),
  attentionSpan: z.enum(["micro","short","standard"]),
  inputMode: z.enum(["text","voice","either"]),
  flags: z.array(z.string()).default([]),
  scheduleNote: z.string().max(120).optional(),
  stress0to10: z.number().min(0).max(10),
  sleep0to10: z.number().min(0).max(10),
  ruminationFreq: z.enum(["never","monthly","weekly","few times/week","daily"]),
  topicsToAvoid: z.array(z.string()).default([]),
  triggerWords: z.string().optional(),
  challenges: z.array(z.string()).default([]),
  challengeOther: z.string().optional(),
  freeform: z.string().optional(),
  anonymizedDataOK: z.boolean(),
  exportPromiseShown: z.boolean().default(true),
  crisisNow: z.boolean().default(false),
  applyScope: z.enum(["future-only","retune-program"]).default("future-only"),
  preferredQuestionCount: z.number().int().min(3).max(10).optional()
});

export type PrefsUpdate = z.infer<typeof PrefsSchema>;



