"use client";

import { useFetch, type UseFetchReturn } from "./use-fetch";
import type { DashboardSummaryData } from "@/types/api-responses";

// Re-export types for backwards compatibility
export type { DashboardSummaryData } from "@/types/api-responses";

export function useDashboardSummary(deps: unknown[] = []): UseFetchReturn<DashboardSummaryData> {
  return useFetch<DashboardSummaryData>("/api/dashboard/summary", {
    errorMessage: "Erro ao buscar resumo do dashboard",
    cacheTtl: 0,
    deps,
  });
}
