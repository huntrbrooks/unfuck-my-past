type Tone = "gentle"|"tough-love"|"clinical"|"spiritual"|"neutral";
type Raw = "low"|"medium"|"high";

export function formatMicroAction(base: string, minutesCap: number, tone: Tone, raw: Raw) {
  // ensure duration cap is explicit in phrasing
  const capped = base.replace(/\b(\d+)\s*min(ute)?s?\b/gi, m => {
    const n = parseInt(m); return `${Math.min(n || minutesCap, minutesCap)} min`;
  });
  if (tone === "tough-love" && raw === "high") return capped + " Do it. No debate.";
  if (tone === "gentle") return capped + " Keep it light; stop if it stresses you.";
  if (tone === "clinical") return capped + " Log completion to track adherence.";
  if (tone === "spiritual") return capped + " Breathe in ease, breathe out tension.";
  return capped;
}

export function teaserLine(variant: "roadmap"|"downshift"|"sleep"|"core", tone: Tone) {
  // Focus-tied, one-sentence teaser with concrete intrigue and no hype words
  const base =
    variant === "roadmap"
      ? "Get your Core Blocker named and a 5-step plan that finally makes consistency stick."
      : variant === "downshift"
      ? "See your personal Avoidance Hierarchy and the one trigger that spikes your anxiety the most."
      : variant === "sleep"
      ? "Map the loops keeping you up and get a 5-step wind-down built for your nights."
      : "See your Trauma Map, the Core Blocker driving your loops, and a 5-step plan matched to your time.";

  if (tone === "tough-love") return base.replace("adds", "includes—no fluff.");
  if (tone === "clinical")   return base.replace("plan", "protocol");
  if (tone === "spiritual")  return base.replace("plan", "practice");
  return base;
}
