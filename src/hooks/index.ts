// Hook factory
export { useFetch, createFetchHook } from "./use-fetch";
export type { UseFetchOptions, UseFetchReturn } from "./use-fetch";

// Cache utilities (re-export for convenience)
export { invalidateCache, clearCache } from "@/lib/fetch-cache";

// Data fetching hooks
export { useAnalytics } from "./use-analytics";
export { useCardsAnalytics } from "./use-cards-analytics";
export { useWealthEvolution } from "./use-wealth-evolution";
export { useFinancialHealth } from "./use-financial-health";
export { useDashboardSummary } from "./use-dashboard-summary";
export { useCashFlowForecast } from "./use-cash-flow-forecast";

// Re-export types from centralized location
export type {
  AnalyticsData,
  CategoryTrend,
  DayOfWeekPattern,
  SpendingVelocity,
  YearComparison,
  YearComparisonMonth,
  TopInsight,
  CardsAnalyticsData,
  CardSpendingByCategory,
  CardMonthlySpending,
  CardBreakdown,
  CardAlert,
  CardsSummary,
  WealthEvolutionData,
  WealthDataPoint,
  WealthSummary,
  FinancialHealthData,
  FinancialHealthDetails,
  ComponentScores,
  DashboardSummaryData,
  CashFlowForecastData,
  CashFlowDataPoint,
  CashFlowAlert,
  CashFlowSummary,
  ForecastPeriod,
} from "@/types/api-responses";

// Utility hooks
export { useFeedback } from "./use-feedback";
export { useNotifications } from "./use-notifications";
export type { Notification } from "./use-notifications";
export { useAvailableBalance } from "./use-available-balance";
export type { UseAvailableBalanceOptions, UseAvailableBalanceReturn } from "./use-available-balance";
export { useModalState } from "./use-modal-state";
export { usePagination, getPageNumbers } from "./use-pagination";
export type {
  PaginationState,
  PaginationControls,
  PaginationInfo,
  UsePaginationOptions,
  UsePaginationReturn,
} from "./use-pagination";
