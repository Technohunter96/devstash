import { AI_TAG_INPUT_CHARS, AI_TAG_MAX_LENGTH, MAX_AI_TAGS } from "@/lib/constants/ai";
import { buildItemMessage, ITEM_CONTENT_NOTICE } from "./prompt";

// Even schema-valid output is normalised so it can go straight into the comma-separated tags field
export function postProcessTags(raw: string[], existingTags: string[]): string[] {
  const existing = new Set(existingTags.map((t) => t.trim().toLowerCase()));
  const result: string[] = [];

  for (const tag of raw) {
    const clean = tag.trim().toLowerCase().replace(/,/g, "");
    if (!clean || clean.length > AI_TAG_MAX_LENGTH) continue;
    if (existing.has(clean) || result.includes(clean)) continue;
    result.push(clean);
    if (result.length === MAX_AI_TAGS) break;
  }

  return result;
}

export function parseTagString(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// Adds one accepted tag to the comma-separated field; skips it if already present
export function mergeTag(current: string, tag: string): string {
  const tags = parseTagString(current);
  if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return tags.join(", ");
  return [...tags, tag].join(", ");
}

export const TAGS_SYSTEM_PROMPT = `You suggest tags for a developer's saved item (snippet, prompt, command, note or link).
Return 3 to ${MAX_AI_TAGS} short, lowercase, freeform tags describing the topic, language or purpose.
${ITEM_CONTENT_NOTICE}`;

export function buildTagsUserMessage(
  title: string,
  content: string,
  typeName: string,
  language?: string | null
): string {
  return buildItemMessage(
    [["Type", typeName], ["Language", language], ["Title", title]],
    content,
    AI_TAG_INPUT_CHARS
  );
}
