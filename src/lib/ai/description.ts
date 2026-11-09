import { AI_DESCRIPTION_INPUT_CHARS, AI_DESCRIPTION_MAX_LENGTH } from "@/lib/constants/ai";
import { buildItemMessage, ITEM_CONTENT_NOTICE } from "./prompt";

export const DESCRIPTION_SYSTEM_PROMPT = `You write the description for a developer's saved item (snippet, prompt, command, note, link, file or image).
Return a concise summary of 1 to 2 sentences that says what the item is and what it is for. Plain text only, no markdown, no quotes.
Use only the information provided; some fields may be missing, so do not invent details.
${ITEM_CONTENT_NOTICE}`;

export interface DescriptionSource {
  title?: string | null;
  content?: string | null;
  url?: string | null;
  fileName?: string | null;
  language?: string | null;
  typeName: string;
  tags?: string[];
}

// True when there is anything meaningful for the AI to summarise
export function hasDescriptionSource(source: DescriptionSource): boolean {
  return [source.title, source.content, source.url, source.fileName].some((v) => !!v?.trim());
}

// Builds the prompt from whatever fields are filled in; empty ones are skipped
export function buildDescriptionUserMessage(source: DescriptionSource): string {
  return buildItemMessage(
    [
      ["Type", source.typeName],
      ["Language", source.language],
      ["Title", source.title],
      ["URL", source.url],
      ["File name", source.fileName],
      ["Tags", source.tags?.join(", ")],
    ],
    source.content,
    AI_DESCRIPTION_INPUT_CHARS
  );
}

// Collapses whitespace so the result fits the single description field, and caps its length
export function postProcessDescription(raw: string): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (clean.length <= AI_DESCRIPTION_MAX_LENGTH) return clean;
  return `${clean.slice(0, AI_DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`;
}
