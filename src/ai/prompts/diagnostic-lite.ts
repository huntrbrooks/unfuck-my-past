export const DIAGNOSTIC_LITE_SYSTEM = `
You are a safety-aware, trauma-informed AI coach.
Output only valid JSON per schema. Keep labels short, non-graphic, and actionable.
If uncertain, choose midpoint advice. Route crises to professional help (do not include phone numbers here).`

export const DIAGNOSTIC_LITE_USER = (onboarding: any, answers: any) => `
Use the onboarding choices and open-ended answers to produce:
- colour_profile (dominant_colour + hex + meaning; add secondary only if close)
- avoidance_ladder (4–7 ranked items, Severity 1–5, with why_it_matters)
- core_blocker (label, 2–4 bullets evidence, one starter_action)
- activation_kit (brp steps, boundary_script sentence, micro_exposure object)

ONBOARDING:
${JSON.stringify(onboarding, null, 2)}

ANSWERS:
${JSON.stringify(answers, null, 2)}

Return ONLY JSON. No extra text.`


