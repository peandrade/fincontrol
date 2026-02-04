"use client";

import { useFetch, type UseFetchReturn } from "./use-fetch";
import type { WealthEvolutionData } from "@/types/api-responses";
import type { EvolutionPeriod } from "@/types";

// Re-export types for backwards compatibility
export type {
  WealthEvolutionData,
  WealthDataPoint,
  WealthSummary,
} from "@/types/api-responses";

export function useWealthEvolution(
  period: EvolutionPeriod = "1y",
  deps: unknown[] = []
): UseFetchReturn<WealthEvolutionData> {
  return useFetch<WealthEvolutionData>(
    () => `/api/wealth-evolution?period=${period}`,
    {
      errorMessage: "Erro ao buscar evolucao patrimonial",
      cacheTtl: 0,
      deps: [period, ...deps],
    }
  );
}
