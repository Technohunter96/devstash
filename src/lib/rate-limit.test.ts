import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { limitMock } = vi.hoisted(() => ({ limitMock: vi.fn() }));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => ({}));
    limit = limitMock;
  },
}));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { checkRateLimit, formatRetryTime, rateLimitResponse } from "./rate-limit";

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

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.spyOn(console, "error").mockImplementation(() => {});
    limitMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns success when under the limit", async () => {
    limitMock.mockResolvedValue({ success: true, remaining: 3, reset: Date.now() + 1000 });
    const result = await checkRateLimit("login", "1.2.3.4");
    expect(result).toEqual({ success: true, remaining: 3, retryAfter: 0 });
  });

  it("returns retryAfter when the limit is exceeded", async () => {
    limitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });
    const result = await checkRateLimit("login", "1.2.3.4");
    expect(result.success).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("fails open when Redis rejects", async () => {
    limitMock.mockRejectedValue(new Error("ENOTFOUND"));
    const result = await checkRateLimit("login", "1.2.3.4");
    expect(result.success).toBe(true);
  });

  it("fails open after the timeout when Redis never responds", async () => {
    vi.useFakeTimers();
    limitMock.mockReturnValue(new Promise(() => {}));
    const pending = checkRateLimit("login", "1.2.3.4");
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toMatchObject({ success: true });
  });
});
