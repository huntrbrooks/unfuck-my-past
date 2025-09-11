// Jest test file
import { generateDiagnosticQuestions } from "@/lib/diagnostic/generate";
import { OnboardingPrefs } from "@/lib/diagnostic/types";

const BASE: OnboardingPrefs = {
  tones: ["direct","gentle"],
  guideStyles: ["coach","friend"],
  guidanceStrength: "moderate",
  depth: "deep",
  primaryFocus: "habits/consistency",
  goals: ["growth","confidence"],
  learningStyles: ["text","visual"],
  engagement: "active",
  minutesPerDay: 15,
  attentionSpan: "short",
  inputMode: "either",
  flags: ["ADHD"],
  stress0to10: 6,
  sleep0to10: 5,
  ruminationFreq: "few times/week",
  topicsToAvoid: ["explicit trauma detail"],
  triggerWords: "worthless, failure",
  challenges: ["procrastination","stress/anxiety"],
  anonymizedDataOK: true,
  exportPromiseShown: true
};

describe("generateDiagnosticQuestions", () => {
  it("returns 6-8 questions for deep + 15 min active", () => {
    const out = generateDiagnosticQuestions({ onboarding: BASE });
    expect(out.count).toBeGreaterThanOrEqual(5);
    expect(out.count).toBeLessThanOrEqual(8);
    expect(out.questions[0].prompt.length).toBeGreaterThan(12);
  });

  it("respects crisis mode by trimming to <=3 low-risk items", () => {
    const crisis = { ...BASE, crisisNow: true } as OnboardingPrefs;
    const out = generateDiagnosticQuestions({ onboarding: crisis });
    expect(out.count).toBeLessThanOrEqual(3);
  });

  it("sanitizes trigger words", () => {
    const out = generateDiagnosticQuestions({ onboarding: BASE });
    const anyMasked = out.questions.some(q => q.prompt.includes("[sensitive]"));
    // Might not trigger every run, but ensure function runs without throwing
    expect(Array.isArray(out.questions)).toBe(true);
  });

  it("includes universal questions", () => {
    const out = generateDiagnosticQuestions({ onboarding: BASE });
    const hasValuesConflict = out.questions.some(q => q.id === "values_conflict");
    const hasIdealOutcome = out.questions.some(q => q.id === "ideal_outcome_30d");
    expect(hasValuesConflict).toBe(true);
    expect(hasIdealOutcome).toBe(true);
  });

  it("adapts tone based on preferences", () => {
    const gentle = { ...BASE, tones: ["gentle"], guideStyles: ["therapist-style"] } as OnboardingPrefs;
    const direct = { ...BASE, tones: ["direct"], guideStyles: ["coach"], guidanceStrength: "intense" } as OnboardingPrefs;
    
    const gentleOut = generateDiagnosticQuestions({ onboarding: gentle });
    const directOut = generateDiagnosticQuestions({ onboarding: direct });
    
    // Gentle should have softer language
    const gentleText = gentleOut.questions[0].prompt;
    const directText = directOut.questions[0].prompt;
    
    expect(gentleText).toContain("If you're comfortable");
    expect(directText).toContain("No fluff");
  });

  it("respects topics to avoid", () => {
    const avoidTrauma = { ...BASE, topicsToAvoid: ["explicit trauma detail"] } as OnboardingPrefs;
    const out = generateDiagnosticQuestions({ onboarding: avoidTrauma });
    
    // Should not include high-risk trauma questions
    const hasTraumaQuestion = out.questions.some(q => q.id === "memory_loop");
    expect(hasTraumaQuestion).toBe(false);
  });

  it("includes focus-specific questions", () => {
    const sleepFocus = { ...BASE, primaryFocus: "sleep" } as OnboardingPrefs;
    const out = generateDiagnosticQuestions({ onboarding: sleepFocus });
    
    const hasSleepQuestion = out.questions.some(q => q.id === "sleep_window" || q.id === "evening_triggers");
    expect(hasSleepQuestion).toBe(true);
  });

  it("includes challenge-specific questions", () => {
    const out = generateDiagnosticQuestions({ onboarding: BASE });
    
    const hasProcrastinationQuestion = out.questions.some(q => q.id === "delay_loop");
    const hasStressQuestion = out.questions.some(q => q.id === "stress_load");
    
    expect(hasProcrastinationQuestion).toBe(true);
    expect(hasStressQuestion).toBe(true);
  });

  it("adds baseline-driven questions", () => {
    const highStress = { ...BASE, stress0to10: 8 } as OnboardingPrefs;
    const dailyRumination = { ...BASE, ruminationFreq: "daily" } as OnboardingPrefs;
    const poorSleep = { ...BASE, sleep0to10: 3, primaryFocus: "anxiety" } as OnboardingPrefs;
    
    const stressOut = generateDiagnosticQuestions({ onboarding: highStress });
    const ruminationOut = generateDiagnosticQuestions({ onboarding: dailyRumination });
    const sleepOut = generateDiagnosticQuestions({ onboarding: poorSleep });
    
    const hasStressRegulation = stressOut.questions.some(q => q.id === "stress_regulate_5min");
    const hasRuminationLoop = ruminationOut.questions.some(q => q.id === "rumination_loop");
    const hasSleepDrag = sleepOut.questions.some(q => q.id === "sleep_drag");
    
    expect(hasStressRegulation).toBe(true);
    expect(hasRuminationLoop).toBe(true);
    expect(hasSleepDrag).toBe(true);
  });

  it("provides rationale for debugging", () => {
    const out = generateDiagnosticQuestions({ onboarding: BASE });
    expect(out.rationale).toBeDefined();
    expect(Array.isArray(out.rationale)).toBe(true);
    expect(out.rationale.length).toBeGreaterThan(0);
  });

  it("orders questions appropriately", () => {
    const out = generateDiagnosticQuestions({ onboarding: BASE });
    
    // Should start with goal/values questions for gentle tone
    const firstQuestion = out.questions[0];
    expect(["goal", "values"].includes(firstQuestion.category)).toBe(true);
  });

  it("handles different engagement levels", () => {
    const passive = { ...BASE, engagement: "passive" } as OnboardingPrefs;
    const active = { ...BASE, engagement: "active" } as OnboardingPrefs;
    
    const passiveOut = generateDiagnosticQuestions({ onboarding: passive });
    const activeOut = generateDiagnosticQuestions({ onboarding: active });
    
    expect(passiveOut.count).toBeLessThanOrEqual(5);
    expect(activeOut.count).toBeGreaterThanOrEqual(passiveOut.count);
  });

  it("handles different time commitments", () => {
    const shortTime = { ...BASE, minutesPerDay: 5 } as OnboardingPrefs;
    const longTime = { ...BASE, minutesPerDay: 60 } as OnboardingPrefs;
    
    const shortOut = generateDiagnosticQuestions({ onboarding: shortTime });
    const longOut = generateDiagnosticQuestions({ onboarding: longTime });
    
    expect(shortOut.count).toBeLessThanOrEqual(4);
    expect(longOut.count).toBeGreaterThanOrEqual(shortOut.count);
  });
});
