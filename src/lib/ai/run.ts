import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { createHash } from "crypto";
import type { z } from "zod";
import { getOpenAI } from "@/lib/openai";
import { AI_MODEL } from "@/lib/constants/ai";

export class AiError extends Error {
  constructor(public userMessage: string) {
    super(userMessage);
  }
}

// OpenAI wants a stable per-user identifier for abuse attribution — never the raw ID or email
export function hashUserId(userId: string): string {
  return createHash("sha256").update(userId).digest("hex");
}

// Maps any failure to a friendly message; raw OpenAI messages never reach the client
export function toAiErrorMessage(err: unknown): string {
  if (err instanceof AiError) return err.userMessage;
  if (err instanceof OpenAI.RateLimitError) return "AI is busy right now. Try again in a moment.";
  if (err instanceof OpenAI.APIConnectionError) return "Couldn't reach the AI service. Try again.";
  if (err instanceof OpenAI.APIError) return "AI request failed.";
  if (err instanceof Error && err.message === "OPENAI_API_KEY is not set") return "AI is not configured.";
  return "AI request failed.";
}

interface RunStructuredOptions<T extends z.ZodType> {
  schema: T;
  name: string;
  system: string;
  user: string;
  effort: "none" | "low";
  maxOutputTokens: number;
  userId: string;
}

// Shared structured-output call (Responses API); throws AiError for incomplete/empty output
export async function runStructured<T extends z.ZodType>(
  opts: RunStructuredOptions<T>
): Promise<z.infer<T>> {
  const res = await getOpenAI().responses.parse({
    model: AI_MODEL,
    input: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    text: { format: zodTextFormat(opts.schema, opts.name) },
    reasoning: { effort: opts.effort },
    max_output_tokens: opts.maxOutputTokens,
    safety_identifier: hashUserId(opts.userId),
  });

  if (res.status === "incomplete") {
    throw new AiError("The response was too long. Try shorter content.");
  }
  if (!res.output_parsed) {
    throw new AiError("AI couldn't process this item.");
  }
  return res.output_parsed as z.infer<T>;
}
