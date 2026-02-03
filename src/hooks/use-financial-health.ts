"use client";

import { useFetch, type UseFetchReturn } from "./use-fetch";
import type { FinancialHealthData } from "@/types/api-responses";

// Re-export types for backwards compatibility
export type {
  FinancialHealthData,
  FinancialHealthDetails,
  ComponentScores,
} from "@/types/api-responses";

export function useFinancialHealth(): UseFetchReturn<FinancialHealthData> {
  return useFetch<FinancialHealthData>("/api/financial-health", {
    errorMessage: "Erro ao buscar saude financeira",
  });
}
