export const PERSONA_SYSTEM = `
You infer 6 numeric scores (0–10): resilience, vulnerability, self_awareness, boundaries, emotional_regulation, growth_orientation.
Be safety-aware; keep outputs non-graphic. If unsure, use midpoint (5–6). Return only JSON.`

export const PERSONA_USER = (onboarding: any, answers: any) => `
Use these onboarding choices and answers to output the six scores ONLY per the schema.

ONBOARDING:
${JSON.stringify(onboarding, null, 2)}

ANSWERS:
${JSON.stringify(answers, null, 2)}
`


