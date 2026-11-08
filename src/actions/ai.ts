"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { canUseAI } from "@/lib/usage-limits";
import { checkRateLimit, formatRetryTime } from "@/lib/rate-limit";
import { runStructured, toAiErrorMessage } from "@/lib/ai/run";
import { buildTagsUserMessage, postProcessTags, TAGS_SYSTEM_PROMPT } from "@/lib/ai/tags";
import {
  AI_CONTENT_MAX_CHARS,
  AI_TAG_EFFORT,
  AI_TAG_MAX_OUTPUT_TOKENS,
  AI_TITLE_MAX_CHARS,
} from "@/lib/constants/ai";

const TagsOutputSchema = z.object({ tags: z.array(z.string()) });

// Same input from the New Item dialog and the drawer — the drawer sends its current (possibly unsaved) edit state
const SuggestTagsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(AI_TITLE_MAX_CHARS),
  content: z.string().max(AI_CONTENT_MAX_CHARS).nullable().optional(),
  language: z.string().max(50).nullable().optional(),
  typeName: z.string().min(1, "Type is required").max(50),
  existingTags: z.array(z.string().max(50)).max(50).optional(),
});

type SuggestTagsResult =
  | { success: true; data: string[]; error?: undefined }
  | { success: false; data?: undefined; error: string };

export async function suggestTags(input: unknown): Promise<SuggestTagsResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const gate = canUseAI(session.user.isPro);
  if (!gate.allowed) {
    return { success: false, error: gate.reason };
  }

  const parsed = SuggestTagsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, content, language, typeName, existingTags } = parsed.data;

  const burst = await checkRateLimit("ai", userId);
  const limit = burst.success ? await checkRateLimit("aiDaily", userId) : burst;
  if (!limit.success) {
    return {
      success: false,
      error: `Too many AI requests. Please try again in ${formatRetryTime(limit.retryAfter)}.`,
    };
  }

  try {
    const result = await runStructured({
      schema: TagsOutputSchema,
      name: "tags",
      system: TAGS_SYSTEM_PROMPT,
      user: buildTagsUserMessage(title, content ?? "", typeName, language),
      effort: AI_TAG_EFFORT,
      maxOutputTokens: AI_TAG_MAX_OUTPUT_TOKENS,
      userId,
    });

    return { success: true, data: postProcessTags(result.tags, existingTags ?? []) };
  } catch (err) {
    // Log error class only — never item content
    console.error("[ai] suggestTags failed:", err instanceof Error ? err.name : "unknown");
    return { success: false, error: toAiErrorMessage(err) };
  }
}
