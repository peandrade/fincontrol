/**
 * Store Utilities
 *
 * Centralized utilities for Zustand stores.
 * Provides common patterns for error handling, async actions, and state management.
 */

import { ApiClientError } from "@/lib/api-client";

// ============================================
// Error Handling
// ============================================

/**
 * Extract error message from various error types.
 * Handles ApiClientError, Error, and unknown types.
 */
export function getStoreErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Ocorreu um erro inesperado";
}

/**
 * Default error messages for common operations
 */
export const errorMessages = {
  fetch: "Erro ao carregar dados",
  create: "Erro ao criar",
  update: "Erro ao atualizar",
  delete: "Erro ao excluir",
  network: "Erro de conexão. Verifique sua internet.",
  unauthorized: "Sessão expirada. Faça login novamente.",
  notFound: "Recurso não encontrado",
  validation: "Dados inválidos",
  rateLimit: "Muitas requisições. Tente novamente em breve.",
} as const;

/**
 * Get user-friendly error message based on error code or status
 */
export function getUserFriendlyError(error: unknown, operation?: keyof typeof errorMessages): string {
  if (error instanceof ApiClientError) {
    // Handle specific error codes
    switch (error.code) {
      case "RATE_LIMITED":
        return errorMessages.rateLimit;
      case "VALIDATION_ERROR":
        return errorMessages.validation;
      case "NOT_FOUND":
        return errorMessages.notFound;
      default:
        break;
    }

    // Handle HTTP status codes
    switch (error.status) {
      case 401:
        return errorMessages.unauthorized;
      case 404:
        return errorMessages.notFound;
      case 422:
        return errorMessages.validation;
      case 429:
        return errorMessages.rateLimit;
      default:
        return error.message;
    }
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return errorMessages.network;
  }

  return operation ? errorMessages[operation] : getStoreErrorMessage(error);
}

// ============================================
// Async Action Helpers
// ============================================

/**
 * Wrapper for async store actions with loading and error state management.
 *
 * @example
 * ```ts
 * const store = create<MyStore>((set, get) => ({
 *   isLoading: false,
 *   error: null,
 *
 *   fetchData: () => withAsyncAction(
 *     set,
 *     async () => {
 *       const data = await api.getData();
 *       set({ data });
 *     },
 *     'fetch'
 *   ),
 * }));
 * ```
 */
export async function withAsyncAction<T>(
  set: (state: { isLoading?: boolean; error?: string | null }) => void,
  action: () => Promise<T>,
  operation?: keyof typeof errorMessages
): Promise<T | undefined> {
  set({ isLoading: true, error: null });

  try {
    const result = await action();
    set({ isLoading: false });
    return result;
  } catch (error) {
    const message = getUserFriendlyError(error, operation);
    set({ isLoading: false, error: message });
    console.error(`Store action error (${operation || "unknown"}):`, error);
    return undefined;
  }
}

/**
 * Create a debounced version of a function.
 * Useful for search inputs or frequently called actions.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// ============================================
// Pagination Helpers
// ============================================

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
  hasMore: false,
};

/**
 * Calculate pagination state from API response
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  total: number
): PaginationState {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ============================================
// Cache Helpers
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple in-memory cache for store data.
 * Useful for caching expensive computations or API results.
 */
export function createCache<T>(ttlMs: number = 5 * 60 * 1000) {
  const cache = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry) return undefined;

      if (Date.now() - entry.timestamp > ttlMs) {
        cache.delete(key);
        return undefined;
      }

      return entry.data;
    },

    set(key: string, data: T): void {
      cache.set(key, { data, timestamp: Date.now() });
    },

    invalidate(key: string): void {
      cache.delete(key);
    },

    invalidateAll(): void {
      cache.clear();
    },
  };
}

// ============================================
// State Selectors
// ============================================

/**
 * Create a memoized selector that only recalculates when dependencies change.
 * Simple implementation for store selectors.
 */
export function createSelector<TState, TResult>(
  selector: (state: TState) => TResult
): (state: TState) => TResult {
  let lastState: TState | undefined;
  let lastResult: TResult | undefined;

  return (state: TState): TResult => {
    if (state === lastState && lastResult !== undefined) {
      return lastResult;
    }

    lastState = state;
    lastResult = selector(state);
    return lastResult;
  };
}
