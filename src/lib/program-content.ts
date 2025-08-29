export interface ProgramDay {
  day: number
  title: string
  copyStraight: string
  copyGentle: string
  metadata: {
    category: 'awareness' | 'processing' | 'integration' | 'action'
    duration: number // minutes
    difficulty: 'easy' | 'moderate' | 'challenging'
    tools: string[]
  }
}

export const programDays: ProgramDay[] = [
  // Week 1: Awareness & Foundation
  {
    day: 1,
    title: "Meet Your Patterns",
    copyStraight: "Today we're going to identify the patterns that are keeping you stuck. No sugar coating - let's see what's really going on.",
    copyGentle: "Today we'll gently explore the patterns in your life. This is about understanding, not judging yourself.",
    metadata: {
      category: 'awareness',
      duration: 15,
      difficulty: 'easy',
      tools: ['journaling', 'reflection']
    }
  },
  {
    day: 2,
    title: "Your Trauma Timeline",
    copyStraight: "Time to map out the shit that happened to you. We need to see the full picture to understand why you're reacting the way you are.",
    copyGentle: "Let's create a timeline of significant events in your life. This helps us understand how your experiences shaped you.",
    metadata: {
      category: 'awareness',
      duration: 20,
      difficulty: 'moderate',
      tools: ['timeline', 'journaling']
    }
  },
  {
    day: 3,
    title: "The Stories You Tell Yourself",
    copyStraight: "You've been telling yourself the same bullshit stories for years. Let's identify them and start questioning if they're actually true.",
    copyGentle: "We all have stories we tell ourselves about who we are. Let's explore these narratives with curiosity and compassion.",
    metadata: {
      category: 'awareness',
      duration: 15,
      difficulty: 'moderate',
      tools: ['reflection', 'journaling']
    }
  },
  {
    day: 4,
    title: "Your Triggers & Reactions",
    copyStraight: "What sets you off? And how do you react? This is crucial intel for taking back control of your responses.",
    copyGentle: "Understanding what triggers us and how we respond is the first step toward choosing different reactions.",
    metadata: {
      category: 'awareness',
      duration: 15,
      difficulty: 'moderate',
      tools: ['trigger-mapping', 'self-observation']
    }
  },
  {
    day: 5,
    title: "Your Coping Mechanisms",
    copyStraight: "Let's be honest about how you're coping. Some of this shit is probably making things worse, not better.",
    copyGentle: "We all have ways of coping with difficult emotions. Let's explore yours with kindness and see what's serving you.",
    metadata: {
      category: 'awareness',
      duration: 15,
      difficulty: 'easy',
      tools: ['self-assessment', 'reflection']
    }
  },
  {
    day: 6,
    title: "Your Values & What Matters",
    copyStraight: "What the fuck do you actually care about? Because if you're not living by your values, that's why you feel lost.",
    copyGentle: "Our values guide us toward what truly matters. Let's discover what's most important to you.",
    metadata: {
      category: 'awareness',
      duration: 20,
      difficulty: 'easy',
      tools: ['values-clarification', 'reflection']
    }
  },
  {
    day: 7,
    title: "Week 1 Integration",
    copyStraight: "Time to put it all together. What patterns are you seeing? What's the bigger picture here?",
    copyGentle: "Let's reflect on what we've discovered this week and how it all connects together.",
    metadata: {
      category: 'integration',
      duration: 25,
      difficulty: 'moderate',
      tools: ['integration', 'reflection']
    }
  },

  // Week 2: Processing & Understanding
  {
    day: 8,
    title: "The Science of Your Brain",
    copyStraight: "Your brain is literally wired for survival, not happiness. Understanding this explains a lot of your reactions.",
    copyGentle: "Our brains are amazing survival machines. Understanding how they work helps us be kinder to ourselves.",
    metadata: {
      category: 'processing',
      duration: 15,
      difficulty: 'easy',
      tools: ['education', 'reflection']
    }
  },
  {
    day: 9,
    title: "Your Nervous System",
    copyStraight: "Your nervous system is probably stuck in fight-or-flight mode. That's why you're always on edge.",
    copyGentle: "Our nervous system responds to stress in ways that can keep us feeling unsafe. Let's understand this better.",
    metadata: {
      category: 'processing',
      duration: 15,
      difficulty: 'easy',
      tools: ['education', 'body-awareness']
    }
  },
  {
    day: 10,
    title: "The Impact of Trauma",
    copyStraight: "Trauma changes your brain, your body, and your behavior. This isn't your fault, but it is your responsibility to heal.",
    copyGentle: "Trauma affects us in many ways. Understanding this helps us be more compassionate with ourselves.",
    metadata: {
      category: 'processing',
      duration: 20,
      difficulty: 'moderate',
      tools: ['education', 'self-compassion']
    }
  },
  {
    day: 11,
    title: "Your Attachment Style",
    copyStraight: "How you relate to people is probably fucked up from your early experiences. Let's figure out what's going on.",
    copyGentle: "Our early relationships shape how we connect with others. Understanding this can help us build better relationships.",
    metadata: {
      category: 'processing',
      duration: 20,
      difficulty: 'moderate',
      tools: ['assessment', 'reflection']
    }
  },
  {
    day: 12,
    title: "Your Defense Mechanisms",
    copyStraight: "You've got defense mechanisms that were useful once but are now holding you back. Time to see them clearly.",
    copyGentle: "We all have ways of protecting ourselves. Some of these patterns may no longer serve us.",
    metadata: {
      category: 'processing',
      duration: 15,
      difficulty: 'moderate',
      tools: ['self-reflection', 'pattern-recognition']
    }
  },
  {
    day: 13,
    title: "Your Emotional Patterns",
    copyStraight: "Your emotions are probably all over the place or completely shut down. Let's understand why and how to regulate them.",
    copyGentle: "Understanding our emotional patterns helps us respond to feelings in healthier ways.",
    metadata: {
      category: 'processing',
      duration: 20,
      difficulty: 'moderate',
      tools: ['emotional-awareness', 'regulation-techniques']
    }
  },
  {
    day: 14,
    title: "Week 2 Integration",
    copyStraight: "Now you understand why you're the way you are. This isn't an excuse - it's the foundation for change.",
    copyGentle: "Understanding ourselves better helps us make more conscious choices about how we want to be.",
    metadata: {
      category: 'integration',
      duration: 25,
      difficulty: 'moderate',
      tools: ['integration', 'reflection']
    }
  },

  // Week 3: Integration & Skills
  {
    day: 15,
    title: "Grounding Techniques",
    copyStraight: "When you're spiraling, you need tools to get back to reality. These grounding techniques will save your ass.",
    copyGentle: "Grounding techniques help us stay present when we're feeling overwhelmed or disconnected.",
    metadata: {
      category: 'integration',
      duration: 20,
      difficulty: 'easy',
      tools: ['breathing', 'sensory-awareness', 'movement']
    }
  },
  {
    day: 16,
    title: "Emotional Regulation",
    copyStraight: "Your emotions don't have to control you. Learn to ride the wave instead of getting swept away.",
    copyGentle: "Learning to regulate our emotions helps us respond to life's challenges with more balance.",
    metadata: {
      category: 'integration',
      duration: 20,
      difficulty: 'moderate',
      tools: ['mindfulness', 'self-soothing', 'reframing']
    }
  },
  {
    day: 17,
    title: "Boundary Setting",
    copyStraight: "You probably suck at boundaries. That's why people walk all over you. Time to learn how to say no.",
    copyGentle: "Healthy boundaries help us protect our energy and maintain healthy relationships.",
    metadata: {
      category: 'integration',
      duration: 25,
      difficulty: 'challenging',
      tools: ['communication', 'self-advocacy', 'practice']
    }
  },
  {
    day: 18,
    title: "Self-Compassion",
    copyStraight: "You're probably your own worst enemy. Time to learn how to be kind to yourself instead of beating yourself up.",
    copyGentle: "Self-compassion is treating ourselves with the same kindness we'd offer a good friend.",
    metadata: {
      category: 'integration',
      duration: 20,
      difficulty: 'moderate',
      tools: ['self-compassion', 'mindfulness', 'reflection']
    }
  },
  {
    day: 19,
    title: "Cognitive Reframing",
    copyStraight: "Your thoughts are probably fucked up and making everything worse. Learn to challenge and reframe them.",
    copyGentle: "Our thoughts influence our feelings and actions. Learning to reframe unhelpful thoughts can change everything.",
    metadata: {
      category: 'integration',
      duration: 20,
      difficulty: 'moderate',
      tools: ['cognitive-restructuring', 'thought-records']
    }
  },
  {
    day: 20,
    title: "Mindfulness & Presence",
    copyStraight: "You're probably living in the past or future, not the present. That's why you're missing your life.",
    copyGentle: "Mindfulness helps us be more present and engaged with our lives as they're happening.",
    metadata: {
      category: 'integration',
      duration: 15,
      difficulty: 'easy',
      tools: ['meditation', 'mindful-movement', 'awareness']
    }
  },
  {
    day: 21,
    title: "Week 3 Integration",
    copyStraight: "You've got tools now. The question is: are you going to use them or keep doing the same shit?",
    copyGentle: "We've learned many helpful tools this week. Practice makes them more natural and effective.",
    metadata: {
      category: 'integration',
      duration: 25,
      difficulty: 'moderate',
      tools: ['integration', 'practice', 'reflection']
    }
  },

  // Week 4: Action & Transformation
  {
    day: 22,
    title: "Your Action Plan",
    copyStraight: "Now it's time to actually do something different. What specific actions are you going to take?",
    copyGentle: "Understanding ourselves is the first step. Now let's create a plan for positive change.",
    metadata: {
      category: 'action',
      duration: 30,
      difficulty: 'moderate',
      tools: ['goal-setting', 'planning', 'commitment']
    }
  },
  {
    day: 23,
    title: "Facing Your Fears",
    copyStraight: "You've been avoiding the things that scare you. That's why you're stuck. Time to face them head-on.",
    copyGentle: "Growth often requires us to step outside our comfort zones. Let's approach this with courage and support.",
    metadata: {
      category: 'action',
      duration: 25,
      difficulty: 'challenging',
      tools: ['exposure', 'courage', 'support']
    }
  },
  {
    day: 24,
    title: "Building New Habits",
    copyStraight: "Your old habits got you here. New habits will get you where you want to go. Start building them now.",
    copyGentle: "Small, consistent actions create lasting change. Let's build habits that support your growth.",
    metadata: {
      category: 'action',
      duration: 20,
      difficulty: 'moderate',
      tools: ['habit-formation', 'consistency', 'tracking']
    }
  },
  {
    day: 25,
    title: "Relationship Repair",
    copyStraight: "Your relationships are probably messed up from your patterns. Time to start fixing them.",
    copyGentle: "Our healing journey often involves repairing and strengthening our relationships.",
    metadata: {
      category: 'action',
      duration: 30,
      difficulty: 'challenging',
      tools: ['communication', 'forgiveness', 'boundaries']
    }
  },
  {
    day: 26,
    title: "Creating Your Future",
    copyStraight: "Stop living in the past. Start creating the future you actually want. What does that look like?",
    copyGentle: "We have the power to create the life we want. Let's envision and plan for your ideal future.",
    metadata: {
      category: 'action',
      duration: 25,
      difficulty: 'moderate',
      tools: ['visioning', 'planning', 'goal-setting']
    }
  },
  {
    day: 27,
    title: "Your Support System",
    copyStraight: "You can't do this alone. Who's got your back? And who do you need to let go of?",
    copyGentle: "A strong support system is essential for healing and growth. Let's identify who supports your journey.",
    metadata: {
      category: 'action',
      duration: 20,
      difficulty: 'moderate',
      tools: ['relationship-assessment', 'boundary-setting']
    }
  },
  {
    day: 28,
    title: "Maintaining Progress",
    copyStraight: "This isn't a one-time fix. You need to keep doing the work. How are you going to stay on track?",
    copyGentle: "Healing is an ongoing journey. Let's create a plan to maintain your progress and continue growing.",
    metadata: {
      category: 'action',
      duration: 25,
      difficulty: 'moderate',
      tools: ['maintenance-planning', 'self-monitoring']
    }
  },
  {
    day: 29,
    title: "Celebrating Growth",
    copyStraight: "You've done some serious work. Take a minute to acknowledge how far you've come.",
    copyGentle: "Every step forward is worth celebrating. Let's acknowledge your courage and progress.",
    metadata: {
      category: 'integration',
      duration: 20,
      difficulty: 'easy',
      tools: ['celebration', 'gratitude', 'reflection']
    }
  },
  {
    day: 30,
    title: "Your New Beginning",
    copyStraight: "This is just the beginning. You've got the tools, the understanding, and the momentum. Keep going.",
    copyGentle: "This journey has given you a strong foundation. You're ready to continue growing and healing.",
    metadata: {
      category: 'integration',
      duration: 30,
      difficulty: 'easy',
      tools: ['reflection', 'planning', 'commitment']
    }
  }
]

export function getProgramDay(day: number, userTone: string = 'gentle'): ProgramDay | null {
  const programDay = programDays.find(d => d.day === day)
  if (!programDay) return null
  
  return {
    ...programDay,
    copyStraight: userTone === 'raw' ? programDay.copyStraight : programDay.copyGentle
  }
}

export function getProgramProgress(userId: string, completedDays: number[]): {
  completed: number
  total: number
  percentage: number
  currentDay: number
  streak: number
} {
  const total = 30
  const completed = completedDays.length
  const percentage = Math.round((completed / total) * 100)
  
  // Find current day (next uncompleted day)
  const currentDay = completedDays.length > 0 
    ? Math.max(...completedDays) + 1 
    : 1
  
  // Calculate streak (consecutive days completed)
  let streak = 0
  for (let i = 1; i <= 30; i++) {
    if (completedDays.includes(i)) {
      streak++
    } else {
      break
    }
  }
  
  return {
    completed,
    total,
    percentage,
    currentDay: currentDay > 30 ? 30 : currentDay,
    streak
  }
}
