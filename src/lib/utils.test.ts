import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { timeAgo, cn, parsePage } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, undefined, "bar")).toBe("foo bar");
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than 1 minute', () => {
    const date = new Date("2025-01-01T11:59:30Z");
    expect(timeAgo(date)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const date = new Date("2025-01-01T11:45:00Z");
    expect(timeAgo(date)).toBe("15m ago");
  });

  it("returns hours ago", () => {
    const date = new Date("2025-01-01T09:00:00Z");
    expect(timeAgo(date)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const date = new Date("2024-12-29T12:00:00Z");
    expect(timeAgo(date)).toBe("3d ago");
  });

  it("returns 1 minute boundary correctly", () => {
    const date = new Date("2025-01-01T11:59:00Z");
    expect(timeAgo(date)).toBe("1m ago");
  });
});

describe("parsePage", () => {
  it("returns 1 when undefined", () => {
    expect(parsePage(undefined)).toBe(1);
  });

  it("returns 1 for a non-numeric value", () => {
    expect(parsePage("abc")).toBe(1);
  });

  it("returns 1 for zero", () => {
    expect(parsePage("0")).toBe(1);
  });

  it("returns 1 for a negative value", () => {
    expect(parsePage("-3")).toBe(1);
  });

  it("floors a decimal value", () => {
    expect(parsePage("2.9")).toBe(2);
  });

  it("returns the parsed page for a valid value", () => {
    expect(parsePage("5")).toBe(5);
  });
});