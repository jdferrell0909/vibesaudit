import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const USER_LIFETIME_LIMIT = 5;
const BYPASS_TOKEN = process.env.BYPASS_TOKEN ?? "";

export function isBypassToken(token: string | null): boolean {
  return BYPASS_TOKEN.length > 0 && token === BYPASS_TOKEN;
}

// Global cap: 50 requests per hour across all users
export const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"),
  analytics: true,
  prefix: "vibe-audit-global",
});

// Per-user lifetime counter (5 free, then pay)
export async function checkUserLimit(ip: string) {
  const key = `vibe-audit-user:${ip}`;
  const count = await redis.incr(key);

  if (count > USER_LIFETIME_LIMIT) {
    return { success: false, remaining: 0, used: count };
  }

  return { success: true, remaining: USER_LIFETIME_LIMIT - count, used: count };
}
