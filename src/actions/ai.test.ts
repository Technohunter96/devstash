import { describe, it, expect, vi, beforeEach } from "vitest";
import OpenAI from "openai";
import { suggestTags, summarizeDescription } from "./ai";

const mockAuth = vi.fn();
const mockParse = vi.fn();
const mockCheckRateLimit = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/openai", () => ({
  getOpenAI: () => ({ responses: { parse: (...args: unknown[]) => mockParse(...args) } }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  formatRetryTime: (s: number) => `${s} seconds`,
}));

const PRO_SESSION = { user: { id: "user-1", isPro: true } };
const INPUT = { title: "useDebounce hook", content: "export function useDebounce() {}", typeName: "Snippet" };
const ALLOWED = { success: true, remaining: 10, retryAfter: 0 };

beforeEach(() => {
  mockAuth.mockReset();
  mockParse.mockReset();
  mockCheckRateLimit.mockReset();
  mockAuth.mockResolvedValue(PRO_SESSION);
  mockCheckRateLimit.mockResolvedValue(ALLOWED);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("suggestTags", () => {
  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await suggestTags(INPUT)).toEqual({ success: false, error: "Unauthorized" });
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("rejects non-Pro users and never calls OpenAI", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } });
    const result = await suggestTags(INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pro feature");
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    const result = await suggestTags({ title: "  ", typeName: "Snippet" });
    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("returns an error when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0, retryAfter: 30 });
    const result = await suggestTags(INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("30 seconds");
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("checks rate limits by user ID", async () => {
    mockParse.mockResolvedValue({ status: "completed", output_parsed: { tags: ["react"] } });
    await suggestTags(INPUT);
    expect(mockCheckRateLimit).toHaveBeenCalledWith("ai", "user-1");
    expect(mockCheckRateLimit).toHaveBeenCalledWith("aiDaily", "user-1");
  });

  it("returns cleaned tags on success", async () => {
    mockParse.mockResolvedValue({
      status: "completed",
      output_parsed: { tags: ["React", " hooks ", "react", "debounce"] },
    });
    const result = await suggestTags({ ...INPUT, existingTags: ["debounce"] });
    expect(result).toEqual({ success: true, data: ["react", "hooks"] });
  });

  it("maps OpenAI rate limit errors to a friendly message", async () => {
    mockParse.mockRejectedValue(new OpenAI.RateLimitError(429, {}, "secret raw message", new Headers()));
    const result = await suggestTags(INPUT);
    expect(result).toEqual({ success: false, error: "AI is busy right now. Try again in a moment." });
  });

  it("maps connection errors", async () => {
    mockParse.mockRejectedValue(new OpenAI.APIConnectionError({ message: "down" }));
    const result = await suggestTags(INPUT);
    expect(result.error).toBe("Couldn't reach the AI service. Try again.");
  });

  it("maps other API errors without leaking the raw message", async () => {
    mockParse.mockRejectedValue(new OpenAI.APIError(500, {}, "secret raw message", new Headers()));
    const result = await suggestTags(INPUT);
    expect(result).toEqual({ success: false, error: "AI request failed." });
  });

  it("handles a missing API key", async () => {
    mockParse.mockRejectedValue(new Error("OPENAI_API_KEY is not set"));
    const result = await suggestTags(INPUT);
    expect(result.error).toBe("AI is not configured.");
  });

  it("handles incomplete responses", async () => {
    mockParse.mockResolvedValue({ status: "incomplete", output_parsed: null });
    const result = await suggestTags(INPUT);
    expect(result.error).toBe("The response was too long. Try shorter content.");
  });

  it("handles empty/refused output", async () => {
    mockParse.mockResolvedValue({ status: "completed", output_parsed: null });
    const result = await suggestTags(INPUT);
    expect(result.error).toBe("AI couldn't process this item.");
  });
});

describe("summarizeDescription", () => {
  const DESC_INPUT = { title: "useDebounce hook", content: "export function useDebounce() {}", typeName: "Snippet" };

  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await summarizeDescription(DESC_INPUT)).toEqual({ success: false, error: "Unauthorized" });
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("rejects non-Pro users and never calls OpenAI", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } });
    const result = await summarizeDescription(DESC_INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pro feature");
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("rejects input with no title, content, url or file name", async () => {
    const result = await summarizeDescription({ title: " ", content: "", typeName: "Snippet" });
    expect(result).toEqual({ success: false, error: "Add a title or some content first." });
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("rejects a missing type", async () => {
    const result = await summarizeDescription({ title: "x", typeName: "" });
    expect(result).toEqual({ success: false, error: "Type is required" });
  });

  it("works from content alone without a title", async () => {
    mockParse.mockResolvedValue({ status: "completed", output_parsed: { description: "A note." } });
    const result = await summarizeDescription({ content: "some text", typeName: "Note" });
    expect(result).toEqual({ success: true, data: "A note." });
  });

  it("returns an error when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0, retryAfter: 30 });
    const result = await summarizeDescription(DESC_INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("30 seconds");
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("returns the cleaned description on success", async () => {
    mockParse.mockResolvedValue({
      status: "completed",
      output_parsed: { description: "  Debounces a value.\nUseful for search inputs. " },
    });
    const result = await summarizeDescription(DESC_INPUT);
    expect(result).toEqual({ success: true, data: "Debounces a value. Useful for search inputs." });
  });

  it("errors on a blank AI description", async () => {
    mockParse.mockResolvedValue({ status: "completed", output_parsed: { description: "   " } });
    const result = await summarizeDescription(DESC_INPUT);
    expect(result).toEqual({ success: false, error: "AI couldn't process this item." });
  });

  it("maps OpenAI errors without leaking the raw message", async () => {
    mockParse.mockRejectedValue(new OpenAI.APIError(500, {}, "secret raw message", new Headers()));
    const result = await summarizeDescription(DESC_INPUT);
    expect(result).toEqual({ success: false, error: "AI request failed." });
  });
});
