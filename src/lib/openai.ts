import OpenAI from "openai";

let client: OpenAI | null = null;

// Lazy singleton — a missing key only breaks AI actions, not the whole app or the build
export function getOpenAI(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  client = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 2 });
  return client;
}
