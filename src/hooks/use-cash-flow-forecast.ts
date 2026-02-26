"use client";

import { useFetch, type UseFetchReturn } from "./use-fetch";
import type { CashFlowForecastData, ForecastPeriod } from "@/types/api-responses";

// Re-export types for backwards compatibility
export type {
  CashFlowForecastData,
  CashFlowDataPoint,
  CashFlowAlert,
  CashFlowSummary,
  ForecastPeriod,
} from "@/types/api-responses";

export function useCashFlowForecast(
  days: ForecastPeriod = 30,
  deps: unknown[] = []
): UseFetchReturn<CashFlowForecastData> {
  return useFetch<CashFlowForecastData>(
    () => `/api/cash-flow-forecast?days=${days}`,
    {
      errorMessage: "Erro ao buscar previsao de fluxo de caixa",
      cacheTtl: 0,
      deps: [days, ...deps],
    }
  );
}
