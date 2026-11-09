// Single place to switch models (e.g. fallback to "gpt-5.6-luna" if quality is poor)
export const AI_MODEL = "gpt-6-luna";

// Generic input cap shared by future AI features
export const AI_MAX_INPUT_CHARS = 8000;

// Auto-tagging
export const MAX_AI_TAGS = 5;
export const AI_TAG_MAX_LENGTH = 30;
export const AI_TAG_INPUT_CHARS = 2000;
export const AI_TAG_MAX_OUTPUT_TOKENS = 100;
export const AI_TAG_EFFORT = "low" as const;

// Description summary
export const AI_DESCRIPTION_INPUT_CHARS = 2000;
export const AI_DESCRIPTION_MAX_LENGTH = 300;
export const AI_DESCRIPTION_MAX_OUTPUT_TOKENS = 150;
export const AI_DESCRIPTION_EFFORT = "low" as const;

// Explain code (~200-300 words of markdown)
export const AI_EXPLAIN_INPUT_CHARS = 8000;
export const AI_EXPLAIN_MAX_LENGTH = 3000;
export const AI_EXPLAIN_MAX_OUTPUT_TOKENS = 700;
export const AI_EXPLAIN_EFFORT = "low" as const;

// Prompt optimizer (the rewritten prompt can be as long as the original)
export const AI_OPTIMIZE_INPUT_CHARS = 8000;
export const AI_OPTIMIZE_TOO_LONG_MESSAGE = `Prompt is too long to optimize (max ${AI_OPTIMIZE_INPUT_CHARS} characters).`;
export const AI_OPTIMIZE_MAX_LENGTH = 12_000;
export const AI_OPTIMIZE_MAX_OUTPUT_TOKENS = 3000;
export const AI_OPTIMIZE_EFFORT = "low" as const;

// Zod caps on client-supplied input to the AI actions
export const AI_TITLE_MAX_CHARS = 200;
export const AI_CONTENT_MAX_CHARS = 50_000;
