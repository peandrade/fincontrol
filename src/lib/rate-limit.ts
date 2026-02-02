/**
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, consider using Redis/Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data per identifier
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }, CLEANUP_INTERVAL);

  // Don't prevent process exit
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  /**
   * Identifier prefix for the rate limit bucket
   */
  identifier: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
  limit: number;
}

/**
 * Check and consume rate limit for an identifier.
 *
 * @param ip - Client IP address or unique identifier
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 *
 * @example
 * const result = checkRateLimit(clientIp, {
 *   limit: 5,
 *   windowSeconds: 60,
 *   identifier: "register"
 * });
 *
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: "Muitas tentativas. Tente novamente em breve." },
 *     { status: 429 }
 *   );
 * }
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const { limit, windowSeconds, identifier } = config;
  const key = `${identifier}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const entry = rateLimitStore.get(key);

  // No existing entry or window expired - create new
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      success: true,
      remaining: limit - 1,
      resetIn: windowSeconds,
      limit,
    };
  }

  // Window still active
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn,
      limit,
    };
  }

  // Increment counter
  entry.count++;

  return {
    success: true,
    remaining: limit - entry.count,
    resetIn,
    limit,
  };
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Check common proxy headers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take first IP if multiple
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Vercel-specific
  const vercelForwardedFor = headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  // Fallback - should not happen in production
  return "unknown";
}

/**
 * Rate limit presets for common use cases
 */
export const rateLimitPresets = {
  /**
   * Auth endpoints - strict limits
   * 5 attempts per minute
   */
  auth: {
    limit: 5,
    windowSeconds: 60,
  },

  /**
   * Password reset - very strict
   * 3 attempts per 5 minutes
   */
  passwordReset: {
    limit: 3,
    windowSeconds: 300,
  },

  /**
   * Registration - moderate
   * 3 registrations per hour per IP
   */
  register: {
    limit: 3,
    windowSeconds: 3600,
  },

  /**
   * API calls - lenient
   * 100 requests per minute
   */
  api: {
    limit: 100,
    windowSeconds: 60,
  },

  /**
   * Mutation endpoints (POST/PATCH/DELETE)
   * 30 mutations per minute
   */
  mutation: {
    limit: 30,
    windowSeconds: 60,
  },

  /**
   * External API calls (quotes, etc.)
   * 20 requests per minute
   */
  externalApi: {
    limit: 20,
    windowSeconds: 60,
  },

  /**
   * Data import - very strict
   * 5 imports per minute
   */
  import: {
    limit: 5,
    windowSeconds: 60,
  },
} as const;

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetIn.toString(),
  };
}
