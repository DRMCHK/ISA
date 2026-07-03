/**
 * Simple in-memory rate limiter.
 * Limits requests per userId per window.
 * For production scale, replace with Redis/Upstash.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 60_000) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Check if a userId is within the rate limit.
 * @param userId - User identifier
 * @param maxRequests - Max requests per window (default 30)
 * @param windowMs - Window duration in ms (default 60s)
 */
export function checkRateLimit(
  userId: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    const resetIn = windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: windowMs - (now - entry.windowStart) };
}
