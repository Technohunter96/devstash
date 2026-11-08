import { describe, it, expect } from "vitest";
import { postProcessTags, truncateForTags, mergeTag, parseTagString } from "./tags";
import { AI_TAG_INPUT_CHARS, AI_TAG_MAX_LENGTH, MAX_AI_TAGS } from "@/lib/constants/ai";

describe("postProcessTags", () => {
  it("lowercases and trims", () => {
    expect(postProcessTags(["  React ", "NEXTJS"], [])).toEqual(["react", "nextjs"]);
  });

  it("dedupes within the suggestions", () => {
    expect(postProcessTags(["react", "React"], [])).toEqual(["react"]);
  });

  it("drops tags already on the item (case-insensitive)", () => {
    expect(postProcessTags(["react", "hooks"], ["React"])).toEqual(["hooks"]);
  });

  it("caps the number of tags", () => {
    const raw = ["a", "b", "c", "d", "e", "f", "g"];
    expect(postProcessTags(raw, [])).toHaveLength(MAX_AI_TAGS);
  });

  it("drops empty and too-long tags and strips commas", () => {
    const tooLong = "x".repeat(AI_TAG_MAX_LENGTH + 1);
    expect(postProcessTags(["", "  ", tooLong, "a,b"], [])).toEqual(["ab"]);
  });
});

describe("truncateForTags", () => {
  it("cuts content to the tag input limit", () => {
    expect(truncateForTags("a".repeat(AI_TAG_INPUT_CHARS + 500))).toHaveLength(AI_TAG_INPUT_CHARS);
  });

  it("keeps short content unchanged", () => {
    expect(truncateForTags("short")).toBe("short");
  });
});

describe("parseTagString / mergeTag", () => {
  it("parses a comma-separated string", () => {
    expect(parseTagString("a, b,, c ")).toEqual(["a", "b", "c"]);
  });

  it("appends a new tag", () => {
    expect(mergeTag("a, b", "c")).toBe("a, b, c");
  });

  it("does not duplicate an existing tag", () => {
    expect(mergeTag("a, B", "b")).toBe("a, B");
  });

  it("works on an empty field", () => {
    expect(mergeTag("", "react")).toBe("react");
  });
});
