import { AIService } from './ai-service'

interface DiagnosticResponse {
  question: string
  response: string
  insight: string
  createdAt: Date
}

interface UserPreferences {
  tone: string
  voice: string
  rawness: string
  depth: string
  learning: string
  engagement: string
  goals?: string[]
  experience?: string
  timeCommitment?: string
}

export class ProgramGenerator {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  async generateProgram(
    responses: DiagnosticResponse[],
    userPreferences: UserPreferences
  ): Promise<string> {
    try {
      // Generate the overall program structure
      const structurePrompt = `Based on the following diagnostic responses and user preferences, create a comprehensive 30-day "Unfuck Your Life" healing program structure.

User Preferences: ${JSON.stringify(userPreferences)}

Diagnostic Responses:
${responses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Create a 30-day program overview with the following structure:

## 🎯 Program Overview
Brief introduction to the 30-day journey

## 📅 Daily Structure
Each day includes:
- **Guided Practice** (17 minutes total)
- **Daily Challenge** (15-20 minutes)
- **Journaling Prompt** (10-15 minutes)
- **Reflection** (10 minutes)
- **Weather & Environment considerations**
- **Sleep & Wellness recommendations**
- **Holistic Healing Bonus** (optional)

## 🗓️ Week 1: Foundation & Awareness (Days 1-7)
Focus on building awareness and establishing foundations

## 🗓️ Week 2: Deep Dive & Patterns (Days 8-14)
Explore deeper patterns and begin transformation

## 🗓️ Week 3: Integration & Practice (Days 15-21)
Integrate learnings and practice new behaviors

## 🗓️ Week 4: Mastery & Forward Movement (Days 22-30)
Master new skills and plan for continued growth

## 📚 Resources & Support
Additional resources, tools, and support systems

Use their preferred tone and voice throughout. Make it engaging, practical, and deeply transformative.`

      const structureResponse = await this.generateWithClaude(structurePrompt)
      
      // Enhance the structure with more detail
      const enhancementPrompt = `Take this 30-day program structure and enhance it with more detail and motivational content.

Original Structure:
${structureResponse.insight}

Enhance this program by:
1. Adding specific themes for each week
2. Including motivational quotes and affirmations
3. Adding progress tracking elements
4. Including safety notes and self-care reminders
5. Making it more engaging and interactive
6. Adding specific time estimates for each activity
7. Including alternative options for different energy levels
8. Adding celebration and reward suggestions

Keep the same structure but make it more detailed and actionable. Use their preferred tone and voice throughout.`

      const enhancedProgram = await this.generateWithOpenAI(enhancementPrompt)

      return enhancedProgram.insight

    } catch (error) {
      console.error('Error generating program:', error)
      
      // Fallback: Generate a basic program structure
      return this.generateFallbackProgram(userPreferences)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateFallbackProgram(_userPreferences: UserPreferences): string {
    return `# 🎯 30-Day "Unfuck Your Life" Healing Program

## Program Overview
This 30-day journey is designed to help you heal from past trauma, build resilience, and create lasting positive change in your life. Each day builds upon the previous, creating a comprehensive healing experience.

## 📅 Daily Structure
- **Morning Reflection** (5-10 minutes): Set intentions and check in with yourself
- **Daily Challenge** (15-30 minutes): Complete the day's main activity
- **Evening Integration** (5-10 minutes): Reflect on learnings and prepare for tomorrow
- **Journaling**: Write about your experiences and insights

## 🗓️ Week 1: Foundation & Awareness
**Day 1**: Self-Assessment & Intention Setting
**Day 2**: Understanding Your Story
**Day 3**: Identifying Triggers
**Day 4**: Building Self-Awareness
**Day 5**: Creating Safe Spaces
**Day 6**: Developing Self-Compassion
**Day 7**: Setting Boundaries

## 🗓️ Week 2: Deep Dive & Patterns
**Day 8**: Exploring Core Beliefs
**Day 9**: Understanding Trauma Responses
**Day 10**: Breaking Negative Patterns
**Day 11**: Building Emotional Intelligence
**Day 12**: Developing Resilience
**Day 13**: Creating New Narratives
**Day 14**: Practicing Forgiveness

## 🗓️ Week 3: Integration & Practice
**Day 15**: Implementing New Behaviors
**Day 16**: Building Healthy Relationships
**Day 17**: Managing Stress & Anxiety
**Day 18**: Developing Coping Strategies
**Day 19**: Building Confidence
**Day 20**: Creating Meaningful Goals
**Day 21**: Celebrating Progress

## 🗓️ Week 4: Mastery & Forward Movement
**Day 22**: Mastering New Skills
**Day 23**: Building Support Systems
**Day 24**: Creating Long-term Plans
**Day 25**: Developing Self-Care Routines
**Day 26**: Building Community
**Day 27**: Embracing Change
**Day 28**: Planning for Challenges
**Day 29**: Reflecting on Growth
**Day 30**: Creating Your Future

## 📚 Resources & Support
- Daily journaling prompts
- Meditation and mindfulness exercises
- Physical movement suggestions
- Community support recommendations
- Professional help resources

Remember: This is your journey. Take it at your own pace and be gentle with yourself throughout the process.`
  }

  private async generateWithClaude(prompt: string) {
    // Use the AIService with Claude
    return this.aiService.generateInsight(prompt, '', true)
  }

  private async generateWithOpenAI(prompt: string) {
    // Use the AIService with OpenAI
    return this.aiService.generateInsight(prompt, '', false)
  }

  async generateDailyContent(
    dayNumber: number,
    responses: DiagnosticResponse[],
    userPreferences: UserPreferences,
    weatherData?: { insight: { weatherSummary: string; activityRecommendations: string; environmentalAdaptations: string; seasonalPractices: string } }
  ): Promise<string> {
    try {
      // Define unique main focuses for each day
      const mainFocuses = [
        'Self-Awareness & Grounding', 'Boundary Setting', 'Emotional Regulation', 'Self-Compassion', 'Trust Building',
        'Inner Strength', 'Mindful Communication', 'Healing Past Wounds', 'Building Confidence', 'Stress Management',
        'Authentic Expression', 'Forgiveness Practice', 'Resilience Building', 'Joy & Play', 'Connection & Community',
        'Purpose Discovery', 'Fear Management', 'Gratitude Practice', 'Body Awareness', 'Mindful Decision Making',
        'Emotional Intelligence', 'Self-Care Mastery', 'Conflict Resolution', 'Growth Mindset', 'Inner Peace',
        'Leadership Skills', 'Adaptability', 'Future Planning', 'Integration & Celebration', 'Continued Growth'
      ]

      const mainFocus = mainFocuses[dayNumber - 1] || 'Personal Growth'

      const dailyPrompt = `Generate Day ${dayNumber} content for a 30-day healing program with the MAIN FOCUS: "${mainFocus}". Every activity, challenge, and reflection must relate to this main focus. Keep each section concise but complete.

User Preferences: ${JSON.stringify(userPreferences)}

Diagnostic Responses:
${responses.map((r, i) => `${i + 1}. Question: ${r.question}\n   Response: ${r.response}\n   Insight: ${r.insight}`).join('\n\n')}

Create content with this structure (NO markdown, use plain text headers exactly as shown, each header must appear once and only once, in this exact order). Do not merge sections. Do not omit headers:

🎯 MAIN FOCUS: ${mainFocus}
[Brief explanation of today's focus and why it matters for their healing journey]

🌅 GUIDED PRACTICE
Morning Intention Setting (5 minutes)
[Personalized intention related to ${mainFocus}]

Breathing Exercise (3 minutes)
[Simple breathing instructions]

Body Scan Meditation (7 minutes)
[Brief body scan guidance]

Affirmation Practice (2 minutes)
[2-3 personalized affirmations]

⚡ DAILY CHALLENGE
Main Activity (15-20 minutes)
[Personalized activity based on their responses]

Step-by-step instructions:
[3-4 clear steps]

Success indicators:
[2-3 specific indicators]

Energy Level Adaptations:
[Brief adaptations for low/medium/high energy]

📝 JOURNALING PROMPT
Primary Question:
[Personalized question]

Follow-up Questions:
[2-3 follow-up questions]

Emotional Check-in:
[Brief check-in format]

🌙 REFLECTION
Evening Review Questions:
[2-3 reflection questions]

Progress Acknowledgment:
[Brief acknowledgment]

Tomorrow's Preparation:
[2-3 preparation steps]

Self-Compassion Practice:
[Brief self-compassion guidance]

🌤️ WEATHER & ENVIRONMENT
${weatherData ? `Weather: ${weatherData.insight.weatherSummary || 'Check local conditions'}
Activities: ${weatherData.insight.activityRecommendations || 'Adapt to current weather'}` : `Assume location: Melbourne, Australia.
Weather: Cool, variable. Adapt activities to indoor or mild outdoor conditions.
Activities: Gentle walk if weather permits; otherwise indoor stretching and breathwork.`}

😴 SLEEP & WELLNESS
Sleep Duration: 7-9 hours
Pre-bedtime Routine:
[3-4 simple routine steps]

🌿 HOLISTIC HEALING BONUS
Optional Practice:
[1-2 simple holistic activities]

🛠️ TOOLS & RESOURCES
Recommended Tools:
[3-4 essential tools]

Keep each section brief but complete. Personalize based on their responses. Use their preferred tone.`

      const dailyContent = await this.aiService.generateInsight(dailyPrompt, '', true)
      return dailyContent.insight

    } catch (error) {
      console.error(`Error generating daily content for day ${dayNumber}:`, error)
      return this.generateFallbackDailyContent(dayNumber, weatherData)
    }
  }

  private generateFallbackDailyContent(dayNumber: number, weatherData?: { insight: { weatherSummary: string; activityRecommendations: string } }): string {
    return `🌅 GUIDED PRACTICE
Morning Intention Setting (5 minutes)
Find a quiet space and set an intention for today's healing work. Take 3 deep breaths and repeat your intention with conviction.

Breathing Exercise (3 minutes)
Practice 4-7-8 breathing: inhale for 4, hold for 7, exhale for 8. Focus on the rhythm and let tension go with each exhale.

Body Scan Meditation (7 minutes)
Start from your toes and work up to your head. Notice sensations without judgment and send love to each part of your body.

Affirmation Practice (2 minutes)
Choose one positive affirmation and repeat it with feeling. Visualize it becoming true in your life.

⚡ DAILY CHALLENGE
Main Activity (15-20 minutes)
Today's focus: Building self-awareness and compassion

Step-by-step instructions:
1. Find a comfortable, quiet space
2. Set a timer for 15-20 minutes
3. Practice the guided meditation above
4. Reflect on your experience
5. Note any insights or feelings that arise

Success indicators:
• You feel more centered and present
• You notice your thoughts without getting caught up in them
• You experience moments of peace or clarity

Energy Level Adaptations:
• Low Energy: Reduce time to 10 minutes
• High Energy: Add gentle movement or walking meditation
• Distracted: Use guided audio or focus on a single object

📝 JOURNALING PROMPT
Primary Question:
What did you discover about yourself during today's practice?

Follow-up Questions:
• How did your body feel during the meditation?
• What thoughts or emotions came up?
• What would you like to explore further?

Emotional Check-in:
• Rate your current emotional state (1-10)
• What's contributing to how you feel?
• What do you need right now?

Gratitude Practice:
• List 3 things you're grateful for today
• Include one thing about yourself you appreciate
• Express gratitude for your healing journey

🌙 REFLECTION
Evening Review Questions:
How did today's practice impact your day? What did you learn about yourself? What would you like to carry forward?

Progress Acknowledgment:
Celebrate showing up for yourself today. Acknowledge any insights or breakthroughs. Recognize your commitment to healing.

Tomorrow's Preparation:
Set an intention for tomorrow. Prepare your space and materials. Commit to continuing your practice.

Self-Compassion Practice:
Speak kindly to yourself about today's experience. Offer yourself the same compassion you'd give a friend. Remember that healing is a journey.

🌤️ WEATHER & ENVIRONMENT
${weatherData ? `Weather: ${weatherData.insight.weatherSummary || 'Check local conditions'}
Activities: ${weatherData.insight.activityRecommendations || 'Adapt to current weather'}` : 'Check local weather and adapt activities accordingly'}

😴 SLEEP & WELLNESS
Sleep Duration: 7-9 hours
Pre-bedtime Routine:
Gentle stretching, reading, journaling, and deep breathing exercises. Avoid screens 1 hour before bed.

🌿 HOLISTIC HEALING BONUS
Optional Practice:
Try a 10-minute gentle yoga sequence or progressive muscle relaxation. Use aromatherapy with calming essential oils.

🛠️ TOOLS & RESOURCES
Recommended Tools:
Journal, timer or meditation app, comfortable cushion, calming music, essential oils (optional), yoga mat.`
  }
}
