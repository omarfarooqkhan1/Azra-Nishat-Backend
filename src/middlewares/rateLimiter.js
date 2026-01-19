const { client } = require('../config/redis');

// Rate limiter using Redis
const redisRateLimiter = (windowMs = 900000, max = 100) => {
  return async (req, res, next) => {
    try {
      // Skip rate limiting for OPTIONS requests
      if (req.method === 'OPTIONS') {
        return next();
      }

      // Skip rate limiting in development if enabled
      if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
        return next();
      }

      const key = `rate-limit:${req.ip}`;

      // Use INCR for atomic increment
      const count = await client.incr(key);

      // If this is the first request, set the expiry
      if (count === 1) {
        const ttl = Math.floor(windowMs / 1000); // Convert to seconds
        await client.expire(key, ttl);
      }

      // Check if limit exceeded
      if (count > max) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.'
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to proceed
      next();
    }
  };
};

module.exports = redisRateLimiter;