import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

export async function POST() {
  const ip = await getClientIP();
  const rl = await checkRateLimit("login", ip);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  return new Response(null, { status: 200 });
}