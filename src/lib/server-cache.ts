/**
 * Server-side Cache
 *
 * In-memory cache for API routes with TTL-based expiration.
 * Supports user-specific caching and tag-based invalidation.
 *
 * Usage:
 * ```typescript
 * import { serverCache } from "@/lib/server-cache";
 *
 * // In API route
 * const cacheKey = serverCache.userKey(userId, "dashboard-summary");
 * const cached = serverCache.get<DashboardSummary>(cacheKey);
 *
 * if (cached) {
 *   return NextResponse.json(cached);
 * }
 *
 * const data = await calculateExpensiveData();
 * serverCache.set(cacheKey, data, { ttl: 60_000, tags: ["dashboard", "transactions"] });
 *
 * return NextResponse.json(data);
 * ```
 *
 * Invalidation:
 * ```typescript
 * // After a mutation (e.g., creating a transaction)
 * serverCache.invalidateByTag(userId, "transactions");
 * serverCache.invalidateByTag(userId, "dashboard");
 * ```
 */

import { loggers } from "./logger";

const log = loggers.cache;

// ============================================
// Types
// ============================================

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  ttl: number;
  tags: string[];
}

interface CacheOptions {
  /** Time to live in milliseconds. Default: 60 seconds */
  ttl?: number;
  /** Tags for grouped invalidation */
  tags?: string[];
}

interface CacheStats {
  size: number;
  entries: Array<{
    key: string;
    age: number;
    ttl: number;
    tags: string[];
    isValid: boolean;
  }>;
}

// ============================================
// Constants
// ============================================

/** Default TTL: 1 minute */
const DEFAULT_TTL = 60 * 1000;

/** Max cache size to prevent memory issues */
const MAX_CACHE_SIZE = 1000;

/** Cleanup interval: run every 5 minutes */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// ============================================
// Cache Storage
// ============================================

const cache = new Map<string, CacheEntry<unknown>>();
const tagIndex = new Map<string, Set<string>>(); // tag -> Set of cache keys

// ============================================
// Cleanup Timer
// ============================================

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    cache.forEach((entry, key) => {
      if (now - entry.createdAt > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => deleteEntry(key));
  }, CLEANUP_INTERVAL);

  // Don't keep the process alive just for cleanup
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

// ============================================
// Internal Helpers
// ============================================

function isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.createdAt < entry.ttl;
}

function deleteEntry(key: string) {
  const entry = cache.get(key);
  if (entry) {
    // Remove from tag index
    entry.tags.forEach((tag) => {
      const tagKeys = tagIndex.get(tag);
      if (tagKeys) {
        tagKeys.delete(key);
        if (tagKeys.size === 0) {
          tagIndex.delete(tag);
        }
      }
    });
    cache.delete(key);
  }
}

function enforceMaxSize() {
  if (cache.size <= MAX_CACHE_SIZE) return;

  // Find and remove oldest entries
  const entries = Array.from(cache.entries())
    .map(([key, entry]) => ({ key, createdAt: entry.createdAt }))
    .sort((a, b) => a.createdAt - b.createdAt);

  const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE + 100); // Remove extra to avoid frequent cleanup
  toRemove.forEach(({ key }) => deleteEntry(key));
}

// ============================================
// Public API
// ============================================

export const serverCache = {
  /**
   * Generate a user-scoped cache key
   */
  userKey(userId: string, key: string): string {
    return `user:${userId}:${key}`;
  },

  /**
   * Generate a global cache key (not user-specific)
   */
  globalKey(key: string): string {
    return `global:${key}`;
  },

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;

    if (isValid(entry)) {
      log.debug("Cache hit", { key });
      return entry.data;
    }

    // Clean up expired entry
    if (entry) {
      log.debug("Cache expired", { key });
      deleteEntry(key);
    }

    return null;
  },

  /**
   * Set data in cache with options
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = DEFAULT_TTL, tags = [] } = options;

    // Delete existing entry first to clean up tags
    if (cache.has(key)) {
      deleteEntry(key);
    }

    // Create new entry
    cache.set(key, {
      data,
      createdAt: Date.now(),
      ttl,
      tags,
    });

    // Update tag index
    tags.forEach((tag) => {
      if (!tagIndex.has(tag)) {
        tagIndex.set(tag, new Set());
      }
      tagIndex.get(tag)!.add(key);
    });

    // Enforce max size
    enforceMaxSize();

    // Ensure cleanup timer is running
    startCleanupTimer();
  },

  /**
   * Invalidate (delete) a specific cache entry
   */
  invalidate(key: string): void {
    deleteEntry(key);
  },

  /**
   * Invalidate all cache entries with a specific tag
   * Optionally scoped to a user
   */
  invalidateByTag(tag: string, userId?: string): void {
    const tagKeys = tagIndex.get(tag);
    if (!tagKeys) return;

    const keysToDelete = userId
      ? Array.from(tagKeys).filter((key) => key.startsWith(`user:${userId}:`))
      : Array.from(tagKeys);

    if (keysToDelete.length > 0) {
      log.debug("Cache invalidated by tag", { tag, count: keysToDelete.length, userId });
    }

    keysToDelete.forEach((key) => deleteEntry(key));
  },

  /**
   * Invalidate all cache entries for a specific user
   */
  invalidateUser(userId: string): void {
    const prefix = `user:${userId}:`;
    const keysToDelete: string[] = [];

    cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => deleteEntry(key));
  },

  /**
   * Clear all cache entries
   */
  clear(): void {
    cache.clear();
    tagIndex.clear();
  },

  /**
   * Get cache statistics (for debugging/monitoring)
   */
  stats(): CacheStats {
    const now = Date.now();
    const entries: CacheStats["entries"] = [];

    cache.forEach((entry, key) => {
      entries.push({
        key,
        age: now - entry.createdAt,
        ttl: entry.ttl,
        tags: entry.tags,
        isValid: isValid(entry),
      });
    });

    return {
      size: cache.size,
      entries,
    };
  },

  /**
   * Helper to get or compute cached value
   * This is the recommended way to use the cache
   */
  async getOrSet<T>(
    key: string,
    compute: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await compute();
    this.set(key, data, options);
    return data;
  },
};

// ============================================
// Cache Tags Constants
// ============================================

/**
 * Standard cache tags for invalidation
 */
export const CacheTags = {
  TRANSACTIONS: "transactions",
  INVESTMENTS: "investments",
  CARDS: "cards",
  GOALS: "goals",
  BUDGETS: "budgets",
  CATEGORIES: "categories",
  TEMPLATES: "templates",
  RECURRING: "recurring",
  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
  WEALTH: "wealth",
  HEALTH_SCORE: "health-score",
} as const;

/**
 * Cache TTL presets
 */
export const CacheTTL = {
  /** 30 seconds - for frequently updated data */
  SHORT: 30 * 1000,
  /** 1 minute - default */
  DEFAULT: 60 * 1000,
  /** 5 minutes - for semi-static data */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes - for expensive calculations */
  LONG: 15 * 60 * 1000,
  /** 1 hour - for rarely changing data */
  VERY_LONG: 60 * 60 * 1000,
} as const;
