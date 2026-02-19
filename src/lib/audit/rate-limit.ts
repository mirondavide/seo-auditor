const store = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

// Cleanup expired entries every 10 minutes
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 10 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL).unref?.();
}
