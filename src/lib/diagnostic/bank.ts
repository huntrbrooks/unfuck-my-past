import { QuestionTemplate } from "./types";

// 2 universal starters
export const UNIVERSAL: QuestionTemplate[] = [
  {
    id: "values_conflict",
    category: "belief",
    base: "When you fall off track, what story do you tell yourself about what that means?",
    helper: "Use real words you hear in your head.",
    tags: ["identity","self-talk"],
    risk: "low",
    stock: true
  },
  {
    id: "ideal_outcome_30d",
    category: "goal",
    base: "If the next 30 days went unusually well in this area, what would be obviously different?",
    helper: "Think visible changes others could notice too.",
    tags: ["vision","concrete"],
    risk: "low",
    stock: true
  }
];

// Focus-specific templates
export const FOCUS_BANK: Record<string, QuestionTemplate[]> = {
  "sleep": [
    { id:"sleep_window", category:"plan",
      base:"What time do you usually try to sleep and wake, and how often does it slip?",
      helper:"Include work or social patterns that push it later.",
      tags:["rhythm","consistency"], risk:"low"
    },
    { id:"evening_triggers", category:"trigger",
      base:"What tends to keep you awake most nights?",
      helper:"Thought loops, phone, caffeine, noise, emotions.",
      tags:["stimuli","rumination"], risk:"low"
    },
    { id:"morning_consequence", category:"narrative",
      base:"Describe how a short sleep night changes your next morning choices.",
      tags:["knock-on","habit-break"], risk:"low"
    },
    { id:"sleep_belief", category:"belief",
      base:"What belief do you hold about rest that makes it hard to prioritize sleep?",
      tags:["beliefs","rest"], risk:"med"
    }
  ],

  "anxiety": [
    { id:"body_signal", category:"body",
      base:"What is the first body signal you notice when anxiety rises?",
      helper:"Location, sensation, intensity, speed.",
      tags:["somatic","awareness"], risk:"low"
    },
    { id:"avoidance_anx", category:"avoidance",
      base:"What do you avoid to stop feeling anxious?",
      helper:"People, tasks, places, decisions.",
      tags:["avoidance"], risk:"low"
    },
    { id:"catastrophe_line", category:"belief",
      base:"When anxiety peaks, what is the scary line your mind tends to say?",
      tags:["catastrophizing"], risk:"med"
    }
  ],

  "relationships": [
    { id:"recent_conflict", category:"narrative",
      base:"Describe a recent conflict or distance. What did you need that you didn't say?",
      tags:["communication","needs"], risk:"med"
    },
    { id:"boundary_pattern", category:"belief",
      base:"Where do you over-give or over-guard, and what belief justifies it?",
      tags:["boundaries"], risk:"med"
    }
  ],

  "habits/consistency": [
    { id:"streak_break", category:"trigger",
      base:"What typically breaks your streak, and what happens in the hour after?",
      tags:["relapse","chain-break"], risk:"low"
    },
    { id:"smallest_win", category:"plan",
      base:"What is the smallest version of the habit you would actually do daily?",
      tags:["micro-habit"], risk:"low"
    },
    { id:"perfection_belief", category:"belief",
      base:"Finish the sentence: If I can't do it perfectly, then ______.",
      tags:["perfectionism"], risk:"med"
    }
  ],

  "trauma-processing": [
    { id:"safety_zone", category:"values",
      base:"What helps you feel safe when emotions surge?",
      tags:["resources","grounding"], risk:"med"
    },
    { id:"memory_loop", category:"narrative",
      base:"Is there a recurring memory or theme that shows up? What belief about you sits under it?",
      tags:["trauma-theme"], risk:"high", forbiddenIf:["explicit trauma detail"]
    }
  ],

  "purpose/direction": [
    { id:"pull_vs_push", category:"values",
      base:"What activities feel like a pull rather than a push, and what do they give you?",
      tags:["intrinsic","values"], risk:"low"
    },
    { id:"misaligned_tasks", category:"avoidance",
      base:"What do you keep saying yes to that drains you, and why do you keep saying yes?",
      tags:["people-pleasing"], risk:"med"
    }
  ],

  "money/behavior": [
    { id:"money_trigger", category:"trigger",
      base:"What situations trigger the impulse spends or avoidance of bills?",
      tags:["triggers"], risk:"low"
    },
    { id:"money_story", category:"belief",
      base:"What story about money did you pick up growing up that still drives choices?",
      tags:["upbringing"], risk:"med"
    }
  ],

  "mood regulation": [
    { id:"mood_rhythm", category:"narrative",
      base:"Describe your usual mood rhythm across a week. When are dips most likely?",
      tags:["pattern"], risk:"low"
    },
    { id:"regulation_tool", category:"plan",
      base:"What quick tools help you regulate in 5 minutes or less?",
      tags:["tools"], risk:"low"
    }
  ],

  "addiction/compulsions": [
    { id:"urge_pattern", category:"trigger",
      base:"When does the urge usually show up and what precedes it?",
      tags:["urge","trigger"], risk:"med", forbiddenIf:["explicit substance detail"]
    },
    { id:"harm_reduction", category:"plan",
      base:"If total abstinence feels unrealistic now, what would safer use or an interrupt look like?",
      tags:["harm-reduction"], risk:"med"
    }
  ]
};

// Challenge add-ons, optional
export const CHALLENGE_BANK: Record<string, QuestionTemplate[]> = {
  "stress/anxiety": [
    { id:"stress_load", category:"narrative",
      base:"What are the top two sources of stress this week and what is within your control in each?",
      tags:["locus-of-control"], risk:"low"
    }
  ],
  "procrastination": [
    { id:"delay_loop", category:"avoidance",
      base:"What do you do in the first 10 minutes of a delay, and what is the payoff your brain gets?",
      tags:["reward"], risk:"low"
    }
  ],
  "low confidence": [
    { id:"competence_gap", category:"belief",
      base:"Where are you competent but refuse to see it, and what evidence are you ignoring?",
      tags:["reframing"], risk:"low"
    }
  ],
  "anger/irritability": [
    { id:"anger_under", category:"belief",
      base:"When anger flares, what softer feeling is usually underneath?",
      tags:["secondary-emotion"], risk:"med"
    }
  ],
  "financial stress": [
    { id:"bill_fear", category:"trigger",
      base:"Which bill or task do you avoid most and what would a 5-minute first step be?",
      tags:["first-step"], risk:"low"
    }
  ]
};

