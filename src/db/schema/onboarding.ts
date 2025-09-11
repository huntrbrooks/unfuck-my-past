import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const onboarding = pgTable("onboarding", {
  userId: uuid("user_id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Step 1: Basic Verification
  is18OrOver: boolean("is_18_or_over").notNull(),
  consentToProceed: boolean("consent_to_proceed").notNull(),
  crisisCheck: boolean("crisis_check").notNull(),
  agreeDisclaimer: boolean("agree_disclaimer").notNull(),
  
  // Step 2: Communication Preferences
  tones: jsonb("tones").$type<string[]>().notNull(),     // ["gentle","direct"]
  guideStyles: jsonb("guide_styles").$type<string[]>().notNull(),
  guidanceStrength: text("guidance_strength").notNull(), // mild|moderate|intense
  depth: text("depth").notNull(),                        // surface|moderate|deep|profound
  
  // Step 3: Primary Focus
  primaryFocus: text("primary_focus").notNull(),
  
  // Step 4: Goals & Learning
  goals: jsonb("goals").$type<string[]>().notNull(),
  learningStyles: jsonb("learning_styles").$type<string[]>().notNull(),
  engagement: text("engagement").notNull(),              // passive|moderate|active
  
  // Step 5: Time & Capacity
  minutesPerDay: integer("minutes_per_day").notNull(),   // 5|15|30|60
  attentionSpan: text("attention_span").notNull(),       // micro|short|standard
  inputMode: text("input_mode").notNull(),               // text|voice|either
  
  // Step 6: Flags & Considerations
  flags: jsonb("flags").$type<string[]>().notNull(),     // ["ADHD","PTSD"]
  scheduleNote: text("schedule_note"),
  
  // Step 7: Baseline Metrics
  stress0to10: integer("stress_0_10").notNull(),
  sleep0to10: integer("sleep_0_10").notNull(),
  ruminationFreq: text("rumination_freq").notNull(),     // never..daily
  
  // Step 8: Safety & Boundaries
  topicsToAvoid: jsonb("topics_to_avoid").$type<string[]>().notNull(),
  triggerWords: text("trigger_words"),
  
  // Step 9: Current Challenges
  challenges: jsonb("challenges").$type<string[]>().notNull(),
  challengeOther: text("challenge_other"),
  
  // Step 10: Final Personalization
  freeform: text("freeform"),
  anonymizedDataOK: boolean("anonymized_data_ok").notNull(),
  exportPromiseShown: boolean("export_promise_shown").notNull(),
});

export type Onboarding = {
  userId: string;
  is18OrOver: boolean;
  consentToProceed: boolean;
  crisisCheck: boolean;
  agreeDisclaimer: boolean;
  tones: string[];
  guideStyles: string[];
  guidanceStrength: "mild"|"moderate"|"intense";
  depth: "surface"|"moderate"|"deep"|"profound";
  primaryFocus: "sleep"|"anxiety"|"confidence"|"relationships"|"trauma-processing"|"habits/consistency"|"purpose/direction"|"money/behavior"|"mood regulation"|"addiction/compulsions";
  goals: string[];
  learningStyles: ("text"|"visual"|"audio"|"interactive")[];
  engagement: "passive"|"moderate"|"active";
  minutesPerDay: 5|15|30|60;
  attentionSpan: "micro"|"short"|"standard";
  inputMode: "text"|"voice"|"either";
  flags: string[];
  scheduleNote?: string;
  stress0to10: number;
  sleep0to10: number;
  ruminationFreq: "never"|"monthly"|"weekly"|"few times/week"|"daily";
  topicsToAvoid: string[];
  triggerWords?: string;
  challenges: string[];
  challengeOther?: string;
  freeform?: string;
  anonymizedDataOK: boolean;
  exportPromiseShown: boolean;
};
