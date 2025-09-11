import { Onboarding } from "@/db/schema/onboarding";

export function mapOnboardingToReportLevers(o: Onboarding) {
  const tone = o.tones.includes("direct") && !o.tones.includes("gentle")
    ? "tough-love"
    : o.tones.includes("clinical")
      ? "clinical"
      : o.tones.includes("spiritual")
        ? "spiritual"
        : o.tones.includes("gentle")
          ? "gentle"
          : "neutral";

  const rawness =
    o.guidanceStrength === "intense" ? "high" :
    o.guidanceStrength === "moderate" ? "medium" : "low";

  const depth =
    o.depth === "profound" ? "deep" :
    o.depth === "deep" ? "deep" :
    o.depth === "moderate" ? "medium" : "light";

  const cadence =
    o.engagement === "active" ? "daily" :
    o.engagement === "moderate" ? "weekly" : "minimal";

  const interpretiveRisk = depth === "deep" ? "higher" : depth === "light" ? "very-low" : "moderate";

  const actionDuration =
    o.minutesPerDay <= 5 ? 5 :
    o.minutesPerDay <= 15 ? 10 : 15; // cap quick wins at 15 min for MVP

  const learningStylePrimary = o.learningStyles[0] ?? "text";

  const safety = {
    avoidTopics: o.topicsToAvoid,
    triggerWords: (o.triggerWords ?? "").split(",").map(s=>s.trim()).filter(Boolean),
    flags: o.flags,
  };

  const anchors = {
    stress: o.stress0to10,
    sleep: o.sleep0to10,
    rumination: o.ruminationFreq,
  };

  return {
    tone, 
    rawness, 
    depth, 
    cadence, 
    interpretiveRisk,
    actionDuration, 
    learningStylePrimary, 
    safety, 
    anchors,
    primaryFocus: o.primaryFocus,
    goals: o.goals,
    constraints: {
      attentionSpan: o.attentionSpan,
      inputMode: o.inputMode,
      minutesPerDay: o.minutesPerDay,
      scheduleNote: o.scheduleNote,
    }
  };
}

// Enhanced context builder that uses the mapped data
export function buildEnhancedContext(onboardingData: ReturnType<typeof mapOnboardingToReportLevers>) {
  const { tone, rawness, depth, safety, anchors, primaryFocus, goals, constraints } = onboardingData;
  
  return {
    // Communication style adaptation
    brandVoiceLevel: rawness === "high" ? "blunt" : rawness === "medium" ? "direct" : "gentle",
    languageIntensity: tone === "tough-love" ? "intense" : tone === "gentle" ? "soft" : "balanced",
    
    // Analysis depth control
    explorationDepth: depth,
    interpretiveRisk: onboardingData.interpretiveRisk,
    
    // Safety considerations
    topicGuards: safety.avoidTopics,
    triggerAvoidance: safety.triggerWords,
    specialFlags: safety.flags,
    
    // Baseline calibration for scoring
    stressBaseline: anchors.stress,
    sleepBaseline: anchors.sleep,
    ruminationPattern: anchors.rumination,
    
    // Action personalization
    maxActionDuration: onboardingData.actionDuration,
    preferredLearningMode: onboardingData.learningStylePrimary,
    engagementCapacity: constraints.attentionSpan,
    
    // Focus area targeting
    primaryHealingFocus: primaryFocus,
    secondaryGoals: goals.filter(g => g !== primaryFocus),
    
    // Practical constraints
    dailyTimeAvailable: constraints.minutesPerDay,
    inputPreference: constraints.inputMode,
    scheduleConsiderations: constraints.scheduleNote
  };
}
