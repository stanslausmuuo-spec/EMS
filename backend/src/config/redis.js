const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : 'redis://localhost:6379');

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.connect().catch((err) => {
  console.warn('Redis connection warning (running without persistent Redis/BullMQ):', err.message);
});

module.exports = redis;
