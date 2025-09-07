import OpenAI from "openai";
import { DayPlanJsonSchema } from "./day-plan-schema";
import { DayPlan } from "@/types/day-plan";

export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

export async function generateStructuredDayPlan(input: string): Promise<DayPlan> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06", // Use latest model with structured outputs
      messages: [
        {
          role: "system",
          content: "You are an AI that generates structured daily healing plans. Output ONLY valid JSON matching the DayPlan schema. No markdown, no prose, no explanations."
        },
        {
          role: "user", 
          content: input
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "DayPlan",
          schema: DayPlanJsonSchema,
          strict: true
        }
      },
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    const parsed = JSON.parse(content);
    // Runtime validation with Zod
    const validated = DayPlan.parse(parsed);
    return validated;

  } catch (error) {
    console.error("Failed to generate structured day plan:", error);
    throw new Error(`Structured generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateDayPlan(obj: unknown): DayPlan {
  return DayPlan.parse(obj);
}
