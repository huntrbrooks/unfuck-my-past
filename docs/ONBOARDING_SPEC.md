# Onboarding Flow Spec

Use this as the product copy and the single source of truth for the flow.
All copy is plain English, no jargon, and supports multi select where noted.

## Steps overview
1. About You
   - Question: "How old are you? Pick the range your age fits into."
   - Single select: 18-25, 26-35, 36-45, 46-55, 56-65, 65+

2. How Should We Talk to You?
   Helper: "We want to make sure the way we guide you feels right. Choose what works best for you."
   - Communication Tone (multi select): Gentle, Direct, Coaching, Casual
   - Guide Style (multi select): Friend, Mentor, Therapist, Coach
   - Guidance Strength (single select): Mild, Moderate, Intense
   - Depth of Exploration (single select): Surface, Moderate, Deep, Profound

3. Your Goals
   Helper: "What do you want to get out of this program? Pick everything that applies."
   - Primary Goals (multi select):
     Healing, Growth, Self Discovery, Trauma Recovery, Relationships, Confidence, Peace, Purpose
   - Learning Style (multi select): Text, Visual, Audio, Interactive
   - Engagement Level (single select): Passive, Moderate, Active

4. Experience and Time
   Helper: "This helps us adjust the program to your background and schedule."
   - Experience Level (multi select): Beginner, Intermediate, Experienced
   - Time Commitment (multi select): 5 min, 15 min, 30 min, 60 min

5. Challenges (Optional)
   Helper: "What is your biggest challenge right now? Pick all that apply."
   Multi select: Stress or Anxiety, Lack of Confidence, Relationship Struggles, Past Trauma, Lack of Purpose, Feeling Stuck
   Free text: Other

6. Final Personalization
   Question: "Is there anything else you would like the AI to know about you, so it can personalize your journey more accurately?"
   Long text, optional. Placeholder examples provided in UI.

## Data model
See src/onboarding/flow.json for config. Each step contains fields with `multi: true|false`.
The component normalizes output as:
- Arrays for multi select fields
- Single strings for single select fields
- Optional free text

## Analytics
Emit `onChange` per step and a final `onComplete(payload)` with the full normalized object.

## Accessibility
- Buttons are real buttons with aria-pressed states for toggles
- Each step shows "Select one" or "Choose all that apply"
- Large hit areas, minimum 44px high
- Helper sentences at the top of steps 2 to 5

## Dev notes
- Tailwind classes are included
- Works without shadcn/ui, but will use it if Button/Card exist
- Config driven, so copy changes do not require code changes
