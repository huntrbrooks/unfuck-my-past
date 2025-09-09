// DayPlan JSON Schema (Draft-07). Safe to embed in OpenAI response_format.
export const DayPlanJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "DayPlan",
  type: "object",
  additionalProperties: false,
  required: [
    "dateISO",
    "dayHeading",
    "theme",
    "difficulty",
    "mainFocus",
    "guidedPractice",
    "dailyChallenge",
    "journalingPrompt",
    "reflection",
    "weatherEnvironment",
    "sleepWellness",
    "holisticHealingBonus"
  ],
  properties: {
    dateISO: { type: "string", format: "date" },

    // <= 20 chars, any visible chars
    dayHeading: { type: "string", maxLength: 20, minLength: 3 },

    // <= 3 words. Pattern allows up to two spaces.
    theme: {
      type: "string",
      maxLength: 32,
      pattern: "^\\s*\\S+(?:\\s+\\S+){0,2}\\s*$"
    },

    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },

    mainFocus: {
      type: "object",
      additionalProperties: false,
      required: ["text"],
      properties: {
        text: { type: "string", minLength: 10, maxLength: 240 }
      }
    },

    guidedPractice: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "steps", "durationMinutes"],
        properties: {
          // kebab-case id
          id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          title: { type: "string", minLength: 2, maxLength: 80 },
          durationMinutes: { type: "integer", minimum: 1, maximum: 15 },
          steps: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "text", "defaultChecked"],
              properties: {
                id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
                text: { type: "string", minLength: 2, maxLength: 120 },
                defaultChecked: { type: "boolean", default: false }
              }
            }
          }
        }
      }
    },

    dailyChallenge: {
      type: "object",
      additionalProperties: false,
      required: ["activity", "durationMinutes", "steps", "successIndicators", "energyAdaptations", "title"],
      properties: {
        title: { type: "string", default: "Daily Challenge" },
        activity: { type: "string", minLength: 4, maxLength: 120 },
        durationMinutes: { type: "integer", minimum: 1, maximum: 40 },
        steps: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "text", "defaultChecked"],
            properties: {
              id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
              text: { type: "string", minLength: 2, maxLength: 140 },
              defaultChecked: { type: "boolean", default: false }
            }
          }
        },
        successIndicators: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string", minLength: 4, maxLength: 120 }
        },
        energyAdaptations: {
          type: "object",
          additionalProperties: false,
          required: ["low", "medium", "high"],
          properties: {
            low: { type: "string", minLength: 4, maxLength: 160 },
            medium: { type: "string", minLength: 4, maxLength: 160 },
            high: { type: "string", minLength: 4, maxLength: 160 }
          }
        }
      }
    },

    journalingPrompt: {
      type: "object",
      additionalProperties: false,
      required: ["heading", "prompt"],
      properties: {
        heading: { type: "string", default: "Journaling Prompt" },
        // single sentence encouraged via prompt constraints
        prompt: { type: "string", minLength: 8, maxLength: 180 }
      }
    },

    reflection: {
      type: "object",
      additionalProperties: false,
      required: ["bullets"],
      properties: {
        bullets: {
          type: "array",
          minItems: 2,
          maxItems: 5,
          items: { type: "string", minLength: 4, maxLength: 120 }
        }
      }
    },

    weatherEnvironment: {
      type: "object",
      additionalProperties: false,
      required: ["cues", "summary"],
      properties: {
        summary: { type: "string", minLength: 3, maxLength: 60 },
        cues: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: { type: "string", minLength: 4, maxLength: 100 }
        }
      }
    },

    sleepWellness: {
      type: "object",
      additionalProperties: false,
      required: ["steps", "title", "notes"],
      properties: {
        title: { type: "string", default: "Sleep & Wellness" },
        // exactly 5 steps
        steps: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "text", "defaultChecked"],
            properties: {
              id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
              text: { type: "string", minLength: 2, maxLength: 120 },
              defaultChecked: { type: "boolean", default: false }
            }
          }
        },
        notes: { type: "string", minLength: 4, maxLength: 200 }
      }
    },

    holisticHealingBonus: {
      type: "object",
      additionalProperties: false,
      required: ["text", "steps"],
      properties: {
        text: { type: "string", minLength: 6, maxLength: 200 },
        steps: {
          type: "array",
          minItems: 0,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "text", "defaultChecked"],
            properties: {
              id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
              text: { type: "string", minLength: 2, maxLength: 120 },
              defaultChecked: { type: "boolean", default: false }
            }
          }
        }
      }
    }
  }
} as const;
