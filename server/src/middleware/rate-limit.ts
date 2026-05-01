import { Request, Response, NextFunction } from 'express';
import { redis, redisHealth } from './redis';

// In-memory fallback when Redis is unavailable
const memoryStore: Map<string, { count: number; resetAt: number }> = new Map();

interface RateLimitOptions {
  keyFn: (req: Request) => string;
  maxRequests: number;
  windowMs: number;
}

function getRateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${options.keyFn(req)}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    let count: number;
    let resetAt: number;

    const isRedisAvailable = await redisHealth();

    if (isRedisAvailable) {
      // Redis-based rate limiting
      const pipeline = redis.multi();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.zcard(key);
      pipeline.expire(key, Math.ceil(options.windowMs / 1000));
      const results = await pipeline.exec();
      count = results?.[2]?.[1] as number ?? 0;
      resetAt = now + options.windowMs;
    } else {
      // In-memory fallback
      const entry = memoryStore.get(key);
      if (!entry || entry.resetAt < now) {
        memoryStore.set(key, { count: 1, resetAt: now + options.windowMs });
        count = 1;
        resetAt = now + options.windowMs;
      } else {
        entry.count += 1;
        count = entry.count;
        resetAt = entry.resetAt;
      }
    }

    const remaining = Math.max(0, options.maxRequests - count);
    res.set('X-RateLimit-Limit', String(options.maxRequests));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (count > options.maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
  };
}

// Per-user chat rate limiter
export const chatRateLimit = getRateLimiter({
  keyFn: (req) => req.headers.authorization ?? req.ip ?? 'anonymous',
  maxRequests: parseInt(process.env.RATE_LIMIT_CHAT_PER_MIN ?? '20'),
  windowMs: 60 * 1000,
});

// IP-based auth rate limiter
export const authRateLimit = getRateLimiter({
  keyFn: (req) => req.ip ?? 'unknown',
  maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_PER_IP ?? '10'),
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? '300000'),
});
