export type Subscales = {
  selfCriticism: number
  avoidance: number
  anxiety: number
  externalPressures: number
  controlUrge: number
  resilience: number
}

export type OnboardingLite = {
  primaryFocus: string
  depth: 'surface' | 'moderate' | 'deep' | 'profound'
  learningStyles: Array<'text' | 'visual' | 'audio' | 'interactive'>
  tone?: string[]
}

export type ColourKey = 'teal' | 'lime' | 'orange' | 'pink' | 'blue' | 'purple' | 'red' | 'cyan'

export type ColourIdentity = {
  key: ColourKey
  name: string
  hex: string
  bg: string
  text: string
  ring: string
  emoji: string
  meaning: string
}

export const COLOURS: Record<ColourKey, ColourIdentity> = {
  teal:   { key: 'teal',   name: 'Balance & Boundaries', hex: '#14b8a6', bg: 'bg-teal-500',   text: 'text-teal-900',   ring: 'ring-teal-300',   emoji: '🟦', meaning: 'reciprocity, steadiness' },
  lime:   { key: 'lime',   name: 'Growth & Momentum',    hex: '#84cc16', bg: 'bg-lime-500',   text: 'text-lime-900',   ring: 'ring-lime-300',   emoji: '🟩', meaning: 'learning, micro-wins' },
  orange: { key: 'orange', name: 'Processing',           hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-900', ring: 'ring-orange-300', emoji: '🟧', meaning: 'metabolising stress' },
  pink:   { key: 'pink',   name: 'Self-Compassion',      hex: '#ec4899', bg: 'bg-pink-500',   text: 'text-pink-900',   ring: 'ring-pink-300',   emoji: '🩷', meaning: 'soften inner critic' },
  blue:   { key: 'blue',   name: 'Stability & Ground',   hex: '#3b82f6', bg: 'bg-blue-500',   text: 'text-blue-900',   ring: 'ring-blue-300',   emoji: '🟦', meaning: 'calm, reliability' },
  purple: { key: 'purple', name: 'Insight & Patterns',   hex: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-900', ring: 'ring-purple-300', emoji: '🟪', meaning: 'metacognition' },
  red:    { key: 'red',    name: 'Activation & Energy',  hex: '#ef4444', bg: 'bg-red-500',    text: 'text-red-900',    ring: 'ring-red-300',    emoji: '🟥', meaning: 'forward push' },
  cyan:   { key: 'cyan',   name: 'Clarity & Signals',    hex: '#06b6d4', bg: 'bg-cyan-500',   text: 'text-cyan-900',   ring: 'ring-cyan-300',   emoji: '🟦', meaning: 'noticing → naming' }
}

export type ColourInput = {
  sub: Subscales
  overallToxicity: number
  onboarding: OnboardingLite
  contradictions: boolean
  previousColourKey?: ColourKey | null
}

type Candidate = { key: ColourKey; priority: number; trigger: string; triggerValue: number; rationale: string }

export function pickColour(input: ColourInput) {
  const { sub, onboarding, overallToxicity, contradictions } = input
  const pressureLoad = Math.max(sub.anxiety, sub.externalPressures)
  const stability = Math.round((sub.resilience + (10 - sub.anxiety)) / 2)

  const isFocusBoundaries = /relation|boundar/i.test(onboarding.primaryFocus)
  const isDeep = onboarding.depth === 'deep' || onboarding.depth === 'profound'
  const visualLearner = onboarding.learningStyles.includes('visual')

  const C: Candidate[] = []

  if (isFocusBoundaries && sub.controlUrge >= 7 && sub.resilience >= 6) {
    C.push({ key: 'teal', priority: 1, trigger: 'controlUrge', triggerValue: sub.controlUrge,
      rationale: 'Focus=boundaries + high control urge + adequate resilience' })
  }
  if (sub.selfCriticism >= 7 &&
      sub.selfCriticism >= Math.max(sub.avoidance, sub.anxiety, sub.externalPressures, sub.controlUrge)) {
    C.push({ key: 'pink', priority: 2, trigger: 'selfCriticism', triggerValue: sub.selfCriticism,
      rationale: 'Self-criticism dominant' })
  }
  if (pressureLoad >= 7 || (sub.anxiety >= 6 && contradictions)) {
    C.push({ key: 'orange', priority: 3, trigger: (sub.anxiety >= sub.externalPressures ? 'anxiety' : 'externalPressures'),
      triggerValue: Math.max(sub.anxiety, sub.externalPressures),
      rationale: 'High anxiety/pressure or anxiety with contradictions' })
  }
  if (sub.resilience >= 8 && sub.anxiety <= 4) {
    C.push({ key: 'blue', priority: 4, trigger: 'resilience', triggerValue: sub.resilience,
      rationale: 'High resilience with low anxiety' })
  }
  if (sub.resilience >= 7 && overallToxicity <= 5) {
    C.push({ key: 'lime', priority: 5, trigger: 'resilience', triggerValue: sub.resilience,
      rationale: 'Good resilience with low overall toxicity' })
  }
  if (sub.avoidance >= 7 && sub.resilience >= 6) {
    C.push({ key: 'red', priority: 6, trigger: 'avoidance', triggerValue: sub.avoidance,
      rationale: 'Avoidance high; energy available to activate' })
  }
  if (isDeep && contradictions && (pressureLoad >= 4 && pressureLoad <= 6)) {
    C.push({ key: 'purple', priority: 7, trigger: 'contradictions', triggerValue: pressureLoad,
      rationale: 'Deep work + contradictions + moderate pressure' })
  }
  if (visualLearner || isMixedMidRange(sub)) {
    C.push({ key: 'cyan', priority: 8, trigger: 'mixed', triggerValue: stability,
      rationale: 'Visual learner or mixed mid-range scores' })
  }

  if (C.length === 0) {
    const fallback: ColourKey = stability >= 7 ? 'blue' : (isFocusBoundaries ? 'teal' : 'cyan')
    C.push({ key: fallback, priority: 9, trigger: 'fallback', triggerValue: stability, rationale: 'No strong driver' })
  }

  C.sort((a, b) => a.priority - b.priority || b.triggerValue - a.triggerValue)
  let best = C[0]

  const prev = input.previousColourKey
  if (prev && prev !== best.key) {
    const prevIdx = C.findIndex(c => c.key === prev)
    if (prevIdx >= 0) {
      const prevCand = C[prevIdx]
      const rankGain = prevCand.priority - best.priority
      const triggerGain = best.triggerValue - prevCand.triggerValue
      const strongEnough = (rankGain >= 2) || (triggerGain >= 2)
      if (!strongEnough) best = prevCand
    }
  }

  const colour = COLOURS[best.key]
  const rationale = `${colour.name}: ${best.rationale}`
  return { ...colour, rationale }
}

function isMixedMidRange(s: Subscales) {
  const vals = [s.selfCriticism, s.avoidance, s.anxiety, s.externalPressures, s.controlUrge, s.resilience]
  const hi = Math.max(...vals), lo = Math.min(...vals)
  return hi <= 7 && lo >= 3
}


