### Unfuck My Past — AI Generation Flow (BOH)

This document maps every AI generation step, what data is sent, and which model is used (with fallbacks). File and function references point to this repo.

### High-level pipeline
- Onboarding → Analyze preferences → Generate question set
- Diagnostic answers → Per-question AI insights (stored)
- Preview (free) → Short, structured summary (schema-validated)
- Persona + Diagnostic Lite (optional) → Scores and mini-diagnostic
- Summary + Key Insights (teaser)
- Full Diagnostic (paid, structured 15 sections)
- 30‑Day Program → Analysis → Day-by-day content (30 days)
- Visuals → Behavioral Patterns image + Roadmap flow graph

### Step-by-step details

#### 1) Onboarding analysis and question generation
- Where: `src/lib/ai-onboarding-analyzer.ts`
- Calls:
  - `analyzeOnboardingData(onboardingData)` → analysis JSON
  - `generateQuestion(n, onboardingData, analysis)` → question JSON
- Data to AI (analysis):
```json
{
  "tone": "string",
  "voice": "string",
  "rawness": "string",
  "depth": "string",
  "learning": "string",
  "engagement": "string",
  "goals": ["string"],
  "experience": "string",
  "timeCommitment": "string",
  "safety": { "crisisSupport": true, "contentWarnings": false, "skipTriggers": false }
}
```
- Models: Primary GPT‑4; Fallback Claude‑3.5 Sonnet 20241022

#### 2) Per‑question diagnostic insight
- Where: `src/app/api/diagnostic/insight/route.ts` → `AIService.generateInsight`
- Data to AI:
```json
{
  "prompt": "Built from question + onboarding (basic or enhanced)",
  "userResponse": "free-text answer"
}
```
- Models: Primary Claude‑3.5 Sonnet 20241022; Fallback GPT‑4o‑mini
- Persists: `diagnosticResponses` with `insight`, `model`, `timestamp`

#### 3) Diagnostic preview (free, structured)
- Where: `src/app/api/diagnostic/preview/route.ts`
- Data to AI: onboarding (enhanced or basic), derived `levers` (tone, rawness, depth, minutesCap, primaryFocus), `questions`, `answers`, `miniSummaries`
- Schema: `PreviewSchema` (JSON only)
- Models: Primary GPT‑4; Fallback Claude‑3.5 Sonnet 20241022
- Fallback: Local structured preview builder

#### 4) Persona scores (optional)
- Where: `src/app/api/persona/route.ts`
- Data to AI: `{ onboarding, answers }` → strict JSON (six scores 0–10)
- Model: GPT‑4o‑mini; Fallback local deterministic scores

#### 5) Diagnostic Lite (optional)
- Where: `src/app/api/diagnostic-lite/route.ts`
- Data to AI: `{ onboarding, answers }` → strict JSON (colour profile, avoidance ladder, core blocker, activation kit)
- Model: GPT‑4o‑mini; Fallback local deterministic response

#### 6) Summary and Key Insights (teaser)
- Where: `src/app/api/diagnostic/summary/route.ts` → `AIService`
- Inputs: last 10 `{ question, response, insight }`, user preferences, optional HSI block
- Models:
  - Summary: Primary Claude‑3 Opus 20240229; Fallback GPT‑4o‑mini
  - Key Insights: Primary Claude‑3.5 Sonnet 20241022; Fallback GPT‑4o‑mini
- Persists to user `safety`: `diagnosticSummary`, `keyInsights`

#### 7) Full Diagnostic (paid, structured 15 sections)
- Where: `src/app/api/diagnostic/comprehensive-report/route.ts` → `AIService.generateStructuredFullReport`
- Data to AI (JSON mode):
  - `userPayload`: onboarding prefs, normalized responses, extracted "evidence" quotes, checklist
  - `structureWrapper`: section list, strict rules, caps
- Model: Primary GPT‑4o‑mini (response_format=json, repair pass on schema fail); Fallback Claude‑3 Opus 20240229
- Validates with `FullReportSchema`; formatted with `formatReportMarkdown`

#### 8) 30‑Day Program generation
- Where: `src/lib/ai-program-generator.ts`
- Analysis call:
  - Data: `userProfile`, `summary`, full list of `{ question, response, insight }`, optional `onboardingAnalysis`
  - Model: Primary GPT‑4; Fallback Claude‑3.5 Sonnet 20241022
- Daily content (30 calls):
  - Data: analysis output + `userProfile` + day specs (phase, focus, duration, difficulty)
  - Model: Primary GPT‑4; Fallback Claude‑3.5 Sonnet 20241022

#### 9) Behavioral Patterns image
- Where: `src/app/api/behavioral-image/route.ts`
- Data to AI:
```json
{
  "loops": [
    { "name": "string", "trigger": "string", "cycle": ["A","B","C"], "impact": "string", "breakPoint": { "fromState": "B", "action": "Exit step" } },
    { "name": "string", "trigger": "string", "cycle": ["A","B","C"], "impact": "string", "breakPoint": { "fromState": "B", "action": "Exit step" } }
  ],
  "palette": { "danger": "#ef4444", "neutral": "#64748b", "action": "#22c55e", "accent": "#6366f1" }
}
```
- Model: `gpt-image-1` (images/generations);
- Fallback: Local high‑quality SVG with same semantics

#### 10) Roadmap flow graph
- Where: `src/app/api/flow/route.ts`
- Data to AI: arbitrary body `{ topic, stages[] | seed }` → strict `FlowGraph` JSON (`title`, `nodes`, `edges`)
- Model: GPT‑4o‑mini (response_format=json); Fallback: Local flow from seed

### Structured utilities
- `src/lib/structured-ai.ts`: Day plans via `gpt-4o-2024-08-06` (JSON schema mode)
- `src/lib/structured-diagnostic-ai.ts`: Structured diagnostic via `gpt-4o-2024-08-06` (JSON schema mode)

### Quick reference table

| Step | File / Endpoint | Primary model | Fallback | Payload (essentials) |
|---|---|---|---|---|
| Onboarding analysis | `ai-onboarding-analyzer.ts` | GPT‑4 | Claude‑3.5 Sonnet | OnboardingData |
| Question generation | `ai-onboarding-analyzer.ts` | GPT‑4 | Claude‑3.5 Sonnet | Onboarding + analysis + index |
| Diagnostic insight | `/api/diagnostic/insight` | Claude‑3.5 Sonnet | GPT‑4o‑mini | Prompt + userResponse |
| Preview (free) | `/api/diagnostic/preview` | GPT‑4 | Claude‑3.5 Sonnet | onboarding, levers, Q/A, miniSummaries |
| Persona | `/api/persona` | GPT‑4o‑mini | Local | onboarding, answers |
| Diagnostic Lite | `/api/diagnostic-lite` | GPT‑4o‑mini | Local | onboarding, answers |
| Summary | `/api/diagnostic/summary` | Claude‑3 Opus | GPT‑4o‑mini | allResponses, prefs, HSI |
| Key insights | `/api/diagnostic/summary` | Claude‑3.5 Sonnet | GPT‑4o‑mini | allResponses, prefs, HSI |
| Full Diagnostic (15) | `/api/diagnostic/comprehensive-report` | GPT‑4o‑mini | Claude‑3 Opus | userPayload + structureWrapper |
| Program analysis | `ai-program-generator.ts` | GPT‑4 | Claude‑3.5 Sonnet | userProfile, summary, responses, onboardingAnalysis |
| Daily program x30 | `ai-program-generator.ts` | GPT‑4 | Claude‑3.5 Sonnet | analysis + userProfile + day specs |
| Behavioral image | `/api/behavioral-image` | gpt‑image‑1 | Local SVG | loops, palette |
| Roadmap flow | `/api/flow` | GPT‑4o‑mini | Local | seed → FlowGraph |

### Mermaid diagram

The diagram is stored as `docs/ai_flow.mmd`. Inline rendering:

```mermaid
flowchart LR
  subgraph Onboarding
    A[OnboardingData] --> B[Analyze Onboarding\nGPT-4 | Fallback: Claude 3.5]
    B --> C[Generate Questions\nGPT-4 | Fallback: Claude 3.5]
  end

  C --> D[User Answers]
  D --> E[Per-question Insight\nClaude 3.5 | Fallback: GPT-4o-mini]

  E --> F[Preview (Free, Structured)\nGPT-4 | Fallback: Claude 3.5]
  E --> G[Summary (Teaser)\nClaude 3 Opus | Fallback: GPT-4o-mini]
  E --> H[Key Insights\nClaude 3.5 | Fallback: GPT-4o-mini]

  E --> I[Full Diagnostic (15 sections)\nGPT-4o-mini | Fallback: Claude 3 Opus]
  I --> J[Program Analysis\nGPT-4 | Fallback: Claude 3.5]
  J --> K[Daily Plan x30\nGPT-4 | Fallback: Claude 3.5]

  I --> L[Behavioral Image\ngpt-image-1 | Fallback: Local SVG]
  I --> M[Roadmap Flow\nGPT-4o-mini | Fallback: Local]

  classDef openai fill:#143,stroke:#0a6,color:#eaffea;
  classDef claude fill:#2a2830,stroke:#8b5cf6,color:#ffffff;
  classDef local fill:#0b0b0c,stroke:#555,color:#ddd;

  class B,C,F,I,J,K,L,M openai;
  class E,G,H claude;
  class L,M local;
```


