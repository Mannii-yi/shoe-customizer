import rateLimit from 'express-rate-limit';

const handler = (req, res) => {
  res.status(429).json({
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again in a minute' },
  });
};

const make = (limit) =>
  rateLimit({ windowMs: 60_000, limit, standardHeaders: 'draft-7', legacyHeaders: false, handler });

/**
 * Per-IP limits per minute: auth routes 10, everything else 120 (the contract values).
 * @param {{auth?: number, general?: number}} [limits] override, mainly for tests
 */
export function createRateLimiters({ auth = 10, general = 120 } = {}) {
  return { authLimiter: make(auth), generalLimiter: make(general) };
}
