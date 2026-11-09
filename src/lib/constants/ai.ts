// Single place to switch models (e.g. fallback to "gpt-5.6-luna" if quality is poor)
export const AI_MODEL = "gpt-6-luna";

// Generic input cap shared by future AI features
export const AI_MAX_INPUT_CHARS = 8000;

// Auto-tagging
export const MAX_AI_TAGS = 5;
export const AI_TAG_MAX_LENGTH = 30;
export const AI_TAG_INPUT_CHARS = 2000;
export const AI_TAG_MAX_OUTPUT_TOKENS = 100;
export const AI_TAG_EFFORT = "none" as const;

// Description summary
export const AI_DESCRIPTION_INPUT_CHARS = 2000;
export const AI_DESCRIPTION_MAX_LENGTH = 300;
export const AI_DESCRIPTION_MAX_OUTPUT_TOKENS = 150;
export const AI_DESCRIPTION_EFFORT = "none" as const;

// Zod caps on client-supplied input to the AI actions
export const AI_TITLE_MAX_CHARS = 200;
export const AI_CONTENT_MAX_CHARS = 50_000;
