import { describe, it, expect } from "vitest";
import {
  buildDescriptionUserMessage,
  hasDescriptionSource,
  postProcessDescription,
} from "./description";
import { AI_DESCRIPTION_INPUT_CHARS, AI_DESCRIPTION_MAX_LENGTH } from "@/lib/constants/ai";

describe("hasDescriptionSource", () => {
  it("is false when title, content, url and fileName are all empty", () => {
    expect(hasDescriptionSource({ typeName: "Snippet", title: "  ", content: "", url: null })).toBe(false);
  });

  it("is true when any one source is present", () => {
    expect(hasDescriptionSource({ typeName: "Note", content: "text" })).toBe(true);
    expect(hasDescriptionSource({ typeName: "Link", url: "https://example.com" })).toBe(true);
    expect(hasDescriptionSource({ typeName: "File", fileName: "report.pdf" })).toBe(true);
  });
});

describe("buildDescriptionUserMessage", () => {
  it("wraps the item in <item_content> and skips empty fields", () => {
    const msg = buildDescriptionUserMessage({ typeName: "Link", title: "Docs", url: "", content: "" });
    expect(msg).toBe("<item_content>\nType: Link\nTitle: Docs\n</item_content>");
  });

  it("includes every available field", () => {
    const msg = buildDescriptionUserMessage({
      typeName: "Snippet",
      title: "Debounce",
      language: "typescript",
      url: "https://example.com",
      fileName: "a.ts",
      tags: ["react", "hooks"],
      content: "code",
    });
    expect(msg).toContain("Language: typescript");
    expect(msg).toContain("URL: https://example.com");
    expect(msg).toContain("File name: a.ts");
    expect(msg).toContain("Tags: react, hooks");
    expect(msg).toContain("code");
  });

  it("truncates long content", () => {
    const msg = buildDescriptionUserMessage({ typeName: "Note", content: "x".repeat(AI_DESCRIPTION_INPUT_CHARS + 500) });
    expect(msg.match(/x/g)).toHaveLength(AI_DESCRIPTION_INPUT_CHARS);
  });
});

describe("postProcessDescription", () => {
  it("collapses whitespace and newlines", () => {
    expect(postProcessDescription("  A   short\n\nsummary. ")).toBe("A short summary.");
  });

  it("caps length with an ellipsis", () => {
    const result = postProcessDescription("a".repeat(AI_DESCRIPTION_MAX_LENGTH + 50));
    expect(result).toHaveLength(AI_DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
  });
});
