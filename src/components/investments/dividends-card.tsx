"use client";

import { useState, useEffect } from "react";
import { Coins, TrendingUp, Calendar, RefreshCw, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";

const HIDDEN = "•••••";

interface DividendData {
  id: string;
  investmentId: string;
  investmentName: string;
  ticker?: string;
  type: string;
  value: number;
  date: string;
  notes?: string;
}

interface DividendsSummary {
  thisMonth: number;
  thisYear: number;
  lastMonth: number;
  last12Months: number;
  averageMonthly: number;
  yieldOnCost: number;
}

interface DividendsData {
  summary: DividendsSummary;
  recent: DividendData[];
  byInvestment: {
    investmentId: string;
    investmentName: string;
    ticker?: string;
    total: number;
    count: number;
  }[];
  monthlyHistory: {
    month: string;
    value: number;
  }[];
}

const typeColors: Record<string, string> = {
  stock: "#8B5CF6",
  fii: "#10B981",
  etf: "#3B82F6",
  crypto: "#F59E0B",
  other: "#6B7280",
};

export function DividendsCard() {
  const [data, setData] = useState<DividendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const t = useTranslations("investments");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { privacy } = usePreferences();
  const { formatCurrency } = useCurrency();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));
  const getDateLocale = () => locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/investments/dividends");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching dividends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  const hasData = data && (data.summary.thisYear > 0 || data.recent.length > 0);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6 max-h-[440px] overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Coins className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            {t("dividends")}
          </h3>
          {hasData && (
            <p className="text-xs text-[var(--text-dimmed)]">
              {t("yieldOnCost", { yield: data.summary.yieldOnCost.toFixed(2) })}
            </p>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-6 flex flex-col items-center justify-center">
          <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4">
            <Coins className="w-12 h-12 text-emerald-400/50" />
          </div>
          <p className="text-base font-medium text-[var(--text-muted)] mb-2">
            {t("noDividends")}
          </p>
          <p className="text-sm text-[var(--text-dimmed)] max-w-[200px]">
            {t("dividendsHint")}
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("thisMonthLabel")}</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400">
                {fmt(data.summary.thisMonth)}
              </p>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("thisYearLabel")}</p>
              <p className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {fmt(data.summary.thisYear)}
              </p>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("avgPerMonth")}</p>
              <p className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {fmt(data.summary.averageMonthly)}
              </p>
            </div>
          </div>

          {/* Mini Chart - Monthly History */}
          {data.monthlyHistory.some((m) => m.value > 0) && (
            <div className="mb-4">
              <p className="text-xs text-[var(--text-dimmed)] mb-2">{t("last6Months")}</p>
              <div className="flex items-end gap-1 h-16">
                {data.monthlyHistory.map((month, index) => {
                  const maxValue = Math.max(...data.monthlyHistory.map((m) => m.value));
                  const height = maxValue > 0 ? (month.value / maxValue) * 100 : 0;
                  const isCurrentMonth = index === data.monthlyHistory.length - 1;

                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrentMonth ? "bg-emerald-500" : "bg-emerald-500/40"
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${month.month}: ${formatCurrency(month.value)}`}
                      />
                      <span className="text-[10px] text-[var(--text-dimmed)]">
                        {month.month.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Dividends */}
          {data.recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[var(--text-dimmed)]">{t("lastReceived")}</p>
                {data.recent.length > 3 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-primary-color hover:underline flex items-center gap-0.5"
                  >
                    {showAll ? tc("showLess") : tc("showMore")}
                    <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? "rotate-90" : ""}`} />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(showAll ? data.recent : data.recent.slice(0, 3)).map((dividend) => (
                  <div
                    key={dividend.id}
                    className="flex items-center justify-between p-2 bg-[var(--bg-hover)] rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: typeColors[dividend.type] || "#6B7280" }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">
                          {dividend.ticker || dividend.investmentName}
                        </p>
                        <p className="text-xs text-[var(--text-dimmed)]">
                          {new Date(dividend.date).toLocaleDateString(getDateLocale())}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-emerald-400 flex-shrink-0">
                      +{fmt(dividend.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison vs Last Month */}
          {data.summary.lastMonth > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{tc("vsPrevMonth")}</span>
                {(() => {
                  const diff = data.summary.thisMonth - data.summary.lastMonth;
                  const diffPercent = data.summary.lastMonth > 0
                    ? ((diff / data.summary.lastMonth) * 100)
                    : 0;
                  const isPositive = diff >= 0;

                  return (
                    <span className={`font-medium flex items-center gap-1 ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${!isPositive ? "rotate-180" : ""}`} />
                      {isPositive ? "+" : ""}{diffPercent.toFixed(0)}%
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Export a props-based version for use in the investments page
export function DividendsCardWithData({ data }: { data: DividendsData | null }) {
  const [showAll, setShowAll] = useState(false);
  const t = useTranslations("investments");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { privacy } = usePreferences();
  const { formatCurrency } = useCurrency();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));
  const getDateLocale = () => locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  const hasData = data && (data.summary.thisYear > 0 || data.recent.length > 0);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6 max-h-[440px] overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Coins className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            {t("dividends")}
          </h3>
          {hasData && data && (
            <p className="text-xs text-[var(--text-dimmed)]">
              {t("yieldOnCost", { yield: data.summary.yieldOnCost.toFixed(2) })}
            </p>
          )}
        </div>
      </div>

      {!hasData || !data ? (
        <div className="text-center py-6 flex flex-col items-center justify-center">
          <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4">
            <Coins className="w-12 h-12 text-emerald-400/50" />
          </div>
          <p className="text-base font-medium text-[var(--text-muted)] mb-2">
            {t("noDividends")}
          </p>
          <p className="text-sm text-[var(--text-dimmed)] max-w-[200px]">
            {t("dividendsHint")}
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("thisMonthLabel")}</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400">
                {fmt(data.summary.thisMonth)}
              </p>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("thisYearLabel")}</p>
              <p className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {fmt(data.summary.thisYear)}
              </p>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("avgPerMonth")}</p>
              <p className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {fmt(data.summary.averageMonthly)}
              </p>
            </div>
          </div>

          {/* Mini Chart - Monthly History */}
          {data.monthlyHistory.some((m) => m.value > 0) && (
            <div className="mb-4">
              <p className="text-xs text-[var(--text-dimmed)] mb-2">{t("last6Months")}</p>
              <div className="flex items-end gap-1 h-16">
                {data.monthlyHistory.map((month, index) => {
                  const maxValue = Math.max(...data.monthlyHistory.map((m) => m.value));
                  const height = maxValue > 0 ? (month.value / maxValue) * 100 : 0;
                  const isCurrentMonth = index === data.monthlyHistory.length - 1;

                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrentMonth ? "bg-emerald-500" : "bg-emerald-500/40"
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${month.month}: ${formatCurrency(month.value)}`}
                      />
                      <span className="text-[10px] text-[var(--text-dimmed)]">
                        {month.month.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Dividends */}
          {data.recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[var(--text-dimmed)]">{t("lastReceived")}</p>
                {data.recent.length > 3 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-primary-color hover:underline flex items-center gap-0.5"
                  >
                    {showAll ? tc("showLess") : tc("showMore")}
                    <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? "rotate-90" : ""}`} />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(showAll ? data.recent : data.recent.slice(0, 3)).map((dividend) => (
                  <div
                    key={dividend.id}
                    className="flex items-center justify-between p-2 bg-[var(--bg-hover)] rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: typeColors[dividend.type] || "#6B7280" }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">
                          {dividend.ticker || dividend.investmentName}
                        </p>
                        <p className="text-xs text-[var(--text-dimmed)]">
                          {new Date(dividend.date).toLocaleDateString(getDateLocale())}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-emerald-400 flex-shrink-0">
                      +{fmt(dividend.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison vs Last Month */}
          {data.summary.lastMonth > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{tc("vsPrevMonth")}</span>
                {(() => {
                  const diff = data.summary.thisMonth - data.summary.lastMonth;
                  const diffPercent = data.summary.lastMonth > 0
                    ? ((diff / data.summary.lastMonth) * 100)
                    : 0;
                  const isPositive = diff >= 0;

                  return (
                    <span className={`font-medium flex items-center gap-1 ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${!isPositive ? "rotate-180" : ""}`} />
                      {isPositive ? "+" : ""}{diffPercent.toFixed(0)}%
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
