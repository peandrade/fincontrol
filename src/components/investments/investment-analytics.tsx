"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFetch } from "@/hooks/use-fetch";
import { PortfolioInsights } from "./portfolio-insights";
import { PerformanceCards } from "./performance-cards";
import { AllocationTargets } from "./allocation-targets";

// Re-export types and components for backwards compatibility
export type {
  PerformanceData,
  AllocationTarget,
  PortfolioInsight,
  InvestmentAnalyticsData,
} from "./analytics-types";

export { typeColors } from "./analytics-types";
export { PortfolioInsights } from "./portfolio-insights";
export { PerformanceCards } from "./performance-cards";
export { AllocationTargets } from "./allocation-targets";

export function InvestmentAnalytics() {
  const t = useTranslations("investments");
  const { data, isLoading } = useFetch<import("./analytics-types").InvestmentAnalyticsData>(
    "/api/investments/analytics",
    { errorMessage: t("analyticsError") }
  );

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.summary.investmentCount === 0) return null;

  return (
    <div className="space-y-6">
      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
          <PortfolioInsights insights={data.insights} showHeader />
        </div>
      )}

      {/* Top & Worst Performers */}
      <PerformanceCards performance={data.performance} />

      {/* Allocation Targets / Rebalancing */}
      <AllocationTargets data={data.allocation} summary={data.summary} />
    </div>
  );
}
