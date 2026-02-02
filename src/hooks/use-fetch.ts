"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cachedFetch, getCached, invalidateCache } from "@/lib/fetch-cache";

export interface UseFetchOptions {
  /**
   * Whether to fetch immediately on mount. Default: true
   */
  immediate?: boolean;
  /**
   * Error message to show when fetch fails
   */
  errorMessage?: string;
  /**
   * Dependencies that will trigger a refetch when changed
   */
  deps?: unknown[];
  /**
   * Cache TTL in milliseconds. Set to 0 to disable cache. Default: 5 minutes
   */
  cacheTtl?: number;
}

export interface UseFetchReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Generic hook factory for data fetching with loading/error states.
 * Eliminates boilerplate code across multiple data hooks.
 *
 * @param url - The API endpoint URL (can be a function for dynamic URLs)
 * @param options - Configuration options
 * @returns Object with data, isLoading, error, and refresh function
 *
 * @example
 * // Simple usage
 * const { data, isLoading, error, refresh } = useFetch<UserData>("/api/user");
 *
 * @example
 * // With dynamic URL
 * const { data } = useFetch<PostData>(
 *   () => `/api/posts?page=${page}`,
 *   { deps: [page] }
 * );
 *
 * @example
 * // Lazy loading (don't fetch on mount)
 * const { data, refresh } = useFetch<SearchResults>("/api/search", { immediate: false });
 * // Later: await refresh();
 */
export function useFetch<T>(
  url: string | (() => string),
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const { immediate = true, errorMessage, deps = [], cacheTtl = 5 * 60 * 1000 } = options;

  // Get the actual URL (support both string and function)
  const getUrl = useCallback(() => {
    return typeof url === "function" ? url() : url;
  }, [url]);

  // Try to get initial data from cache
  const initialUrl = typeof url === "function" ? null : url;
  const cachedData = initialUrl ? getCached<T>(`GET:${initialUrl}`) : null;

  const [data, setData] = useState<T | null>(cachedData);
  const [isLoading, setIsLoading] = useState(immediate && !cachedData);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  const refresh = useCallback(async (skipCache = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const actualUrl = getUrl();

      // Use cached fetch with TTL (or 0 to skip cache)
      const result = await cachedFetch<T>(actualUrl, {}, skipCache ? 0 : cacheTtl);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (e) {
      if (isMountedRef.current) {
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        setError(errorMessage || message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [getUrl, errorMessage, cacheTtl]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch on mount and when deps change
  useEffect(() => {
    if (immediate) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { data, isLoading, error, refresh };
}

/**
 * Creates a typed hook for a specific API endpoint.
 * Use this to create consistent, reusable hooks for your API endpoints.
 *
 * @example
 * // Create a typed hook
 * export const useUserProfile = createFetchHook<UserProfile>("/api/user/profile");
 *
 * // Use it in components
 * const { data: profile, isLoading } = useUserProfile();
 */
export function createFetchHook<T>(
  url: string,
  defaultOptions: UseFetchOptions = {}
) {
  return function useTypedFetch(options: UseFetchOptions = {}): UseFetchReturn<T> {
    return useFetch<T>(url, { ...defaultOptions, ...options });
  };
}
