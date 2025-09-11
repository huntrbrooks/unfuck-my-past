import { OnboardingPrefs } from "./types";

// Legacy onboarding data structure from the database
interface LegacyOnboardingData {
  tone?: string | string[];
  voice?: string | string[];
  rawness?: string | string[];
  depth?: string | string[];
  learning?: string | string[];
  engagement?: string | string[];
  safety?: {
    goals?: string[];
    experience?: string;
    timeCommitment?: string;
    crisisSupport?: boolean;
    contentWarnings?: boolean;
    skipTriggers?: boolean;
    primaryFocus?: string;
    timePerDay?: string;
    attentionSpan?: string;
    inputMode?: string;
    flags?: string[];
    scheduleNote?: string;
    stressLevel?: string;
    sleepQuality?: string;
    rumination?: string;
    topicsToAvoid?: string[];
    triggerWords?: string;
    challenges?: string[];
    challengeOther?: string;
    freeNote?: string;
    finalNote?: string;
    anonymizedDataOK?: boolean;
    exportPromiseShown?: boolean;
    preferredQuestionCount?: number;
  };
}

export function mapLegacyToOnboardingPrefs(legacy: LegacyOnboardingData): OnboardingPrefs {
  const safety = legacy.safety || {};
  
  // Helper function to ensure array format
  const toArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  // Helper function to get first value or default
  const getFirst = (value: string | string[] | undefined, defaultValue: string): string => {
    if (!value) return defaultValue;
    return Array.isArray(value) ? value[0] : value;
  };

  // Map time commitment to minutes
  const timeToMinutes = (timeCommitment?: string): 5|15|30|60 => {
    switch (timeCommitment) {
      case "5 minutes": return 5;
      case "15 minutes": return 15;
      case "30 minutes": return 30;
      case "60 minutes": return 60;
      default: return 15;
    }
  };

  // Map rumination scale to frequency
  const ruminationToFreq = (rumination?: string): "never" | "monthly" | "weekly" | "few times/week" | "daily" => {
    switch (rumination) {
      case "0": return "never";
      case "1": return "monthly";
      case "2": return "weekly";
      case "3": return "few times/week";
      case "4": return "daily";
      case "5": return "daily";
      default: return "weekly";
    }
  };

  // Map attention span
  const mapAttentionSpan = (span?: string): "micro" | "short" | "standard" => {
    switch (span) {
      case "Micro (≤3 min)": return "micro";
      case "Short (3–10)": return "short";
      case "Standard (10–20)": return "standard";
      default: return "short";
    }
  };

  // Map input mode
  const mapInputMode = (mode?: string): "text" | "voice" | "either" => {
    switch (mode) {
      case "Text": return "text";
      case "Voice": return "voice";
      case "Either": return "either";
      default: return "text";
    }
  };

  // Map primary focus
  const mapPrimaryFocus = (focus?: string): OnboardingPrefs["primaryFocus"] => {
    const focusMap: Record<string, OnboardingPrefs["primaryFocus"]> = {
      "Sleep": "sleep",
      "Anxiety": "anxiety", 
      "Confidence": "confidence",
      "Relationships": "relationships",
      "Trauma-processing": "trauma-processing",
      "Habits/consistency": "habits/consistency",
      "Purpose/direction": "purpose/direction",
      "Money/behavior": "money/behavior",
      "Mood regulation": "mood regulation",
      "Addiction/compulsions": "addiction/compulsions"
    };
    return focusMap[focus || ""] || "anxiety";
  };

  // Map learning styles
  const mapLearningStyles = (learning?: string | string[]): ("text"|"visual"|"audio"|"interactive")[] => {
    const styles = toArray(learning);
    const styleMap: Record<string, "text"|"visual"|"audio"|"interactive"> = {
      "Text": "text",
      "Visual": "visual", 
      "Audio": "audio",
      "Interactive": "interactive"
    };
    return styles.map(s => styleMap[s]).filter(Boolean);
  };

  return {
    tones: toArray(legacy.tone),
    guideStyles: toArray(legacy.voice),
    guidanceStrength: getFirst(legacy.rawness, "moderate") as "mild"|"moderate"|"intense",
    depth: getFirst(legacy.depth, "moderate") as "surface" | "moderate" | "deep" | "profound",
    primaryFocus: mapPrimaryFocus(safety.primaryFocus),
    goals: safety.goals || [],
    learningStyles: mapLearningStyles(legacy.learning),
    engagement: getFirst(legacy.engagement, "moderate") as "passive" | "moderate" | "active",
    minutesPerDay: timeToMinutes(safety.timePerDay || safety.timeCommitment),
    attentionSpan: mapAttentionSpan(safety.attentionSpan),
    inputMode: mapInputMode(safety.inputMode),
    flags: safety.flags || [],
    scheduleNote: safety.scheduleNote,
    stress0to10: parseInt(safety.stressLevel || "5"),
    sleep0to10: parseInt(safety.sleepQuality || "5"),
    ruminationFreq: ruminationToFreq(safety.rumination),
    topicsToAvoid: safety.topicsToAvoid || [],
    triggerWords: safety.triggerWords,
    challenges: safety.challenges || [],
    challengeOther: safety.challengeOther,
    freeform: safety.freeNote || safety.finalNote,
    anonymizedDataOK: safety.anonymizedDataOK || false,
    exportPromiseShown: safety.exportPromiseShown || false,
    crisisNow: safety.crisisSupport || false,
    preferredQuestionCount: safety.preferredQuestionCount
  };
}
