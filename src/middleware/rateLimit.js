import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for the contact endpoint.
 * Default: 3 requests per 15 minutes per IP.
 * Values are overridden by environment variables for easy tuning.
 */
export const contactLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '3',      10),
  standardHeaders: true,   // Return rate-limit info in RateLimit-* headers
  legacyHeaders:   false,  // Disable X-RateLimit-* headers
  message: {
    success: false,
    error:   'Too many requests from this IP. Please try again in 15 minutes.',
  },
  // Silently skip rate-limit in test environments
  skip: () => process.env.NODE_ENV === 'test',
});
