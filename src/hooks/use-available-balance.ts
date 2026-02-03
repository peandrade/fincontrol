"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface UseAvailableBalanceOptions {
  /** Whether to fetch immediately when the hook mounts */
  fetchOnMount?: boolean;
}

export interface UseAvailableBalanceReturn {
  /** Current available balance (null if not loaded) */
  balance: number | null;
  /** Whether the balance is currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a fetch */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage available balance state.
 * Handles cleanup on unmount to prevent memory leaks.
 *
 * @example
 * const { balance, isLoading, refetch } = useAvailableBalance({ fetchOnMount: true });
 */
export function useAvailableBalance(
  options: UseAvailableBalanceOptions = {}
): UseAvailableBalanceReturn {
  const { fetchOnMount = false } = options;

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // AbortController for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBalance = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/balance", {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar saldo");
      }

      const data = await response.json();

      // Only update state if still mounted
      if (isMountedRef.current) {
        setBalance(data.balance);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      if (isMountedRef.current) {
        setBalance(null);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch on mount if requested
  useEffect(() => {
    if (fetchOnMount) {
      fetchBalance();
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOnMount, fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
