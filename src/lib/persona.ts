export type SixScores = {
  resilience: number
  vulnerability: number
  selfAwareness: number
  boundaries: number
  emotionalRegulation: number
  growthOrientation: number
}

export type ArchetypeColour = 'Blue' | 'Red' | 'Green' | 'Yellow' | 'Purple' | 'Orange'

export const COLOURS: Record<ArchetypeColour, string> = {
  Blue: '#2563EB',
  Red: '#DC2626',
  Green: '#16A34A',
  Yellow: '#CA8A04',
  Purple: '#7C3AED',
  Orange: '#EA580C',
}

const clamp = (n: number) => Math.max(0, Math.min(10, n))

export function pickArchetype(scores: SixScores): { colour: ArchetypeColour; score: number }[] {
  const s: SixScores = {
    resilience: clamp(scores.resilience),
    vulnerability: clamp(scores.vulnerability),
    selfAwareness: clamp(scores.selfAwareness),
    boundaries: clamp(scores.boundaries),
    emotionalRegulation: clamp(scores.emotionalRegulation),
    growthOrientation: clamp(scores.growthOrientation),
  }
  const strength = 0.6 * s.resilience + 0.4 * s.boundaries
  const openness = 0.7 * s.vulnerability + 0.3 * s.growthOrientation
  const insight = 0.7 * s.selfAwareness + 0.3 * s.growthOrientation
  const composure = 0.7 * s.emotionalRegulation + 0.3 * s.selfAwareness
  const volatility = 10 - s.emotionalRegulation
  const permeability = 10 - s.boundaries
  const candidates: { colour: ArchetypeColour; score: number }[] = [
    { colour: 'Blue', score: 0.55 * composure + 0.45 * insight },
    { colour: 'Red', score: 0.65 * strength + 0.35 * (10 - s.vulnerability) },
    { colour: 'Green', score: 0.55 * openness + 0.45 * s.resilience },
    { colour: 'Yellow', score: 0.6 * s.growthOrientation + 0.4 * insight - 0.2 * s.boundaries },
    { colour: 'Purple', score: 0.6 * insight + 0.4 * composure },
    { colour: 'Orange', score: 0.55 * s.growthOrientation + 0.45 * (0.5 * volatility + 0.5 * permeability) },
  ]
  return candidates.sort((a, b) => b.score - a.score)
}

export function colourStory(colour: ArchetypeColour): string {
  switch (colour) {
    case 'Blue':
      return 'Calm Seeker — reflective, composed, steady under pressure. Guard against complacency; schedule one small, edgy experiment each week.'
    case 'Red':
      return 'Fighter — high grit and independence. Letting safe people in is your growth edge; share one honest feeling this week.'
    case 'Green':
      return 'Nurturer — empathetic and resilient. Protect your energy; set one clear boundary and keep it for 7 days.'
    case 'Yellow':
      return 'Explorer — curious and adaptive. Anchor your experiments with a minimum viable routine to convert momentum into results.'
    case 'Purple':
      return 'Sage — pattern-spotter with emotional control. Balance reflection with action; ship one imperfect task daily.'
    case 'Orange':
      return 'Rebel — passionate and raw. Build guardrails (sleep, hydration, check-ins) to prevent burnout and channel fire.'
  }
}
