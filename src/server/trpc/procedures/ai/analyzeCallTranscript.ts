import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

export const analyzeCallTranscript = baseProcedure
  .input(z.object({ transcript: z.string() }))
  .mutation(async ({ input }) => {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured.");
    }

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          sentiment: z.enum(["positive", "neutral", "negative"]),
          actionItems: z.array(z.string()),
          summary: z.string(),
        }),
        prompt: `Analyze the following call transcript from a professional cleaning service "LuxeClean". 
        Identify the overall sentiment, key action items (e.g. scheduling, follow-ups, complaints), and provide a short summary.
        
        Transcript:
        ${input.transcript}`,
      });

      return object;
    } catch (error) {
      console.error("AI analysis failed:", error);
      throw new Error("Failed to analyze transcript via AI.");
    }
  });
