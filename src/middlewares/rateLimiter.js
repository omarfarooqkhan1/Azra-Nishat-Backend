const { client } = require('../config/redis');

// Rate limiter using Redis
const redisRateLimiter = (windowMs = 900000, max = 100) => {
  return async (req, res, next) => {
    try {
      const key = `rate-limit:${req.ip}`;
      const current = await client.get(key);
      
      if (current && parseInt(current) >= max) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.'
        });
      }
      
      const count = current ? parseInt(current) + 1 : 1;
      const ttl = Math.floor(windowMs / 1000); // Convert to seconds
      
      await client.setEx(key, ttl, count.toString());
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next();
    }
  };
};

module.exports = redisRateLimiter;