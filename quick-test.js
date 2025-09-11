// Quick test to verify the new system is working
// Run this in your browser console on the diagnostic page

async function testNewQuestionSystem() {
  console.log('🧪 Testing new diagnostic question system...');
  
  try {
    // Fetch questions
    const response = await fetch('/api/diagnostic/questions');
    const data = await response.json();
    
    console.log('📊 API Response:', data);
    
    if (data.questions) {
      console.log(`✅ Generated ${data.questions.length} questions`);
      
      // Check for new system indicators
      if (data.analysis && data.analysis.rationale) {
        console.log('✅ New system detected - rationale present:', data.analysis.rationale);
      }
      
      // Check question quality
      data.questions.forEach((q, i) => {
        console.log(`\n${i + 1}. [${q.category}] ${q.question}`);
        if (q.followUp) console.log(`   Follow-up: ${q.followUp}`);
        if (q.aiPrompt) console.log(`   AI Prompt: ${q.aiPrompt}`);
      });
      
      // Check for personalization
      const hasFocusQuestions = data.questions.some(q => 
        q.category === 'plan' || q.category === 'trigger' || q.category === 'avoidance'
      );
      
      if (hasFocusQuestions) {
        console.log('✅ Focus-specific questions detected');
      }
      
    } else {
      console.log('❌ No questions found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testNewQuestionSystem();

