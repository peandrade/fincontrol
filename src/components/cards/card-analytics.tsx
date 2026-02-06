"use client";

import {
  TrendingUp,
  PieChart,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getCategoryColor } from "@/lib/constants";
import { useCurrency } from "@/contexts/currency-context";
import { usePreferences } from "@/contexts";
import { useCardStore } from "@/store/card-store";
import type {
  CardSpendingByCategory,
  CardMonthlySpending,
  CardAlert,
  CardAnalyticsData,
} from "@/store/card-store";

const HIDDEN = "•••••";

// Re-export types for backwards compatibility
export type { CardSpendingByCategory, CardMonthlySpending, CardAlert, CardAnalyticsData };

export function CardAnalytics() {
  const t = useTranslations("cards");
  // Get analytics directly from store (updates automatically like InvoicePreviewChart)
  const getAnalytics = useCardStore((state) => state.getAnalytics);
  const data = getAnalytics();

  const { formatCurrency } = useCurrency();
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  if (!data || data.monthlySpending.length === 0) return null;

  const maxMonthlySpending = Math.max(...data.monthlySpending.map((m) => m.total));

  return (
    <div className="space-y-6">
      {/* Grid: Monthly Spending Trend + Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                {t("monthlyEvolution")}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-dimmed)]">{t("monthlyAverage")}</p>
              <p className="text-sm font-bold text-primary-color">
                {fmt(data.summary.averageMonthlySpending)}
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between h-48 gap-2 mt-4">
            {data.monthlySpending.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-36 flex items-end justify-center">
                  <div
                    className="w-full max-w-[40px] bg-primary-gradient rounded-t transition-all"
                    style={{
                      height: `${maxMonthlySpending > 0 ? (month.total / maxMonthlySpending) * 100 : 0}%`,
                      minHeight: month.total > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-[var(--text-dimmed)] capitalize">
                  {month.monthLabel}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">
                  {fmt(month.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by Category */}
        {data.spendingByCategory.length > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <PieChart className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                {t("spendingByCategory")}
              </h3>
            </div>

            <div className="space-y-2">
              {data.spendingByCategory.slice(0, 6).map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: `${getCategoryColor(cat.category)}20`, color: getCategoryColor(cat.category) }}
                  >
                    {cat.category.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--text-primary)] truncate">
                        {cat.category}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {fmt(cat.total)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: getCategoryColor(cat.category),
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-dimmed)] w-12 text-right">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component to render card alerts (for use in popups)
export function CardAlertsContent({ alerts }: { alerts: CardAlert[] }) {
  const t = useTranslations("cards");
  const { formatCurrency } = useCurrency();
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  if (alerts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--text-muted)]">{t("noAlertsAtMoment")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            alert.type === "payment_due"
              ? "bg-red-500/10 border-red-500/30"
              : alert.type === "closing_soon"
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-orange-500/10 border-orange-500/30"
          }`}
        >
          <div
            className="w-8 h-6 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: alert.cardColor }}
          >
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {alert.cardName}
            </p>
            <p
              className={`text-xs ${
                alert.type === "payment_due"
                  ? "text-red-400"
                  : alert.type === "closing_soon"
                  ? "text-amber-400"
                  : "text-orange-400"
              }`}
            >
              {t(alert.messageKey, alert.messageParams)}
            </p>
          </div>
          {alert.value && (
            <span
              className={`text-sm font-bold shrink-0 ${
                alert.type === "payment_due" ? "text-red-400" : "text-orange-400"
              }`}
            >
              {fmt(alert.value)}
            </span>
          )}
          {alert.type === "payment_due" || alert.type === "closing_soon" ? (
            <Clock
              className={`w-4 h-4 shrink-0 ${
                alert.type === "payment_due" ? "text-red-400" : "text-amber-400"
              }`}
            />
          ) : (
            <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
