"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import type { InvestmentAnalyticsData, PerformanceData } from "./analytics-types";
import { typeColors } from "./analytics-types";

const HIDDEN = "•••••";

interface PerformanceCardsProps {
  performance: InvestmentAnalyticsData["performance"];
}

export function PerformanceCards({ performance }: PerformanceCardsProps) {
  const t = useTranslations("investments");
  const { privacy } = usePreferences();
  const { formatCurrency } = useCurrency();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  const hasTop = performance.top.length > 0;
  const hasWorst = performance.worst.length > 0;

  if (!hasTop && !hasWorst) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {hasTop && (
        <PerformanceList
          title={t("bestPerformance")}
          items={performance.top}
          variant="positive"
          fmt={fmt}
        />
      )}

      {hasWorst && (
        <PerformanceList
          title={t("needsAttention")}
          items={performance.worst}
          variant="negative"
          fmt={fmt}
        />
      )}
    </div>
  );
}

interface PerformanceListProps {
  title: string;
  items: PerformanceData[];
  variant: "positive" | "negative";
  fmt: (v: number) => string;
}

function PerformanceList({ title, items, variant, fmt }: PerformanceListProps) {
  const isPositive = variant === "positive";
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const iconBg = isPositive ? "bg-emerald-500/10" : "bg-red-500/10";
  const iconColor = isPositive ? "text-emerald-400" : "text-red-400";
  const valueColor = isPositive ? "text-emerald-400" : "text-red-400";
  const valueSubColor = isPositive ? "text-emerald-400/80" : "text-red-400/80";

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.investmentId}
            className="flex items-center justify-between p-3 bg-[var(--bg-hover)] rounded-xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                  !isPositive ? "opacity-60" : ""
                }`}
                style={{ backgroundColor: typeColors[item.type] || "#6B7280" }}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {item.name}
                </p>
                {item.ticker && (
                  <p className="text-xs text-[var(--text-dimmed)]">{item.ticker}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${valueColor}`}>
                {isPositive ? "+" : ""}
                {item.profitLossPercent.toFixed(1)}%
              </p>
              <p className={`text-xs ${valueSubColor}`}>
                {isPositive ? "+" : ""}
                {fmt(item.profitLoss)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
