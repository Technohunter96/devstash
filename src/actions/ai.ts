"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { canUseAI } from "@/lib/usage-limits";
import { checkRateLimit, formatRetryTime } from "@/lib/rate-limit";
import { AiError, runStructured, toAiErrorMessage } from "@/lib/ai/run";
import { buildTagsUserMessage, postProcessTags, TAGS_SYSTEM_PROMPT } from "@/lib/ai/tags";
import {
  buildDescriptionUserMessage,
  DESCRIPTION_SYSTEM_PROMPT,
  hasDescriptionSource,
  postProcessDescription,
} from "@/lib/ai/description";
import {
  AI_CONTENT_MAX_CHARS,
  AI_DESCRIPTION_EFFORT,
  AI_DESCRIPTION_MAX_OUTPUT_TOKENS,
  AI_TAG_EFFORT,
  AI_TAG_MAX_OUTPUT_TOKENS,
  AI_TITLE_MAX_CHARS,
} from "@/lib/constants/ai";

type AiResult<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: string };

// What differs between AI features; everything else is the shared pipeline below
interface AiFeature<I extends z.ZodType, O extends z.ZodType, R> {
  name: string; // OpenAI schema name and log label
  inputSchema: I;
  outputSchema: O;
  system: string;
  effort: "none" | "low";
  maxOutputTokens: number;
  checkInput?: (input: z.infer<I>) => string | null; // extra rule beyond the schema; returns an error message
  buildMessage: (input: z.infer<I>) => string;
  toResult: (output: z.infer<O>, input: z.infer<I>) => R; // throw AiError if the output is unusable
}

// The one flow every AI action follows, top to bottom:
// 1. signed in  2. Pro  3. valid input  4. within rate limits  5. call OpenAI  6. clean the output
async function runAiAction<I extends z.ZodType, O extends z.ZodType, R>(
  feature: AiFeature<I, O, R>,
  rawInput: unknown
): Promise<AiResult<R>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  const gate = canUseAI(session.user.isPro);
  if (!gate.allowed) return { success: false, error: gate.reason };

  const parsed = feature.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input: z.infer<I> = parsed.data;
  const inputError = feature.checkInput?.(input);
  if (inputError) return { success: false, error: inputError };

  const burst = await checkRateLimit("ai", userId);
  const limit = burst.success ? await checkRateLimit("aiDaily", userId) : burst;
  if (!limit.success) {
    return {
      success: false,
      error: `Too many AI requests. Please try again in ${formatRetryTime(limit.retryAfter)}.`,
    };
  }

  try {
    const output = await runStructured({
      schema: feature.outputSchema,
      name: feature.name,
      system: feature.system,
      user: feature.buildMessage(input),
      effort: feature.effort,
      maxOutputTokens: feature.maxOutputTokens,
      userId,
    });
    return { success: true, data: feature.toResult(output, input) };
  } catch (err) {
    // Log error class only — never item content
    console.error(`[ai] ${feature.name} failed:`, err instanceof Error ? err.name : "unknown");
    return { success: false, error: toAiErrorMessage(err) };
  }
}

// ─── Suggest tags ────────────────────────────────────────────────────────────

// Same input from the New Item dialog and the drawer — the drawer sends its current (possibly unsaved) edit state
const SuggestTagsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(AI_TITLE_MAX_CHARS),
  content: z.string().max(AI_CONTENT_MAX_CHARS).nullable().optional(),
  language: z.string().max(50).nullable().optional(),
  typeName: z.string().min(1, "Type is required").max(50),
  existingTags: z.array(z.string().max(50)).max(50).optional(),
});

export async function suggestTags(input: unknown): Promise<AiResult<string[]>> {
  return runAiAction(
    {
      name: "tags",
      inputSchema: SuggestTagsSchema,
      outputSchema: z.object({ tags: z.array(z.string()) }),
      system: TAGS_SYSTEM_PROMPT,
      effort: AI_TAG_EFFORT,
      maxOutputTokens: AI_TAG_MAX_OUTPUT_TOKENS,
      buildMessage: (i) => buildTagsUserMessage(i.title, i.content ?? "", i.typeName, i.language),
      toResult: (out, i) => postProcessTags(out.tags, i.existingTags ?? []),
    },
    input
  );
}

// ─── Summarize description ───────────────────────────────────────────────────

// Everything is optional so the summary works from whatever the form currently holds; checkInput requires at least one source
const SummarizeDescriptionSchema = z.object({
  title: z.string().max(AI_TITLE_MAX_CHARS).nullable().optional(),
  content: z.string().max(AI_CONTENT_MAX_CHARS).nullable().optional(),
  url: z.string().max(2048).nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
  language: z.string().max(50).nullable().optional(),
  typeName: z.string().min(1, "Type is required").max(50),
  tags: z.array(z.string().max(50)).max(50).optional(),
});

export async function summarizeDescription(input: unknown): Promise<AiResult<string>> {
  return runAiAction(
    {
      name: "description",
      inputSchema: SummarizeDescriptionSchema,
      outputSchema: z.object({ description: z.string() }),
      system: DESCRIPTION_SYSTEM_PROMPT,
      effort: AI_DESCRIPTION_EFFORT,
      maxOutputTokens: AI_DESCRIPTION_MAX_OUTPUT_TOKENS,
      checkInput: (i) => (hasDescriptionSource(i) ? null : "Add a title or some content first."),
      buildMessage: buildDescriptionUserMessage,
      toResult: (out) => {
        const description = postProcessDescription(out.description);
        if (!description) throw new AiError("AI couldn't process this item.");
        return description;
      },
    },
    input
  );
}
