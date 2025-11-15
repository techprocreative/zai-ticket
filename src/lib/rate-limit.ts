/**
 * Rate limiter with Redis (production) or in-memory (development) fallback
 * Install ioredis for Redis support: npm install ioredis @types/ioredis
 */

import { NextRequest, NextResponse } from 'next/server'

// Lazy load Redis to avoid errors when not installed
let redis: any = null
let redisInitialized = false

// Initialize Redis connection
async function getRedis() {
  if (!redisInitialized && process.env.REDIS_URL) {
    redisInitialized = true
    try {
      // Dynamic import for optional dependency
      const { default: Redis } = await import('ioredis')
      redis = new Redis(process.env.REDIS_URL)
    } catch (error) {
      console.warn('Redis not available, using in-memory rate limiter')
    }
  }
  return redis
}

// Fallback to in-memory for development
interface RateLimitEntry {
  count: number
  resetTime: number
}

const memoryStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetTime < now) {
      memoryStore.delete(key)
    }
  }
}, 60000)

interface RateLimitConfig {
  maxRequests?: number
  windowMs?: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limiter with Redis (production) or in-memory (development) fallback
 */
export async function rateLimiter(
  identifier: string,
  config: RateLimitConfig = {}
): Promise<RateLimitResult> {
  const maxRequests = config.maxRequests ?? 10
  const windowMs = config.windowMs ?? 60 * 1000

  const redisClient = await getRedis()

  if (redisClient) {
    // Redis implementation
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    const windowStart = now - windowMs

    try {
      // Remove old entries
      await redisClient.zremrangebyscore(key, 0, windowStart)

      // Count current requests in window
      const count = await redisClient.zcard(key)

      if (count >= maxRequests) {
        const oldestEntry = await redisClient.zrange(key, 0, 0, 'WITHSCORES')
        const resetAt = parseInt(oldestEntry[1] || '0') + windowMs

        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          reset: resetAt
        }
      }

      // Add current request
      await redisClient.zadd(key, now, `${now}-${Math.random()}`)
      await redisClient.expire(key, Math.ceil(windowMs / 1000))

      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - count - 1,
        reset: now + windowMs
      }
    } catch (error) {
      console.error('Redis rate limiter error:', error)
      // Fall through to memory store on Redis error
    }
  }

  // Fallback to in-memory
  const entry = memoryStore.get(identifier)
  const now = Date.now()

  if (!entry || now > entry.resetTime) {
    memoryStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs
    }
  }

  if (entry.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: entry.resetTime
    }
  }

  entry.count++
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: entry.resetTime
  }
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = {}
) {
  return async (request: NextRequest) => {
    const identifier = getClientIp(request)
    const result = await rateLimiter(identifier, config)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const response = await handler(request)

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.reset.toString())

    return response
  }
}
