// Test script to verify onboarding mapping and question generation
const { mapLegacyToOnboardingPrefs } = require('./src/lib/diagnostic/mapper.ts');
const { generateDiagnosticQuestions } = require('./src/lib/diagnostic/generate.ts');

// Sample legacy onboarding data (like what's stored in your database)
const sampleLegacyData = {
  tone: ["gentle", "direct"],
  voice: ["coach", "friend"],
  rawness: "moderate",
  depth: "deep",
  learning: ["text", "visual"],
  engagement: "active",
  safety: {
    goals: ["growth", "confidence"],
    experience: "intermediate",
    timeCommitment: "15 minutes",
    primaryFocus: "habits/consistency",
    timePerDay: "15 minutes",
    attentionSpan: "Short (3–10)",
    inputMode: "Either",
    flags: ["ADHD"],
    scheduleNote: "Mornings work best",
    stressLevel: "7",
    sleepQuality: "4",
    rumination: "3", // few times/week
    topicsToAvoid: ["explicit trauma detail"],
    triggerWords: "worthless, failure",
    challenges: ["procrastination", "stress/anxiety"],
    challengeOther: "Sometimes overthinking",
    anonymizedDataOK: true,
    exportPromiseShown: true
  }
};

console.log('=== TESTING ONBOARDING MAPPING ===');
console.log('Original legacy data:');
console.log(JSON.stringify(sampleLegacyData, null, 2));

try {
  // Map to new format
  const mappedPrefs = mapLegacyToOnboardingPrefs(sampleLegacyData);
  console.log('\n=== MAPPED PREFERENCES ===');
  console.log(JSON.stringify(mappedPrefs, null, 2));

  // Generate questions
  const result = generateDiagnosticQuestions({ 
    onboarding: mappedPrefs,
    nowISO: new Date().toISOString()
  });

  console.log('\n=== GENERATED QUESTIONS ===');
  console.log(`Question count: ${result.count}`);
  console.log('Rationale:', result.rationale);
  
  console.log('\n=== QUESTIONS ===');
  result.questions.forEach((q, i) => {
    console.log(`\n${i + 1}. [${q.category}] ${q.prompt}`);
    if (q.helper) console.log(`   Helper: ${q.helper}`);
    console.log(`   Tags: ${q.tags.join(', ')}`);
  });

} catch (error) {
  console.error('Error:', error.message);
}

