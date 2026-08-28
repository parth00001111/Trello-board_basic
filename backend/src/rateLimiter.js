function createFixedWindowRateLimiter({
  windowMs,
  limit,
  message,
  maxEntries = 5000,
  keyGenerator = (req) => req.ip || req.socket?.remoteAddress || "unknown",
}) {
  if (!Number.isInteger(windowMs) || windowMs <= 0) {
    throw new TypeError("windowMs must be a positive integer");
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new TypeError("limit must be a positive integer");
  }
  if (!Number.isInteger(maxEntries) || maxEntries <= 0) {
    throw new TypeError("maxEntries must be a positive integer");
  }

  const entries = new Map();
  const pruneIntervalMs = Math.min(windowMs, 60 * 1000);
  let nextPruneAt = Date.now() + pruneIntervalMs;

  function pruneExpired(now) {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) {
        entries.delete(key);
      }
    }
    nextPruneAt = now + pruneIntervalMs;
  }

  function makeRoom(now) {
    pruneExpired(now);
    while (entries.size >= maxEntries) {
      const oldestKey = entries.keys().next().value;
      if (oldestKey === undefined) break;
      entries.delete(oldestKey);
    }
  }

  return function fixedWindowRateLimiter(req, res, next) {
    const now = Date.now();
    if (now >= nextPruneAt) {
      pruneExpired(now);
    }

    const key = String(keyGenerator(req) || "unknown");
    let entry = entries.get(key);

    if (!entry || entry.resetAt <= now) {
      if (!entry && entries.size >= maxEntries) {
        makeRoom(now);
      }
      entry = { count: 0, resetAt: now + windowMs };
    } else {
      // Refresh insertion order so the hard-cap eviction removes the least-recent key.
      entries.delete(key);
    }

    entry.count += 1;
    entries.set(key, entry);

    if (entry.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        message,
        retryAfter,
      });
    }

    return next();
  };
}

module.exports = { createFixedWindowRateLimiter };
