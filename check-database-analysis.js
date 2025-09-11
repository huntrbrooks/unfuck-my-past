// Script to check what's stored in the database after question generation
const { db, users } = require('./src/db/index.ts');
const { eq } = require('drizzle-orm');

async function checkUserAnalysis(userId) {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResult.length === 0) {
      console.log('User not found');
      return;
    }

    const user = userResult[0];
    const safetyData = typeof user.safety === 'string' ? JSON.parse(user.safety) : user.safety;
    
    console.log('=== USER ONBOARDING DATA ===');
    console.log('Tone:', user.tone);
    console.log('Voice:', user.voice);
    console.log('Depth:', user.depth);
    console.log('Engagement:', user.engagement);
    
    console.log('\n=== SAFETY DATA ===');
    console.log(JSON.stringify(safetyData, null, 2));
    
    if (safetyData.diagnosticAnalysis) {
      console.log('\n=== DIAGNOSTIC ANALYSIS ===');
      console.log('Focus Areas:', safetyData.diagnosticAnalysis.focusAreas);
      console.log('Communication Style:', safetyData.diagnosticAnalysis.communicationStyle);
      console.log('Intensity Level:', safetyData.diagnosticAnalysis.intensityLevel);
      console.log('Depth Level:', safetyData.diagnosticAnalysis.depthLevel);
      console.log('Question Count:', safetyData.diagnosticAnalysis.recommendedQuestionCount);
      console.log('Rationale:', safetyData.diagnosticAnalysis.rationale);
    }
    
    if (safetyData.personalizedQuestions) {
      console.log('\n=== GENERATED QUESTIONS ===');
      console.log(`Total questions: ${safetyData.personalizedQuestions.length}`);
      safetyData.personalizedQuestions.forEach((q, i) => {
        console.log(`\n${i + 1}. [${q.category}] ${q.question}`);
        if (q.followUp) console.log(`   Follow-up: ${q.followUp}`);
        console.log(`   AI Prompt: ${q.aiPrompt}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage: checkUserAnalysis('your-user-id-here')
console.log('To use this script, call: checkUserAnalysis("your-user-id-here")');

