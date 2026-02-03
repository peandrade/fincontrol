"use client";

import { useFetch, type UseFetchReturn } from "./use-fetch";
import type { AnalyticsData } from "@/types/api-responses";

// Re-export types for backwards compatibility
export type {
  AnalyticsData,
  CategoryTrend,
  DayOfWeekPattern,
  SpendingVelocity,
  YearComparison,
  YearComparisonMonth,
  TopInsight,
} from "@/types/api-responses";

export function useAnalytics(): UseFetchReturn<AnalyticsData> {
  return useFetch<AnalyticsData>("/api/analytics", {
    errorMessage: "Erro ao buscar analytics",
  });
}
