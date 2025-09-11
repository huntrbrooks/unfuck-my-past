import { OnboardingPrefs, QuestionTemplate, GeneratedQuestion } from "./types";

export function adaptTone(base: string, o: OnboardingPrefs): string {
  const direct = o.tones.includes("direct");
  const gentle = o.tones.includes("gentle");
  const coach  = o.guideStyles.includes("coach");
  const therapist = o.guideStyles.includes("therapist-style");
  const intense = o.guidanceStrength === "intense";

  // Start neutral and layer tone
  let s = base;

  if (therapist) {
    s = s.replace(/^Describe/i, "Can you describe")
         .replace(/^What/i, "Can you share what");
  }

  if (coach) {
    s = s + " Be specific so we can turn it into a small next step.";
  }

  if (direct && !gentle) {
    s = s.replace("Can you", "Tell me");
    if (intense) s = s + " No fluff.";
  }

  if (gentle && !direct) {
    s = "If you're comfortable, " + s.charAt(0).toLowerCase() + s.slice(1);
  }

  // Guard against hardline phrasing in crisis
  if ((o as any).crisisNow) {
    s = s.replace("No fluff.", "");
  }
  return s.trim();
}

export function sanitizeForSafety(text: string, o: OnboardingPrefs, t: QuestionTemplate): string | null {
  // Skip if this template conflicts with avoid list
  const avoid = new Set((o.topicsToAvoid || []).map(x=>x.toLowerCase()));
  if (t.forbiddenIf?.some(x => avoid.has(x.toLowerCase()))) {
    return null;
  }

  // Remove trigger words
  const triggers = (o.triggerWords || "")
    .split(",")
    .map(s=>s.trim())
    .filter(Boolean);

  if (triggers.length) {
    const re = new RegExp(`\\b(${triggers.map(escapeRegExp).join("|")})\\b`, "ig");
    text = text.replace(re, "[sensitive]");
  }

  return text;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function estReadSeconds(prompt: string): number {
  const words = prompt.split(/\s+/).length;
  return Math.max(5, Math.round(words / 3)); // ~180 wpm -> ~3 wps
}

