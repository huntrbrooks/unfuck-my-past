type Question = { 
  id: string; 
  prompt: string; 
  helper?: string;
  category?: string;
  followUp?: string;
};

export function seedAdaptiveQuestions(primaryFocus: string): Question[] {
  const base: Question[] = [
    { 
      id: "values_conflict", 
      prompt: "When you're off-routine, what story do you tell yourself about what that means?",
      category: "self-perception",
      followUp: "What would you tell a friend in the same situation?"
    },
    { 
      id: "ideal_outcome", 
      prompt: "If the next 30 days went unusually well in this area, what would be obviously different?",
      category: "vision",
      followUp: "What's the smallest sign that would tell you things are improving?"
    },
  ];

  const focusMap: Record<string, Question[]> = {
    "sleep": [
      { 
        id: "sleep_window", 
        prompt: "What time do you usually try to sleep and wake? How often does it slip?",
        category: "sleep/patterns",
        followUp: "What happens when your sleep schedule gets disrupted?"
      },
      { 
        id: "evening_triggers", 
        prompt: "What tends to keep you awake (thoughts, phone, caffeine, emotions)?",
        category: "sleep/barriers",
        followUp: "Which of these feels most within your control to change?"
      },
    ],
    
    "anxiety": [
      { 
        id: "body_signals", 
        prompt: "What's the first body sign you notice when anxiety rises?",
        category: "anxiety/somatic",
        followUp: "How do you usually respond when you notice this signal?"
      },
      { 
        id: "avoidance", 
        prompt: "What do you avoid to stop feeling anxious (people, tasks, places)?",
        category: "anxiety/avoidance",
        followUp: "What would you do if the anxiety wasn't there?"
      },
    ],
    
    "confidence": [
      {
        id: "confidence_moments",
        prompt: "Describe a recent moment when you felt genuinely confident. What was different about that situation?",
        category: "confidence/strengths",
        followUp: "How can you create more situations like this?"
      },
      {
        id: "self_doubt_patterns",
        prompt: "When does your inner critic get loudest? What does it usually say?",
        category: "confidence/blocks",
        followUp: "What would you say to a friend who had that same inner critic?"
      },
    ],
    
    "relationships": [
      { 
        id: "connection_patterns", 
        prompt: "Describe a recent conflict or distance. What did you need but not say?",
        category: "relationships/communication",
        followUp: "What would have happened if you had expressed that need?"
      },
      { 
        id: "boundaries", 
        prompt: "Where do you over-give or over-guard? What would balanced look like?",
        category: "relationships/boundaries",
        followUp: "What's the smallest boundary you could practice this week?"
      },
    ],
    
    "habits/consistency": [
      { 
        id: "streak_break", 
        prompt: "What typically breaks your streak? What happens immediately after?",
        category: "habits/obstacles",
        followUp: "How do you usually get back on track?"
      },
      { 
        id: "smallest_win", 
        prompt: "What is the smallest version of the habit you'd actually do daily?",
        category: "habits/sustainability",
        followUp: "What would make even that small version easier?"
      },
    ],
    
    "trauma-processing": [
      { 
        id: "safety_zone", 
        prompt: "What helps you feel safe when emotions surge?",
        category: "trauma/coping",
        followUp: "How can you make these safety tools more accessible?"
      },
      { 
        id: "memory_loop", 
        prompt: "Is there a recurring memory/theme? What belief about you sits under it?",
        category: "trauma/patterns",
        followUp: "What would you need to believe about yourself instead?"
      },
    ],
    
    "purpose/direction": [
      {
        id: "meaning_search",
        prompt: "When do you feel most like 'yourself'? What are you usually doing or thinking about?",
        category: "purpose/identity",
        followUp: "How can you bring more of that into your daily life?"
      },
      {
        id: "direction_blocks",
        prompt: "What stops you from pursuing what feels meaningful? What gets in the way?",
        category: "purpose/obstacles",
        followUp: "Which of these barriers feels most within your control?"
      },
    ],
    
    "mood regulation": [
      {
        id: "mood_triggers",
        prompt: "What tends to send your mood spiraling down? How quickly does it happen?",
        category: "mood/triggers",
        followUp: "What's the earliest warning sign you notice?"
      },
      {
        id: "mood_recovery",
        prompt: "What actually helps you feel better when you're down? Not what should work, but what does.",
        category: "mood/recovery",
        followUp: "How can you make these tools more accessible when you need them?"
      },
    ],
    
    "addiction/compulsions": [
      {
        id: "compulsion_cycle",
        prompt: "Walk me through what happens right before you engage in the behavior you want to change.",
        category: "addiction/triggers",
        followUp: "What would need to be different in that moment to choose differently?"
      },
      {
        id: "clean_periods",
        prompt: "When you've had periods of not doing this behavior, what was different? What supported that?",
        category: "addiction/recovery",
        followUp: "Which of those supporting factors could you recreate now?"
      },
    ],
  };

  return base.concat(focusMap[primaryFocus] ?? []);
}

// Helper function to determine question count based on onboarding data
export function calculateQuestionCount(onboarding: {
  engagement: string;
  minutesPerDay: number;
  depth: string;
  attentionSpan: string;
}): number {
  let count = 3; // minimum base

  // Engagement level
  if (onboarding.engagement === "active") count += 2;
  else if (onboarding.engagement === "moderate") count += 1;

  // Time commitment
  if (onboarding.minutesPerDay >= 30) count += 1;
  else if (onboarding.minutesPerDay >= 15) count += 0.5;

  // Depth preference
  if (onboarding.depth === "profound" || onboarding.depth === "deep") count += 1;

  // Attention span consideration
  if (onboarding.attentionSpan === "micro") count = Math.min(count, 4);

  return Math.min(Math.max(Math.round(count), 3), 8); // 3-8 questions max
}
