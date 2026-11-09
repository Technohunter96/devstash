import { describe, it, expect } from "vitest";
import { buildItemMessage } from "./prompt";

describe("buildItemMessage", () => {
  it("wraps labelled fields in <item_content> and skips empty ones", () => {
    const msg = buildItemMessage([["Type", "Link"], ["Language", null], ["Title", "  "], ["URL", "https://a.b"]], null, 100);
    expect(msg).toBe("<item_content>\nType: Link\nURL: https://a.b\n</item_content>");
  });

  it("appends the trimmed body after a blank line", () => {
    expect(buildItemMessage([["Type", "Note"]], "  text  ", 100)).toBe(
      "<item_content>\nType: Note\n\ntext\n</item_content>"
    );
  });

  it("cuts the body to the given limit", () => {
    const msg = buildItemMessage([], "x".repeat(50), 10);
    expect(msg.match(/x/g)).toHaveLength(10);
  });
});
