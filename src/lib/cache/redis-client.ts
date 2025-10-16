import { Redis } from 'ioredis';
import { createHash } from 'crypto';

// Redis client singleton
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  return redisClient;
}

// Helper to generate cache keys
export function generateCacheKey(...parts: any[]): string {
  const serialized = parts.map(part => 
    typeof part === 'object' ? JSON.stringify(part) : String(part)
  ).join(':');
  
  return createHash('md5').update(serialized).digest('hex');
}

// Cache wrapper with automatic serialization
export class CacheManager {
  private redis: Redis;
  private defaultTTL: number;

  constructor(defaultTTL = 300) { // 5 minutes default
    this.redis = getRedisClient();
    this.defaultTTL = defaultTTL;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl || this.defaultTTL) {
        await this.redis.setex(key, ttl || this.defaultTTL, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          pipeline.del(...keys);
          pipeline.del(`tag:${tag}`);
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache invalidate by tags error:', error);
    }
  }

  async setWithTags(key: string, value: any, tags: string[], ttl?: number): Promise<void> {
    try {
      await this.set(key, value, ttl);
      
      const pipeline = this.redis.pipeline();
      for (const tag of tags) {
        pipeline.sadd(`tag:${tag}`, key);
        if (ttl || this.defaultTTL) {
          pipeline.expire(`tag:${tag}`, ttl || this.defaultTTL);
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache set with tags error:', error);
    }
  }

  // Decorator for caching function results
  cached<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function and cache result
      const result = await fn(...args);
      await this.set(key, result, ttl);
      
      return result;
    }) as T;
  }
}

// Pre-configured cache managers for different use cases
export const searchCache = new CacheManager(300); // 5 minutes
export const pipelineCache = new CacheManager(60); // 1 minute
export const userCache = new CacheManager(3600); // 1 hour
export const configCache = new CacheManager(86400); // 24 hours

// Cache strategies
export const CacheStrategies = {
  candidateSearch: {
    keyGenerator: (query: string, filters: any) => 
      `search:candidates:${generateCacheKey(query, filters)}`,
    ttl: 300
  },
  
  jobPipeline: {
    keyGenerator: (jobId: string) => `pipeline:job:${jobId}`,
    ttl: 60
  },
  
  candidateProfile: {
    keyGenerator: (candidateId: string) => `candidate:${candidateId}`,
    ttl: 300
  },
  
  jobDetails: {
    keyGenerator: (jobId: string) => `job:${jobId}`,
    ttl: 300
  },
  
  userSession: {
    keyGenerator: (userId: string) => `session:user:${userId}`,
    ttl: 86400
  },
  
  applicationStats: {
    keyGenerator: (jobId: string) => `stats:applications:${jobId}`,
    ttl: 60
  }
};
