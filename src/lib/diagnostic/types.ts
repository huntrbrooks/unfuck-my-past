export type Depth = "surface" | "moderate" | "deep" | "profound";
export type Engagement = "passive" | "moderate" | "active";
export type PrimaryFocus =
  | "sleep" | "anxiety" | "confidence" | "relationships"
  | "trauma-processing" | "habits/consistency" | "purpose/direction"
  | "money/behavior" | "mood regulation" | "addiction/compulsions";

export type RuminationFreq = "never" | "monthly" | "weekly" | "few times/week" | "daily";

export interface OnboardingPrefs {
  tones: string[];                        // ["gentle","direct",...]
  guideStyles: string[];                  // ["coach","friend",...]
  guidanceStrength: "mild"|"moderate"|"intense";
  depth: Depth;
  primaryFocus: PrimaryFocus;
  goals: string[];
  learningStyles: ("text"|"visual"|"audio"|"interactive")[];
  engagement: Engagement;
  minutesPerDay: 5|15|30|60;
  attentionSpan: "micro"|"short"|"standard";
  inputMode: "text"|"voice"|"either";
  flags: string[];                        // ADHD, PTSD, etc.
  scheduleNote?: string;
  stress0to10: number;
  sleep0to10: number;
  ruminationFreq: RuminationFreq;
  topicsToAvoid: string[];                // ["explicit trauma detail", ...]
  triggerWords?: string;                  // comma separated
  challenges: string[];                   // ["procrastination","stress/anxiety",...]
  challengeOther?: string;
  freeform?: string;
  anonymizedDataOK: boolean;
  exportPromiseShown: boolean;
  // runtime-only
  crisisNow?: boolean;                    // optional soft flag from preferences page
  // optional user preference for question count (respected if set)
  preferredQuestionCount?: number;
}

export type QCategory =
  | "narrative" | "trigger" | "avoidance" | "belief"
  | "body" | "values" | "goal" | "plan";

export interface QuestionTemplate {
  id: string;                 // stable key
  category: QCategory;
  base: string;               // neutral wording
  helper?: string;            // optional subtext
  tags?: string[];            // selection hints
  risk?: "low"|"med"|"high";  // used for ordering
  forbiddenIf?: string[];     // topic keys to avoid
  stock?: boolean;            // marks generic/stock items (cap to max 2)
}

export interface GeneratedQuestion {
  id: string;
  category: QCategory;
  prompt: string;             // tone-adapted, safety-safe text
  helper?: string;
  tags: string[];
  estReadSec: number;         // rough UI hint
}

export interface GeneratorInput {
  onboarding: OnboardingPrefs;
  nowISO?: string;            // used for scheduling hints if needed
}

export interface GeneratorOutput {
  count: number;
  questions: GeneratedQuestion[];
  rationale: string[];        // why we picked these, helpful for debugging
}

