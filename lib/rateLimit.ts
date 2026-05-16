import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Lazy initialize to prevent build-time crashes if env vars are missing
let ratelimitInstance: Ratelimit | null = null;

if (url && token && url !== 'your_upstash_redis_url') {
  ratelimitInstance = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
  });
}

export const ratelimit = ratelimitInstance;
