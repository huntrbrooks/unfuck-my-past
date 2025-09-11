import { Preview } from "./previewSchema";
import { teaserLine } from "./previewCopy";

type QA = { id: string; prompt?: string };
type Answer = { id: string; text: string };

type Levers = {
  tone?: "gentle"|"tough-love"|"clinical"|"spiritual"|"neutral";
  rawness?: "low"|"medium"|"high";
  depth?: "light"|"medium"|"deep";
  minutesCap?: 2|5|10;
  primaryFocus?: string;
  teaserVariant?: "roadmap"|"downshift"|"sleep"|"core";
};

function clampConfidence(score: number): number {
  if (score < 0) return 0; if (score > 1) return 1; return Number(score.toFixed(2));
}

function pickTeaser(variant: Levers["teaserVariant"], tone: NonNullable<Levers["tone"]>) {
  try {
    return teaserLine(variant || "core", tone || "gentle");
  } catch {
    return teaserLine("core", "gentle");
  }
}

function extractQuote(text: string): string | undefined {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return undefined;
  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0] || trimmed.slice(0, 140);
  return sentence.slice(0, 120);
}

function deriveTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  if (/(anxious|anxiety|panic|worry)/.test(lower)) tags.push("anxiety");
  if (/(avoid|shutdown|numb)/.test(lower)) tags.push("avoidance");
  if (/(sleep|insomnia|tired)/.test(lower)) tags.push("sleep");
  if (/(relationship|partner|attachment)/.test(lower)) tags.push("relationships");
  if (/(self|worth|enough|shame)/.test(lower)) tags.push("self-image");
  if (tags.length === 0) tags.push("patterns");
  return Array.from(new Set(tags)).slice(0, 3);
}

function microActionFrom(text: string, cap: 2|5|10): string {
  // Simple library of safe micro actions, capped
  const m = Math.min(cap, 2);
  const base = [
    `Do box breathing for ${m} min after brushing teeth`,
    `Take a ${m} min slow walk noticing 5 things you see`,
    `Write one sentence about what you need (${m} min max)`,
  ];
  if (/sleep/i.test(text)) return `Dim screens and read paper book for ${m} min before bed`;
  if (/anxiety|anxious|panic/i.test(text)) return `4-7-8 breathing for ${m} min, hand on chest`; 
  if (/relationship|partner/i.test(text)) return `Send one kind text or set a ${m} min boundary note`; 
  return base[(text.length % base.length)];
}

function buildLabel(text: string): string {
  const t = text.toLowerCase();
  if (/(discipline|willpower)/.test(t) && /(self[- ]?talk|compassion|shame|guilt|critic)/.test(t)) {
    return "Discipline vs Compassion";
  }
  if (/(quit|vape|smok|drink|habit)/.test(t)) {
    return "Quitting Patterns";
  }
  if (/(stress|shift|work|carry|bleed)/.test(t)) {
    return "Stress Carryover";
  }
  if (/(sleep|insomnia|night)/.test(t)) {
    return "Sleep Loop";
  }
  return "Pattern Signal";
}

export function generateLocalPreview(
  questions: QA[],
  answers: Answer[],
  levers: Levers = {}
): Preview {
  const minutesCap = (levers.minutesCap ?? 5) as 2|5|10;

  // Build a conservative summary from first two answers
  const texts = answers.map(a => a.text).filter(Boolean);
  const firstTwo = texts.slice(0, 2);
  const quote = extractQuote(texts[0] || "");
  const summaryParts: string[] = [];
  if (firstTwo[0]) summaryParts.push("You shared patterns you notice and how stress shows up for you.");
  if (firstTwo[1]) summaryParts.push("I see consistent themes in your coping and self-talk without giving advice here.");
  const diagnosticSummary = `${summaryParts.join(" ")}${quote ? ` "${quote}"` : ""}`.slice(0, 420);

  // Construct up to 3 insights from first three answers
  const insights = answers.slice(0, 3).map((a, idx) => {
    const q = questions.find(qx => qx.id === a.id);
    const qLabel = q?.prompt || "your answer";
    const whatWeSaw = `You describe ${qLabel.toLowerCase()} in your words, which reveals a repeated pattern.`.slice(0, 240);
    const baseQuote = extractQuote(a.text) || "";
    const qIdSuffix = a.id?.replace(/^q/i, "Q") || "Q" + (idx + 1);
    const evidenceQuote = baseQuote ? `${baseQuote} (${qIdSuffix})`.slice(0, 140) : "";
    const whyItMatters = `This seems to drive a loop that keeps the behavior sticky for you.`.slice(0, 200);
    // Vary micro-action type across insights: reflective, physical, relational
    const minutesShort = Math.min(minutesCap, 2);
    const microAction = (
      idx === 0 ? `After brushing teeth, write one line: "Today counts even if imperfect."` :
      idx === 1 ? `Take a ${minutesShort} min slow walk, naming 5 things you see.` :
                  `Send a kind two-sentence check-in or boundary text.`
    ).slice(0, 200);
    const label = buildLabel(a.text);
    const topical = deriveTags(a.text);
    const tags = [label, ...topical];
    return { whatWeSaw, evidenceQuote, whyItMatters, microAction, tags };
  });
  while (insights.length < 3) {
    insights.push({
      whatWeSaw: "Your responses point to a workable starting point with small, consistent changes.",
      whyItMatters: "Clear first steps reduce overwhelm and build confidence.",
      microAction: microActionFrom("", minutesCap),
      tags: ["patterns"],
    } as any);
  }

  // Confidence based on total characters across answers
  const totalChars = texts.join(" ").length;
  const base = totalChars > 800 ? 0.75 : totalChars > 300 ? 0.6 : 0.5;
  const missing: string[] = [];
  const all = texts.join(" ").toLowerCase();
  if (!/(sleep|insomnia|night|bed)/.test(all)) missing.push("Sleep patterns unclear");
  if (!/(weekend|saturday|sunday)/.test(all)) missing.push("No detail on weekends");
  if (!/(friend|partner|family|social)/.test(all)) missing.push("Social support unknown");
  const confidence = {
    score: clampConfidence(base),
    missingData: missing.slice(0, 3),
  };

  const tone = (levers.tone || "gentle") as NonNullable<Levers["tone"]>;
  const teaser = pickTeaser(levers.teaserVariant || "core", tone).slice(0, 300);

  const preview: Preview = {
    diagnosticSummary,
    insights: insights.slice(0, 3),
    confidence,
    teaser,
    safety: { notes: [] },
  };

  return preview;
}


