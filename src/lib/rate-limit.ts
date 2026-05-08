import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set — rate limiting is disabled");
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (err) {
    console.error("[rate-limit] Failed to initialize Redis client:", err);
    return null;
  }
}

const rateLimitConfigs = {
  login:               { limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "devstash:rl:login" },
  register:            { limiter: Ratelimit.slidingWindow(3, "1 h"),  prefix: "devstash:rl:register" },
  forgotPassword:      { limiter: Ratelimit.slidingWindow(3, "1 h"),  prefix: "devstash:rl:forgot-password" },
  resetPassword:       { limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "devstash:rl:reset-password" },
  resendVerification:  { limiter: Ratelimit.slidingWindow(3, "15 m"), prefix: "devstash:rl:resend-verification" },
} as const;

export type RateLimitType = keyof typeof rateLimitConfigs;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number;
}

export async function getClientIP(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "127.0.0.1";
}

/**
 * Check rate limit for a given endpoint type.
 * @param type     - Which limiter config to use
 * @param identifier - IP (from getClientIP/getIP). For login/resend, pass `${ip}:${email}`.
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<RateLimitResult> {
  const redisClient = getRedis();

  if (!redisClient) return { success: true, remaining: -1, retryAfter: 0 };

  const config = rateLimitConfigs[type];

  try {
    const ratelimit = new Ratelimit({
      redis: redisClient,
      limiter: config.limiter,
      prefix: config.prefix,
    });

    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error("[rate-limit] Upstash request failed, failing open:", err);
    return { success: true, remaining: -1, retryAfter: 0 };
  }
}

export function formatRetryTime(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: `Too many attempts. Please try again in ${formatRetryTime(retryAfter)}.` }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
