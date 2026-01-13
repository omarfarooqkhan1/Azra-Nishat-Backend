const { client } = require('../config/redis');

// Cache middleware
const cache = async (req, res, next) => {
  try {
    const key = `cache:${req.originalUrl}`;
    const cachedData = await client.get(key);

    if (cachedData) {
      console.log('Cache hit');
      return res.json(JSON.parse(cachedData));
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response for 1 hour
      client.setEx(key, 3600, JSON.stringify(data));
      originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Cache error:', error);
    next();
  }
};

// Cache with TTL
const cacheWithTTL = (ttl = 3600) => async (req, res, next) => {
  try {
    const key = `cache:${req.originalUrl}`;
    const cachedData = await client.get(key);

    if (cachedData) {
      console.log('Cache hit');
      return res.json(JSON.parse(cachedData));
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response for specified TTL
      client.setEx(key, ttl, JSON.stringify(data));
      originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Cache error:', error);
    next();
  }
};

// Invalidate cache
const invalidateCache = async (pattern) => {
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

module.exports = {
  cache,
  cacheWithTTL,
  invalidateCache
};