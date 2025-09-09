// DiagnosticReport JSON Schema (Draft-07). Safe to embed in OpenAI response_format.
export const DiagnosticReportJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "DiagnosticReport",
  type: "object",
  additionalProperties: false,
  required: [
    "executiveSummary",
    "traumaAnalysis", 
    "toxicityScore",
    "strengths",
    "coreBlocker",
    "behavioralPatterns",
    "healingRoadmap",
    "actionableRecommendations",
    "resources"
  ],
  properties: {
    executiveSummary: {
      type: "object",
      additionalProperties: false,
      required: ["title", "narrative"],
      properties: {
        title: { type: "string", default: "🎯 Executive Summary" },
        narrative: { type: "string", minLength: 150, maxLength: 600 }
      }
    },

    traumaAnalysis: {
      type: "object", 
      additionalProperties: false,
      required: ["title", "rootCauses", "currentPatterns", "blindSpots"],
      properties: {
        title: { type: "string", default: "🧠 Trauma Analysis" },
        rootCauses: { type: "string", minLength: 100, maxLength: 400 },
        currentPatterns: { type: "string", minLength: 100, maxLength: 400 },
        blindSpots: { type: "string", minLength: 80, maxLength: 300 }
      }
    },

    toxicityScore: {
      type: "object",
      additionalProperties: false,
      required: ["title", "overallScore", "breakdown", "confidenceRating"],
      properties: {
        title: { type: "string", default: "📊 Toxicity Score Assessment" },
        overallScore: { type: "integer", minimum: 1, maximum: 10 },
        breakdown: {
          type: "object",
          additionalProperties: false,
          required: ["selfCriticism", "avoidance", "anxiety", "externalPressures"],
          properties: {
            selfCriticism: { type: "integer", minimum: 1, maximum: 10 },
            avoidance: { type: "integer", minimum: 1, maximum: 10 },
            anxiety: { type: "integer", minimum: 1, maximum: 10 },
            externalPressures: { type: "integer", minimum: 1, maximum: 10 }
          }
        },
        confidenceRating: { type: "string", enum: ["Low", "Medium", "High"] }
      }
    },

    strengths: {
      type: "object",
      additionalProperties: false,
      required: ["title", "strengths"],
      properties: {
        title: { type: "string", default: "💪 Strengths to Leverage" },
        strengths: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["strength", "whyItMatters", "howToApply"],
            properties: {
              strength: { type: "string", minLength: 5, maxLength: 50 },
              whyItMatters: { type: "string", minLength: 30, maxLength: 150 },
              howToApply: { type: "string", minLength: 30, maxLength: 200 }
            }
          }
        }
      }
    },

    coreBlocker: {
      type: "object",
      additionalProperties: false,
      required: ["title", "name", "impactOnLife", "firstStep"],
      properties: {
        title: { type: "string", default: "🚨 Core Blocker (Most Important to Address)" },
        name: { type: "string", minLength: 5, maxLength: 40 },
        impactOnLife: { type: "string", minLength: 50, maxLength: 250 },
        firstStep: { type: "string", minLength: 30, maxLength: 200 }
      }
    },

    behavioralPatterns: {
      type: "object",
      additionalProperties: false,
      required: ["title", "recurringLoops", "leveragePoint"],
      properties: {
        title: { type: "string", default: "🔄 Behavioral Patterns" },
        recurringLoops: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["cause", "effect", "relapse"],
            properties: {
              cause: { type: "string", minLength: 10, maxLength: 100 },
              effect: { type: "string", minLength: 10, maxLength: 100 },
              relapse: { type: "string", minLength: 10, maxLength: 100 }
            }
          }
        },
        leveragePoint: { type: "string", minLength: 50, maxLength: 300 }
      }
    },

    healingRoadmap: {
      type: "object",
      additionalProperties: false,
      required: ["title", "steps"],
      properties: {
        title: { type: "string", default: "🛣️ Healing Roadmap" },
        steps: {
          type: "array",
          minItems: 4,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["stepNumber", "phase", "action", "timeframe"],
            properties: {
              stepNumber: { type: "integer", minimum: 1, maximum: 6 },
              phase: { type: "string", enum: ["Immediate", "Short-term", "Medium-term", "Long-term", "Aspirational"] },
              action: { type: "string", minLength: 20, maxLength: 150 },
              timeframe: { type: "string", minLength: 5, maxLength: 30 }
            }
          }
        }
      }
    },

    actionableRecommendations: {
      type: "object",
      additionalProperties: false,
      required: ["title", "quickWins"],
      properties: {
        title: { type: "string", default: "⚡ Actionable Recommendations (Quick Wins)" },
        quickWins: {
          type: "array",
          minItems: 5,
          maxItems: 7,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["action", "timeRequired", "whyItWorks"],
            properties: {
              action: { type: "string", minLength: 20, maxLength: 120 },
              timeRequired: { type: "string", minLength: 5, maxLength: 20 },
              whyItWorks: { type: "string", minLength: 20, maxLength: 150 }
            }
          }
        }
      }
    },

    resources: {
      type: "object",
      additionalProperties: false,
      required: ["title", "apps", "books", "professionalHelp"],
      properties: {
        title: { type: "string", default: "📚 Resources & Next Steps" },
        apps: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "purpose"],
            properties: {
              name: { type: "string", minLength: 3, maxLength: 40 },
              purpose: { type: "string", minLength: 15, maxLength: 100 }
            }
          }
        },
        books: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "relevance"],
            properties: {
              title: { type: "string", minLength: 5, maxLength: 60 },
              relevance: { type: "string", minLength: 15, maxLength: 100 }
            }
          }
        },
        professionalHelp: {
          type: "object",
          additionalProperties: false,
          required: ["recommended", "reasoning"],
          properties: {
            recommended: { type: "boolean" },
            reasoning: { type: "string", minLength: 30, maxLength: 200 }
          }
        }
      }
    }
  }
} as const;
