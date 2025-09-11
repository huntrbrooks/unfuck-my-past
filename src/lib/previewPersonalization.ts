import type { Onboarding } from "@/db/schema/onboarding";

export function mapPreviewLevers(o: Onboarding) {
  const tone =
    o.tones.includes("direct") && !o.tones.includes("gentle") ? "tough-love" :
    o.tones.includes("clinical") ? "clinical" :
    o.tones.includes("spiritual") ? "spiritual" :
    o.tones.includes("gentle") ? "gentle" : "neutral";

  const rawness =
    o.guidanceStrength === "intense" ? "high" :
    o.guidanceStrength === "moderate" ? "medium" : "low";

  const depth =
    o.depth === "profound" || o.depth === "deep" ? "deep" :
    o.depth === "moderate" ? "medium" : "light";

  const minutesCap = o.minutesPerDay <= 5 ? 2 : o.minutesPerDay <= 15 ? 5 : 10;

  // learning styles steer microcopy and teaser phrasing
  const style = {
    prefersVisual: o.learningStyles.includes("visual"),
    prefersAudio:  o.learningStyles.includes("audio"),
    prefersInteractive: o.learningStyles.includes("interactive"),
  };

  // teaser variants
  const teaserVariant =
    o.primaryFocus === "habits/consistency" ? "roadmap" :
    o.primaryFocus === "anxiety"            ? "downshift" :
    o.primaryFocus === "sleep"              ? "sleep" :
    "core";

  return {
    tone, rawness, depth,
    minutesCap,
    primaryFocus: o.primaryFocus,
    style, teaserVariant
  };
}
