export const SixScoresSchema = {
  name: 'SixScoresPayload',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['scores'],
    properties: {
      scores: {
        type: 'object',
        additionalProperties: false,
        required: [
          'resilience',
          'vulnerability',
          'self_awareness',
          'boundaries',
          'emotional_regulation',
          'growth_orientation'
        ],
        properties: {
          resilience: { type: 'number', minimum: 0, maximum: 10 },
          vulnerability: { type: 'number', minimum: 0, maximum: 10 },
          self_awareness: { type: 'number', minimum: 0, maximum: 10 },
          boundaries: { type: 'number', minimum: 0, maximum: 10 },
          emotional_regulation: { type: 'number', minimum: 0, maximum: 10 },
          growth_orientation: { type: 'number', minimum: 0, maximum: 10 }
        }
      }
    }
  }
} as const

export type SixScores = {
  resilience: number
  vulnerability: number
  self_awareness: number
  boundaries: number
  emotional_regulation: number
  growth_orientation: number
}


