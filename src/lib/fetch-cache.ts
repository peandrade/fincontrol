/**
 * Simple in-memory cache for fetch requests.
 * Prevents duplicate API calls and provides TTL-based expiration.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-flight requests to prevent duplicate concurrent calls
const inFlightRequests = new Map<string, Promise<unknown>>();

// Cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Check if a cache entry is still valid
 */
function isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get cached data if available and not expired
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (isValid(entry)) {
    return entry.data;
  }
  // Clean up expired entry
  if (entry) {
    cache.delete(key);
  }
  return null;
}

/**
 * Set data in cache with TTL
 */
export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear specific cache entries by pattern
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    inFlightRequests.clear();
    return;
  }

  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => {
    cache.delete(key);
    inFlightRequests.delete(key);
  });
}

/**
 * Invalidate cache for specific endpoints
 * Use this after mutations (POST, PUT, DELETE)
 */
export function invalidateCache(...patterns: string[]): void {
  patterns.forEach((pattern) => clearCache(pattern));
}

/**
 * Cached fetch with deduplication and TTL
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param ttl - Cache TTL in milliseconds (default: 5 minutes)
 * @returns The fetched data
 *
 * @example
 * // Simple usage
 * const data = await cachedFetch<UserData>("/api/user");
 *
 * @example
 * // With custom TTL (1 minute)
 * const data = await cachedFetch<Stats>("/api/stats", {}, 60000);
 *
 * @example
 * // Skip cache (force fresh fetch)
 * const data = await cachedFetch<Data>("/api/data", {}, 0);
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cacheKey = `${options.method || "GET"}:${url}`;

  // Only cache GET requests
  if (!options.method || options.method === "GET") {
    // Check cache first (if TTL > 0)
    if (ttl > 0) {
      const cached = getCached<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Check for in-flight request
    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      // When cache is disabled (ttl === 0), bypass browser HTTP cache too
      const fetchOptions = ttl === 0
        ? { ...options, cache: "no-store" as RequestCache }
        : options;
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Cache the result (only for GET requests with TTL > 0)
      if ((!options.method || options.method === "GET") && ttl > 0) {
        setCache(cacheKey, data, ttl);
      }

      return data as T;
    } finally {
      // Remove from in-flight requests
      inFlightRequests.delete(cacheKey);
    }
  })();

  // Track in-flight request (only for GET)
  if (!options.method || options.method === "GET") {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Create a mutation function that automatically invalidates cache
 *
 * @example
 * const createTransaction = createMutation<Transaction>(
 *   "/api/transactions",
 *   ["transactions", "dashboard", "analytics"]
 * );
 *
 * // Usage
 * const newTransaction = await createTransaction({ type: "expense", value: 100 });
 */
export function createMutation<TInput, TOutput = TInput>(
  url: string,
  invalidatePatterns: string[] = [],
  method: "POST" | "PUT" | "DELETE" = "POST"
) {
  return async (data?: TInput): Promise<TOutput> => {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // Invalidate related cache entries
    if (invalidatePatterns.length > 0) {
      invalidateCache(...invalidatePatterns);
    }

    return result as TOutput;
  };
}

// Cache statistics (useful for debugging)
export function getCacheStats() {
  const entries: { key: string; age: number; ttl: number; valid: boolean }[] = [];

  cache.forEach((entry, key) => {
    entries.push({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      valid: isValid(entry),
    });
  });

  return {
    size: cache.size,
    inFlight: inFlightRequests.size,
    entries,
  };
}
