import { describe, it, expect } from "vitest";
import { formatRetryTime, rateLimitResponse } from "./rate-limit";

describe("formatRetryTime", () => {
  it("returns seconds for less than 60", () => {
    expect(formatRetryTime(1)).toBe("1 second");
    expect(formatRetryTime(30)).toBe("30 seconds");
    expect(formatRetryTime(59)).toBe("59 seconds");
  });

  it("returns minutes for 60 and above", () => {
    expect(formatRetryTime(60)).toBe("1 minute");
    expect(formatRetryTime(90)).toBe("2 minutes");
    expect(formatRetryTime(3600)).toBe("60 minutes");
  });

  it("handles singular minute correctly", () => {
    expect(formatRetryTime(60)).toBe("1 minute");
  });

  it("handles singular second correctly", () => {
    expect(formatRetryTime(1)).toBe("1 second");
  });
});

describe("rateLimitResponse", () => {
  it("returns a 429 Response", async () => {
    const res = rateLimitResponse(60);
    expect(res.status).toBe(429);
  });

  it("includes Retry-After header", async () => {
    const res = rateLimitResponse(120);
    expect(res.headers.get("Retry-After")).toBe("120");
  });

  it("includes Content-Type application/json", async () => {
    const res = rateLimitResponse(30);
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("body contains formatted retry time", async () => {
    const res = rateLimitResponse(60);
    const body = await res.json();
    expect(body.error).toContain("1 minute");
  });
});