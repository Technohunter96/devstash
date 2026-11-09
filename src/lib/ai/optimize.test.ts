import { describe, it, expect } from "vitest";
import { buildOptimizeUserMessage, postProcessOptimizedPrompt } from "./optimize";
import { AI_OPTIMIZE_INPUT_CHARS, AI_OPTIMIZE_MAX_LENGTH } from "@/lib/constants/ai";

describe("buildOptimizeUserMessage", () => {
  it("wraps title and prompt in <item_content>", () => {
    expect(buildOptimizeUserMessage({ title: "Review", content: "check it" })).toBe(
      "<item_content>\nTitle: Review\n\ncheck it\n</item_content>"
    );
  });

  it("truncates a very long prompt", () => {
    const message = buildOptimizeUserMessage({ content: "a".repeat(AI_OPTIMIZE_INPUT_CHARS + 500) });
    expect(message).toContain("a".repeat(AI_OPTIMIZE_INPUT_CHARS));
    expect(message).not.toContain("a".repeat(AI_OPTIMIZE_INPUT_CHARS + 1));
  });
});

describe("postProcessOptimizedPrompt", () => {
  it("returns the trimmed rewrite when it changed", () => {
    expect(postProcessOptimizedPrompt({ changed: true, prompt: " better \n" }, "good")).toEqual({
      changed: true,
      prompt: "better",
    });
  });

  it("keeps the original when the AI says nothing changed", () => {
    expect(postProcessOptimizedPrompt({ changed: false, prompt: "other" }, "orig")).toEqual({
      changed: false,
      prompt: "orig",
    });
  });

  it("treats an identical rewrite as unchanged", () => {
    expect(postProcessOptimizedPrompt({ changed: true, prompt: " orig " }, "orig")).toEqual({
      changed: false,
      prompt: "orig",
    });
  });

  it("caps runaway output length", () => {
    const result = postProcessOptimizedPrompt({ changed: true, prompt: "x".repeat(AI_OPTIMIZE_MAX_LENGTH + 100) }, "orig");
    expect(result.prompt).toHaveLength(AI_OPTIMIZE_MAX_LENGTH);
  });
});
