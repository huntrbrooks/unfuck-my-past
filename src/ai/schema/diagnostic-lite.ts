export const DiagnosticLiteSchema = {
  name: 'DiagnosticLite',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['colour_profile', 'avoidance_ladder', 'core_blocker', 'activation_kit'],
    properties: {
      colour_profile: {
        type: 'object',
        additionalProperties: false,
        required: ['dominant_colour', 'hex', 'meaning'],
        properties: {
          dominant_colour: { type: 'string', enum: ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange'] },
          hex: { type: 'string', pattern: '^#([0-9A-Fa-f]{6})$' },
          meaning: { type: 'string', minLength: 8, maxLength: 220 },
          secondary: {
            type: 'object',
            additionalProperties: false,
            required: ['colour', 'hex', 'weight'],
            properties: {
              colour: { type: 'string', enum: ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange'] },
              hex: { type: 'string', pattern: '^#([0-9A-Fa-f]{6})$' },
              weight: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        }
      },
      avoidance_ladder: {
        type: 'array',
        minItems: 4,
        maxItems: 7,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'severity', 'why_it_matters'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50 },
            severity: { type: 'number', minimum: 1, maximum: 5 },
            why_it_matters: { type: 'string', minLength: 6, maxLength: 180 }
          }
        }
      },
      core_blocker: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'evidence', 'starter_action'],
        properties: {
          label: { type: 'string', minLength: 3, maxLength: 40 },
          evidence: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string', minLength: 6, maxLength: 160 } },
          starter_action: { type: 'string', minLength: 6, maxLength: 160 }
        }
      },
      activation_kit: {
        type: 'object',
        additionalProperties: false,
        required: ['brp', 'boundary_script', 'micro_exposure'],
        properties: {
          brp: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string', minLength: 4, maxLength: 120 } },
          boundary_script: { type: 'string', minLength: 6, maxLength: 140 },
          micro_exposure: {
            type: 'object',
            additionalProperties: false,
            required: ['target', 'duration_min', 'if_then_plan'],
            properties: {
              target: { type: 'string', minLength: 3, maxLength: 80 },
              duration_min: { type: 'number', minimum: 3, maximum: 30 },
              if_then_plan: { type: 'string', minLength: 6, maxLength: 180 }
            }
          }
        }
      }
    }
  }
} as const

export type DiagnosticLite = {
  colour_profile: {
    dominant_colour: 'Blue' | 'Red' | 'Green' | 'Yellow' | 'Purple' | 'Orange'
    hex: string
    meaning: string
    secondary?: { colour: DiagnosticLite['colour_profile']['dominant_colour']; hex: string; weight: number }
  }
  avoidance_ladder: Array<{ name: string; severity: number; why_it_matters: string }>
  core_blocker: { label: string; evidence: string[]; starter_action: string }
  activation_kit: { brp: string[]; boundary_script: string; micro_exposure: { target: string; duration_min: number; if_then_plan: string } }
}


