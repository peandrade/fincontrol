/**
 * Decryption cache module.
 *
 * Provides request-scoped caching for decrypted data to avoid
 * redundant decryption operations within a single request.
 *
 * Note: This uses a simple Map-based cache with manual lifecycle management
 * since AsyncLocalStorage requires Node.js runtime and may not work in all
 * Next.js deployment environments.
 */

import type { EncryptedModel } from "./field-config";

// ============================================
// Types
// ============================================

/**
 * Cache entry storing decrypted data with metadata.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Cache statistics for monitoring.
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// ============================================
// Cache Implementation
// ============================================

/**
 * Request-scoped decryption cache.
 *
 * Use `createDecryptionCache()` at the start of a request
 * and pass it through your repository calls.
 */
export class DecryptionCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private stats: { hits: number; misses: number };
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(options?: { maxSize?: number; ttlMs?: number }) {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.maxSize = options?.maxSize ?? 1000;
    this.ttlMs = options?.ttlMs ?? 60000; // 1 minute default
  }

  /**
   * Generate a cache key for a record.
   */
  private generateKey(model: EncryptedModel, id: string): string {
    return `${model}:${id}`;
  }

  /**
   * Check if an entry is expired.
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  /**
   * Evict expired entries and enforce max size.
   */
  private evictIfNeeded(): void {
    // Remove expired entries
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }

    // If still over max size, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.cache.size - this.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get a cached decrypted record.
   *
   * @param model - The model type
   * @param id - The record ID
   * @returns Cached data or undefined if not found
   */
  get<T>(model: EncryptedModel, id: string): T | undefined {
    const key = this.generateKey(model, id);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Store a decrypted record in the cache.
   *
   * @param model - The model type
   * @param id - The record ID
   * @param data - The decrypted data
   */
  set<T>(model: EncryptedModel, id: string, data: T): void {
    this.evictIfNeeded();

    const key = this.generateKey(model, id);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if a record is cached.
   */
  has(model: EncryptedModel, id: string): boolean {
    const key = this.generateKey(model, id);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      return false;
    }

    return true;
  }

  /**
   * Remove a record from the cache.
   */
  delete(model: EncryptedModel, id: string): boolean {
    const key = this.generateKey(model, id);
    return this.cache.delete(key);
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a new decryption cache instance.
 * Call this at the start of each request to get a fresh cache.
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const cache = createDecryptionCache();
 *
 *   // Pass cache to repository methods
 *   const transactions = await transactionRepository.findByUser(userId, { cache });
 *
 *   return NextResponse.json(transactions);
 * }
 * ```
 */
export function createDecryptionCache(options?: {
  maxSize?: number;
  ttlMs?: number;
}): DecryptionCache {
  return new DecryptionCache(options);
}

// ============================================
// Cached Decryption Helpers
// ============================================

/**
 * Get or decrypt a record with caching.
 *
 * @param cache - The decryption cache
 * @param model - The model type
 * @param id - The record ID
 * @param decryptFn - Function to decrypt the record if not cached
 * @returns Decrypted record
 */
export async function getOrDecrypt<T>(
  cache: DecryptionCache | undefined,
  model: EncryptedModel,
  id: string,
  decryptFn: () => T | Promise<T>
): Promise<T> {
  // If no cache provided, just decrypt
  if (!cache) {
    return await decryptFn();
  }

  // Check cache first
  const cached = cache.get<T>(model, id);
  if (cached !== undefined) {
    return cached;
  }

  // Decrypt and cache
  const decrypted = await decryptFn();
  cache.set(model, id, decrypted);

  return decrypted;
}

/**
 * Get or decrypt a record synchronously with caching.
 */
export function getOrDecryptSync<T>(
  cache: DecryptionCache | undefined,
  model: EncryptedModel,
  id: string,
  decryptFn: () => T
): T {
  // If no cache provided, just decrypt
  if (!cache) {
    return decryptFn();
  }

  // Check cache first
  const cached = cache.get<T>(model, id);
  if (cached !== undefined) {
    return cached;
  }

  // Decrypt and cache
  const decrypted = decryptFn();
  cache.set(model, id, decrypted);

  return decrypted;
}

/**
 * Batch get or decrypt multiple records.
 */
export async function batchGetOrDecrypt<T extends { id: string }>(
  cache: DecryptionCache | undefined,
  model: EncryptedModel,
  records: T[],
  decryptFn: (record: T) => T
): Promise<T[]> {
  return records.map((record) => {
    if (!cache) {
      return decryptFn(record);
    }

    const cached = cache.get<T>(model, record.id);
    if (cached !== undefined) {
      return cached;
    }

    const decrypted = decryptFn(record);
    cache.set(model, record.id, decrypted);
    return decrypted;
  });
}

// ============================================
// Request Context Helper
// ============================================

/**
 * Simple request context that can hold a cache instance.
 * Use this to pass cache through the request lifecycle.
 */
export interface RequestContext {
  decryptionCache?: DecryptionCache;
}

/**
 * Create a request context with a decryption cache.
 */
export function createRequestContext(): RequestContext {
  return {
    decryptionCache: createDecryptionCache(),
  };
}
