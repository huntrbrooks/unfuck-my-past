import OpenAI from "openai";
import { DiagnosticReportJsonSchema } from "./diagnostic-report-schema";
import { DiagnosticReport } from "@/types/diagnostic-report";

export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

export async function generateStructuredDiagnosticReport(input: string): Promise<DiagnosticReport> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06", // Use latest model with structured outputs
      messages: [
        {
          role: "system",
          content: `You are an AI that generates comprehensive diagnostic reports for trauma healing. 

CRITICAL REQUIREMENTS:
- Output ONLY valid JSON matching the DiagnosticReport schema
- No markdown, no prose, no explanations outside the JSON
- Use the brand voice: direct, honest, supportive but not clinical
- Avoid medical/clinical language - use terms like "patterns", "issues", "healing" not "diagnosis", "treatment", "therapy"
- Be specific and actionable in all recommendations
- Make toxicity scores realistic (most people are 4-7 range)
- Focus on empowerment and practical next steps
- Use language like "your shit", "baggage", "patterns" when appropriate
- Be brutally honest but supportive

BRAND VOICE EXAMPLES:
- "This pattern is keeping you stuck in the same bullshit cycle"
- "Your past doesn't get to run your life anymore"
- "Time to stop letting this baggage weigh you down"
- "You've got the strength to unfuck this situation"
- "Let's dig into what's really going on here"`
        },
        {
          role: "user", 
          content: input
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "DiagnosticReport",
          schema: DiagnosticReportJsonSchema,
          strict: true
        }
      },
      temperature: 0.7,
      max_tokens: 8000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    const parsed = JSON.parse(content);
    // Runtime validation with Zod
    const validated = DiagnosticReport.parse(parsed);
    return validated;

  } catch (error) {
    console.error("Failed to generate structured diagnostic report:", error);
    throw new Error(`Structured diagnostic generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateDiagnosticReport(obj: unknown): DiagnosticReport {
  return DiagnosticReport.parse(obj);
}

// Helper function to convert structured report back to legacy text format for existing UI
export function renderLegacyReportFromStructured(report: DiagnosticReport): string {
  const lines: string[] = [];

  // Executive Summary
  lines.push(`# ${report.executiveSummary.title}`);
  lines.push('');
  lines.push(report.executiveSummary.narrative);
  lines.push('');

  // Trauma Analysis
  lines.push(`# ${report.traumaAnalysis.title}`);
  lines.push('');
  lines.push('**Root Causes & Emotional Triggers:**');
  lines.push(report.traumaAnalysis.rootCauses);
  lines.push('');
  lines.push('**How Past Events Shaped Current Patterns:**');
  lines.push(report.traumaAnalysis.currentPatterns);
  lines.push('');
  lines.push('**Blind Spots or Unresolved Narratives:**');
  lines.push(report.traumaAnalysis.blindSpots);
  lines.push('');

  // Toxicity Score
  lines.push(`# ${report.toxicityScore.title}`);
  lines.push('');
  lines.push(`**Overall Toxicity Score: ${report.toxicityScore.overallScore}/10**`);
  lines.push(`**Confidence Rating: ${report.toxicityScore.confidenceRating}**`);
  lines.push('');
  lines.push('**Category Breakdown:**');
  lines.push(`• Self-Criticism: ${report.toxicityScore.breakdown.selfCriticism}/10`);
  lines.push(`• Avoidance: ${report.toxicityScore.breakdown.avoidance}/10`);
  lines.push(`• Anxiety: ${report.toxicityScore.breakdown.anxiety}/10`);
  lines.push(`• External Pressures: ${report.toxicityScore.breakdown.externalPressures}/10`);
  lines.push('');

  // Strengths
  lines.push(`# ${report.strengths.title}`);
  lines.push('');
  report.strengths.strengths.forEach((strength, index) => {
    lines.push(`**${index + 1}. ${strength.strength}**`);
    lines.push(`*Why it matters:* ${strength.whyItMatters}`);
    lines.push(`*How to apply:* ${strength.howToApply}`);
    lines.push('');
  });

  // Core Blocker
  lines.push(`# ${report.coreBlocker.title}`);
  lines.push('');
  lines.push(`**${report.coreBlocker.name}**`);
  lines.push('');
  lines.push('**Impact on Life Now:**');
  lines.push(report.coreBlocker.impactOnLife);
  lines.push('');
  lines.push('**First Step to Loosen Its Grip:**');
  lines.push(report.coreBlocker.firstStep);
  lines.push('');

  // Behavioral Patterns
  lines.push(`# ${report.behavioralPatterns.title}`);
  lines.push('');
  lines.push('**Recurring Loops:**');
  report.behavioralPatterns.recurringLoops.forEach((loop, index) => {
    lines.push(`**Loop ${index + 1}:**`);
    lines.push(`• Cause: ${loop.cause}`);
    lines.push(`• Effect: ${loop.effect}`);
    lines.push(`• Relapse: ${loop.relapse}`);
    lines.push('');
  });
  lines.push('**Key Leverage Point:**');
  lines.push(report.behavioralPatterns.leveragePoint);
  lines.push('');

  // Healing Roadmap
  lines.push(`# ${report.healingRoadmap.title}`);
  lines.push('');
  report.healingRoadmap.steps.forEach(step => {
    lines.push(`**Step ${step.stepNumber}: ${step.phase}** (${step.timeframe})`);
    lines.push(step.action);
    lines.push('');
  });

  // Actionable Recommendations
  lines.push(`# ${report.actionableRecommendations.title}`);
  lines.push('');
  report.actionableRecommendations.quickWins.forEach((win, index) => {
    lines.push(`**${index + 1}. ${win.action}** (${win.timeRequired})`);
    lines.push(`*Why it works:* ${win.whyItWorks}`);
    lines.push('');
  });

  // Resources
  lines.push(`# ${report.resources.title}`);
  lines.push('');
  lines.push('**Apps/Tools:**');
  report.resources.apps.forEach(app => {
    lines.push(`• **${app.name}**: ${app.purpose}`);
  });
  lines.push('');
  lines.push('**Books/Articles:**');
  report.resources.books.forEach(book => {
    lines.push(`• **${book.title}**: ${book.relevance}`);
  });
  lines.push('');
  lines.push('**Professional Help:**');
  lines.push(`**Recommended:** ${report.resources.professionalHelp.recommended ? 'Yes' : 'No'}`);
  lines.push(report.resources.professionalHelp.reasoning);
  lines.push('');

  return lines.join('\n');
}
