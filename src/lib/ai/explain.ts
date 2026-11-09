import { AI_EXPLAIN_INPUT_CHARS, AI_EXPLAIN_MAX_LENGTH } from "@/lib/constants/ai";
import { buildItemMessage, ITEM_CONTENT_NOTICE } from "./prompt";

export const EXPLAIN_SYSTEM_PROMPT = `You explain code and terminal commands to a developer.
Write a concise explanation of about 200 to 300 words in markdown: first what the code does, then the key concepts or notable details. Use short paragraphs or bullet points, and inline code for identifiers. Do not repeat the whole code and do not wrap the answer in a code fence.
Use only the information provided; do not invent details.
${ITEM_CONTENT_NOTICE}`;

export interface ExplainSource {
  title?: string | null;
  content: string;
  language?: string | null;
  typeName: string;
}

// Builds the prompt: item type, language and title as context, the code as the body
export function buildExplainUserMessage(source: ExplainSource): string {
  return buildItemMessage(
    [
      ["Type", source.typeName],
      ["Language", source.language],
      ["Title", source.title],
    ],
    source.content,
    AI_EXPLAIN_INPUT_CHARS
  );
}

// Trims the markdown and caps its length as a guard against runaway output
export function postProcessExplanation(raw: string): string {
  const clean = raw.trim();
  if (clean.length <= AI_EXPLAIN_MAX_LENGTH) return clean;
  return `${clean.slice(0, AI_EXPLAIN_MAX_LENGTH - 1).trimEnd()}…`;
}
