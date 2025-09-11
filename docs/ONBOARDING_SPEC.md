# Onboarding Flow Spec (10-step)

Use this as the product copy and single source of truth for the flow. All copy is plain English, no jargon. Multi-select supported where noted.

## Steps overview
1. Consent & Safety (Required)
   - Fields: is18OrOver (Yes/No), crisisCheck (Yes/No), consentToProceed (Agree/Disagree), agreeDisclaimer (Agree/Disagree)
   - Helper: Confirms safe, ethical use. If under 18 or in crisis, show resources and exit.

2. Communication Fit
   - Tone (multi): Gentle, Direct, Coaching, Casual, Clinical, Spiritual
   - Guide Style (multi): Friend, Mentor, Therapist‑style, Coach
   - Guidance Strength (single): Mild, Moderate, Intense
   - Depth (single): Surface, Moderate, Deep, Profound
   - Helper: Drives language, rawness, interpretive risk.

3. Primary Focus Area (single, required)
   - Options: Sleep, Anxiety, Confidence, Relationships, Trauma‑processing, Habits/consistency, Purpose/direction, Money/behavior, Mood regulation, Addiction/compulsions
   - Helper: Seeds 3–8 adaptive questions.

4. Goals & Learning
   - Goals (multi): Healing, Growth, Self‑discovery, Trauma recovery, Relationships, Confidence, Peace, Purpose
   - Learning Style (multi): Text, Visual, Audio, Interactive
   - Engagement (single): Passive, Moderate, Active
   - Helper: Frames recommendations and cadence.

5. Constraints & Context
   - Time per day (single): 5, 15, 30, 60 minutes
   - Attention span (single): Micro (≤3 min), Short (3–10), Standard (10–20)
   - Input mode (single): Text, Voice, Either
   - Helper: Controls action length and UI.

6. Lived Context (optional)
   - Flags (multi): ADHD, ASD, PTSD, Depression, Anxiety, Chronic pain/illness, Meds, Substance recovery
   - Schedule note (free text ≤120 chars)
   - Helper: Tunes pacing, safety, and copy.

7. Current Baselines
   - Stress (0–10)
   - Sleep quality (0–10)
   - Rumination: Never, Monthly, Weekly, Few times/week, Daily
   - Helper: Anchors toxicity subscales and confidence.

8. Triggers & Boundaries
   - Topics to avoid (multi): Explicit trauma detail, Self‑harm content, Abuse narratives, Addiction content, Sexual content
   - Trigger words (free text, optional)
   - Helper: Safe personalization and tone guard.

9. Challenges
   - Multi: Stress/anxiety, Low confidence, Relationship struggles, Past trauma, Lack of purpose, Feeling stuck, Procrastination, Anger/irritability, Financial stress
   - Free text: Other
   - Helper: Weights toxicity subscales + adaptive Qs.

10. Final Personalisation
   - Long text prompt: “Anything else that will help tailor your plan? e.g., ‘short blunt advice’, ‘no fluff’, ‘I want accountability’.”
   - Toggles: anonymizedDataOK (Yes/No), exportPromiseShown (Yes/No)
   - Helper: Lets users steer outputs; covers privacy UX.

## Data model
See `src/onboarding/flow.json`. Each step contains fields with `multi: true|false`. Component normalizes output as:
- Arrays for multi-select fields
- Single strings for single-select fields
- Optional free text

## Analytics
Emit `onChange` per step and a final `onComplete(payload)` with the normalized object.

## Accessibility
- Real buttons with aria-pressed for toggles
- Step shows “Select one” or “Choose all that apply”
- Large hit areas (≥44px)
- Helper sentences at the top of steps

## Dev notes
- Tailwind classes included; uses existing card/progress layout
- Config driven; copy changes do not require code changes
- Consent/crisis step gates progression and shows resources when required
