import { PreviewSchema, Insight } from '../previewSchema'

describe('PreviewSchema', () => {
  const validInsight = {
    label: "Test Insight",
    whatWeSaw: "This is what we observed in the user's responses",
    evidence: {
      questionId: "q1",
      quote: "This is a user quote"
    },
    whyItMatters: "This is why this insight matters for the user",
    microAction: "After brushing teeth, take 2 deep breaths",
    tags: ["Anxiety", "Clarity"]
  }

  const validPreview = {
    diagnosticSummary: "This is a diagnostic summary with user quote from Q1: 'This is a user quote'. The summary provides insights into the user's patterns.",
    insights: [validInsight, validInsight, validInsight],
    confidence: {
      label: "medium" as const,
      reason: "Strong signals on habits; limited detail on sleep and relationships.",
      missingData: ["sleep timing variance", "weekend social triggers"]
    },
    teaser: "The full report adds your Trauma Map, Avoidance Hierarchy, Core Blocker, and a 5-step plan that fits your day.",
    meta: {
      tone: "gentle",
      rawness: "medium",
      depth: "deep",
      minutesPerDay: 15,
      primaryFocus: "habits/consistency",
      quotesUsed: 2
    }
  }

  describe('Insight validation', () => {
    it('should validate a correct insight', () => {
      const result = Insight.safeParse(validInsight)
      expect(result.success).toBe(true)
    })

    it('should reject insight with label too long', () => {
      const invalidInsight = {
        ...validInsight,
        label: "This label is way too long and exceeds the 40 character limit"
      }
      const result = Insight.safeParse(invalidInsight)
      expect(result.success).toBe(false)
    })

    it('should reject insight with quote too short', () => {
      const invalidInsight = {
        ...validInsight,
        evidence: {
          ...validInsight.evidence,
          quote: "Hi"
        }
      }
      const result = Insight.safeParse(invalidInsight)
      expect(result.success).toBe(false)
    })

    it('should reject insight with no tags', () => {
      const invalidInsight = {
        ...validInsight,
        tags: []
      }
      const result = Insight.safeParse(invalidInsight)
      expect(result.success).toBe(false)
    })
  })

  describe('PreviewSchema validation', () => {
    it('should validate a correct preview', () => {
      const result = PreviewSchema.safeParse(validPreview)
      expect(result.success).toBe(true)
    })

    it('should reject preview with wrong number of insights', () => {
      const invalidPreview = {
        ...validPreview,
        insights: [validInsight, validInsight] // Only 2 insights instead of 3
      }
      const result = PreviewSchema.safeParse(invalidPreview)
      expect(result.success).toBe(false)
    })

    it('should reject preview with invalid confidence label', () => {
      const invalidPreview = {
        ...validPreview,
        confidence: {
          ...validPreview.confidence,
          label: "invalid" as any
        }
      }
      const result = PreviewSchema.safeParse(invalidPreview)
      expect(result.success).toBe(false)
    })

    it('should reject preview with summary too short', () => {
      const invalidPreview = {
        ...validPreview,
        diagnosticSummary: "Too short"
      }
      const result = PreviewSchema.safeParse(invalidPreview)
      expect(result.success).toBe(false)
    })
  })
})
