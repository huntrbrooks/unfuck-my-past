import {
  GeneratorInput, GeneratorOutput, GeneratedQuestion,
  OnboardingPrefs, QuestionTemplate, QCategory
} from "./types";
import { computeQuestionCount } from "./count";
import { UNIVERSAL, FOCUS_BANK, CHALLENGE_BANK } from "./bank";
import { adaptTone, sanitizeForSafety, estReadSeconds } from "./style";

const COVERAGE_ORDER: QCategory[] = ["narrative","trigger","avoidance","belief","body","values","goal","plan"];

export function generateDiagnosticQuestions(input: GeneratorInput): GeneratorOutput {
  const o = input.onboarding;
  const rationale: string[] = [];
  const count = computeQuestionCount(o);
  rationale.push(`Count from depth=${o.depth}, minutes=${o.minutesPerDay}, engagement=${o.engagement}, crisis=${!!o.crisisNow} -> ${count}`);

  // Start with universal
  let pool: QuestionTemplate[] = [...UNIVERSAL];

  // Focus templates
  const focusItems = FOCUS_BANK[o.primaryFocus] || [];
  if (focusItems.length) {
    rationale.push(`Loaded ${focusItems.length} focus items for ${o.primaryFocus}`);
    pool = pool.concat(focusItems);
  }

  // Challenges
  for (const ch of o.challenges) {
    const bank = CHALLENGE_BANK[ch.toLowerCase()];
    if (bank?.length) {
      rationale.push(`Added ${bank.length} challenge items for ${ch}`);
      pool = pool.concat(bank);
    }
  }

  // Baseline driven additives
  if (o.stress0to10 >= 7) {
    pool.push({
      id:"stress_regulate_5min", category:"plan",
      base:"When stress spikes above a 7, what is your fastest 5-minute downshift?",
      tags:["downshift"], risk:"low"
    });
  }
  if (o.ruminationFreq === "daily") {
    pool.push({
      id:"rumination_loop", category:"belief",
      base:"When thoughts loop daily, what do they usually loop around and what would make that loop lose power?",
      tags:["rumination"], risk:"med"
    });
  }
  if (o.sleep0to10 <= 4 && o.primaryFocus !== "sleep") {
    pool.push({
      id:"sleep_drag", category:"narrative",
      base:"How does poor sleep change your decisions the next day?",
      tags:["sleep","knock-on"], risk:"low"
    });
  }

  // Select best set with coverage and safety
  const selected: GeneratedQuestion[] = [];
  const used = new Set<string>();
  const usedText = new Set<string>();
  let stockCount = 0;

  function tryAdd(t: QuestionTemplate) {
    if (used.has(t.id)) return;
    let prompt = adaptTone(t.base, o);
    const safe = sanitizeForSafety(prompt, o, t);
    if (!safe) return; // filtered out by safety
    prompt = safe;

    // Cap stock questions to maximum of two
    if (t.stock) {
      if (stockCount >= 2) return;
    }

    // Deduplicate by normalized text content to avoid near-identical repeats
    const norm = normalizeText(prompt);
    if (usedText.has(norm)) return;

    selected.push({
      id: t.id,
      category: t.category,
      prompt,
      helper: t.helper,
      tags: t.tags || [],
      estReadSec: estReadSeconds(prompt)
    });
    used.add(t.id);
    usedText.add(norm);
    if (t.stock) stockCount += 1;
  }

  // 1) Force-add universals first but keep stock cap in place
  for (const u of UNIVERSAL) tryAdd(u);

  // 2) Coverage pass: ensure we touch as many categories as possible
  const byCategory: Record<QCategory, QuestionTemplate[]> = {} as any;
  for (const t of pool) {
    (byCategory[t.category] ||= []).push(t);
  }
  for (const cat of COVERAGE_ORDER) {
    if (selected.length >= count) break;
    const list = (byCategory[cat] || []).filter(t => !used.has(t.id));
    // prefer lower risk first
    list.sort(riskSort);
    for (const t of list) {
      if (selected.length >= count) break;
      tryAdd(t);
      if (selected.length >= count) break;
    }
  }

  // 3) Fill remainder by best-fit risk ladder and dedupe
  if (selected.length < count) {
    const remaining = pool.filter(t => !used.has(t.id)).sort(riskSort);
    for (const t of remaining) {
      if (selected.length >= count) break;
      tryAdd(t);
    }
  }

  // 4) Crisis softening rule: if crisis, keep only low-risk and adjust text already softened in adaptTone
  if (o.crisisNow) {
    const low = selected.filter(q => {
      const template = pool.find(t => t.id === q.id);
      return !template || (template.risk !== "high");
    }).slice(0, Math.min(3, count));
    rationale.push("Crisis mode: trimmed to low-risk items only");
    return { count: low.length, questions: orderForFlow(low, o), rationale };
  }

  return { count: selected.length, questions: orderForFlow(selected, o), rationale };
}

function riskSort(a: QuestionTemplate, b: QuestionTemplate) {
  const rank = (r?: "low"|"med"|"high") => r === "low" ? 1 : r === "med" ? 2 : r === "high" ? 3 : 2;
  return rank(a.risk) - rank(b.risk);
}

function orderForFlow(items: GeneratedQuestion[], o: OnboardingPrefs): GeneratedQuestion[] {
  // Simple flow: low → medium → high intensity by category hint
  const catRank: Record<string, number> = {
    "goal": 1, "values": 1, "narrative": 2, "body": 2, "trigger": 3, "avoidance": 3, "belief": 4, "plan": 5
  };
  const sorted = [...items].sort((a,b)=> (catRank[a.category]||3) - (catRank[b.category]||3));

  // Gentle preference starts with goal/values, direct preference starts with narrative/trigger
  const gentle = o.tones.includes("gentle") && !o.tones.includes("direct");
  if (gentle) {
    sorted.sort((a,b)=> (isSoft(a)?-1:1) - (isSoft(b)?-1:1));
  }
  return sorted;
}

function isSoft(q: GeneratedQuestion) {
  return q.category === "goal" || q.category === "values";
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\.,!?;:()\[\]\-_'"`]/g, "")
    .trim();
}

