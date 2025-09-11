import { OnboardingPrefs } from "./types";

const depthMap = { surface: 3, moderate: 5, deep: 7, profound: 10 } as const;
const timeCap  = (m: number) => (m <= 5 ? 3 : m <= 15 ? 7 : m <= 30 ? 9 : 10);

export function computeQuestionCount(o: OnboardingPrefs): number {
  // base from depth
  let target: number = depthMap[o.depth];

  // cap by daily time budget
  target = Math.min(target, timeCap(o.minutesPerDay));

  // engagement nudges
  if (o.engagement === "passive") target = Math.min(target, 5);
  if (o.engagement === "active")  target = Math.min(10, target + 1);

  // safety and crisis guard
  if (o.crisisNow) target = Math.min(target, 3);

  // strict bounds
  const bounded = clamp(target, 3, 10);
  // Respect an optional preferred count if provided via mapper (not persisted here)
  const anyObj: any = o as any;
  const pref = typeof anyObj.preferredQuestionCount === 'number' ? anyObj.preferredQuestionCount : undefined;
  if (pref) return clamp(pref, 3, 10);
  return bounded;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
