"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import type {
  TaxCalculationResult,
  TaxByTypeDetail,
  TaxOperationDetail,
  TaxableAssetType,
} from "@/lib/tax-calculator";
import { TAX_RULES } from "@/lib/tax-calculator";

const HIDDEN = "•••••";

const TYPE_COLORS: Record<TaxableAssetType, string> = {
  stock: "#8B5CF6",
  fii: "#10B981",
  etf: "#3B82F6",
  crypto: "#F59E0B",
};

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (m === 1) return `${year - 1}-12`;
  return `${year}-${String(m - 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (m === 12) return `${year + 1}-01`;
  return `${year}-${String(m + 1).padStart(2, "0")}`;
}

interface TaxCalculatorCardProps {
  refreshKey?: number;
}

export function TaxCalculatorCard({ refreshKey = 0 }: TaxCalculatorCardProps) {
  const t = useTranslations("tax");
  const tc = useTranslations("common");
  const tm = useTranslations("months");
  const [data, setData] = useState<TaxCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [showOperations, setShowOperations] = useState(false);

  const { privacy } = usePreferences();
  const { formatCurrency } = useCurrency();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  const formatMonth = useCallback((monthStr: string): string => {
    const [year, m] = monthStr.split("-");
    return `${tm(MONTH_KEYS[parseInt(m) - 1])} ${year}`;
  }, [tm]);

  const currentMonth = getCurrentMonth();
  const canGoNext = month < currentMonth;

  const fetchData = useCallback(async (m: string) => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/investments/tax?month=${m}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(month);
  }, [month, fetchData, refreshKey]);

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Calculator className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              {t("title")}
            </h3>
          </div>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-red-400 mb-3">{t("loadError")}</p>
          <button
            onClick={() => fetchData(month)}
            className="text-sm text-primary-color hover:underline"
          >
            {tc("retry")}
          </button>
        </div>
      </div>
    );
  }

  const hasOperations = data && data.operations.length > 0;
  const typeEntries = data
    ? (Object.entries(data.byType) as [TaxableAssetType, TaxByTypeDetail][])
    : [];

  // Check for accumulated losses
  const hasAccumulatedLosses =
    data &&
    Object.values(data.accumulatedLosses).some((v) => v < 0);

  // Collect DARF codes with tax due
  const darfCodes = typeEntries
    .filter(([, detail]) => detail.taxDue > 0)
    .map(([type]) => TAX_RULES[type].darfCode)
    .filter((code, i, arr) => arr.indexOf(code) === i);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6 max-h-[540px] overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Calculator className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            {t("title")}
          </h3>
          <p className="text-xs text-[var(--text-dimmed)]">{t("subtitle")}</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => setMonth(prevMonth(month))}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
        <span className="text-sm font-medium text-[var(--text-primary)] min-w-[160px] text-center">
          {formatMonth(month)}
        </span>
        <button
          onClick={() => canGoNext && setMonth(nextMonth(month))}
          disabled={!canGoNext}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Empty state */}
      {!hasOperations ? (
        <div className="text-center py-6 flex flex-col items-center justify-center">
          <div className="p-4 bg-amber-500/10 rounded-2xl mb-4">
            <Calculator className="w-12 h-12 text-amber-400/50" />
          </div>
          <p className="text-base font-medium text-[var(--text-muted)] mb-2">
            {t("noSales")}
          </p>
          <p className="text-sm text-[var(--text-dimmed)] max-w-[220px]">
            {t("noSalesHint")}
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("sales")}</p>
              <p className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {fmt(data!.summary.totalSales)}
              </p>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("result")}</p>
              <p
                className={`text-sm sm:text-base font-bold ${
                  data!.summary.netResult >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {privacy.hideValues
                  ? HIDDEN
                  : `${data!.summary.netResult >= 0 ? "+" : ""}${formatCurrency(data!.summary.netResult)}`}
              </p>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
              <p className="text-xs text-[var(--text-dimmed)]">{t("taxDue")}</p>
              <p
                className={`text-sm sm:text-base font-bold ${
                  data!.summary.taxPayable > 0
                    ? "text-amber-400"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {fmt(data!.summary.taxPayable)}
              </p>
            </div>
          </div>

          {/* DARF indicator */}
          {data!.summary.hasTaxDue && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-400">
                  {t("darfToPay", { amount: fmt(data!.summary.taxPayable) })}
                </p>
                {darfCodes.length > 0 && (
                  <p className="text-xs text-amber-400/70">
                    {t("darfCodes", { codes: darfCodes.join(", ") })}
                  </p>
                )}
                {data!.summary.irrf > 0 && (
                  <p className="text-xs text-[var(--text-dimmed)] mt-0.5">
                    {t("irrfDeducted", { amount: fmt(data!.summary.irrf) })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Type breakdown */}
          <div className="space-y-2 mb-4">
            <p className="text-xs text-[var(--text-dimmed)]">{t("byAssetType")}</p>
            {typeEntries.map(([type, detail]) => {
              const isExpanded = expandedTypes.has(type);
              const netResult =
                detail.swingTrade.net + detail.dayTrade.net;
              const isPositive = netResult >= 0;

              return (
                <div
                  key={type}
                  className="bg-[var(--bg-hover)] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleType(type)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: TYPE_COLORS[type] }}
                      />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {detail.typeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isPositive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {privacy.hideValues
                          ? HIDDEN
                          : `${isPositive ? "+" : ""}${formatCurrency(netResult)}`}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--text-dimmed)] transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-[var(--border-color)]">
                      {/* Swing Trade */}
                      {(detail.swingTrade.sales > 0 ||
                        detail.dayTrade.sales > 0) && (
                        <div className="pt-3 space-y-2">
                          {detail.swingTrade.sales > 0 && (
                            <TradeTypeSection
                              label={t("swingTrade")}
                              data={detail.swingTrade}
                              fmt={fmt}
                              privacy={privacy.hideValues}
                              formatCurrency={formatCurrency}
                              translations={{
                                exempt: t("exempt"),
                                sales: t("sales"),
                                profit: t("profitLabel"),
                                loss: t("lossLabel"),
                                net: t("netLabel"),
                                irPercent: (percent) => t("irPercent", { percent }),
                              }}
                            />
                          )}
                          {detail.dayTrade.sales > 0 && (
                            <TradeTypeSection
                              label={t("dayTrade")}
                              data={detail.dayTrade}
                              fmt={fmt}
                              privacy={privacy.hideValues}
                              formatCurrency={formatCurrency}
                              translations={{
                                exempt: t("exempt"),
                                sales: t("sales"),
                                profit: t("profitLabel"),
                                loss: t("lossLabel"),
                                net: t("netLabel"),
                                irPercent: (percent) => t("irPercent", { percent }),
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Loss used + remaining */}
                      {detail.accumulatedLossUsed > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-dimmed)]">
                            {t("compensatedLoss")}
                          </span>
                          <span className="text-amber-400">
                            -{fmt(detail.accumulatedLossUsed)}
                          </span>
                        </div>
                      )}
                      {detail.accumulatedLossRemaining < 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-dimmed)]">
                            {t("accumulatedLoss")}
                          </span>
                          <span className="text-red-400">
                            {fmt(detail.accumulatedLossRemaining)}
                          </span>
                        </div>
                      )}

                      {/* IRRF */}
                      {detail.irrf > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-dimmed)]">{t("irrf")}</span>
                          <span className="text-[var(--text-muted)]">
                            {fmt(detail.irrf)}
                          </span>
                        </div>
                      )}

                      {/* Tax for this type */}
                      {detail.taxDue > 0 && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-color)]">
                          <span className="text-[var(--text-muted)] font-medium">
                            {t("taxCalc", { code: TAX_RULES[type].darfCode })}
                          </span>
                          <span className="text-amber-400 font-medium">
                            {fmt(detail.taxDue)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Operations toggle */}
          {data!.operations.length > 0 && (
            <div>
              <button
                onClick={() => setShowOperations(!showOperations)}
                className="flex items-center gap-1.5 text-xs text-primary-color hover:underline mb-2"
              >
                <FileText className="w-3.5 h-3.5" />
                {showOperations
                  ? t("hideOperations")
                  : t("showOperations", { count: data!.operations.length })}
              </button>

              {showOperations && (
                <div className="space-y-1.5">
                  {data!.operations.map((op, i) => (
                    <OperationRow
                      key={`${op.investmentId}-${op.date}-${i}`}
                      op={op}
                      fmt={fmt}
                      privacy={privacy.hideValues}
                      formatCurrency={formatCurrency}
                      translations={{
                        dtLabel: t("dtLabel"),
                        stLabel: t("stLabel"),
                      }}
                      locale="pt-BR"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accumulated losses footer */}
          {hasAccumulatedLosses && (
            <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-dimmed)] mb-2">
                {t("accumulatedLosses")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  Object.entries(data!.accumulatedLosses) as [
                    TaxableAssetType,
                    number,
                  ][]
                )
                  .filter(([, v]) => v < 0)
                  .map(([type, value]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between text-xs bg-[var(--bg-hover)] rounded-lg px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: TYPE_COLORS[type] }}
                        />
                        <span className="text-[var(--text-muted)]">
                          {TAX_RULES[type].label}
                        </span>
                      </div>
                      <span className="text-red-400 font-medium">
                        {fmt(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function TradeTypeSection({
  label,
  data,
  fmt,
  privacy,
  formatCurrency,
  translations,
}: {
  label: string;
  data: {
    sales: number;
    gains: number;
    losses: number;
    net: number;
    exempt?: boolean;
    taxRate: number;
    tax: number;
  };
  fmt: (v: number) => string;
  privacy: boolean;
  formatCurrency: (v: number) => string;
  translations: {
    exempt: string;
    sales: string;
    profit: string;
    loss: string;
    net: string;
    irPercent: (percent: string) => string;
  };
}) {
  return (
    <div className="bg-[var(--bg-primary)]/50 rounded-lg p-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {label}
        </span>
        {data.exempt && (
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
            {translations.exempt}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-[var(--text-dimmed)]">{translations.sales}</span>
          <span className="text-[var(--text-muted)]">{fmt(data.sales)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-dimmed)]">{translations.profit}</span>
          <span className="text-emerald-400">{fmt(data.gains)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-dimmed)]">{translations.loss}</span>
          <span className="text-red-400">{fmt(Math.abs(data.losses))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-dimmed)]">{translations.net}</span>
          <span
            className={
              data.net >= 0 ? "text-emerald-400" : "text-red-400"
            }
          >
            {privacy
              ? HIDDEN
              : `${data.net >= 0 ? "+" : ""}${formatCurrency(data.net)}`}
          </span>
        </div>
      </div>
      {!data.exempt && data.tax > 0 && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-color)]">
          <span className="text-[var(--text-dimmed)]">
            {translations.irPercent((data.taxRate * 100).toFixed(0))}
          </span>
          <span className="text-amber-400">{fmt(data.tax)}</span>
        </div>
      )}
    </div>
  );
}

function OperationRow({
  op,
  fmt,
  privacy,
  formatCurrency,
  translations,
  locale,
}: {
  op: TaxOperationDetail;
  fmt: (v: number) => string;
  privacy: boolean;
  formatCurrency: (v: number) => string;
  translations: {
    dtLabel: string;
    stLabel: string;
  };
  locale: string;
}) {
  const isPositive = op.gain >= 0;
  const GainIcon = isPositive ? TrendingUp : TrendingDown;
  const isDayTrade = op.tradeType === "day_trade";

  return (
    <div className="flex items-center justify-between p-2 bg-[var(--bg-hover)] rounded-lg">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: TYPE_COLORS[op.assetType] }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-[var(--text-primary)] truncate">
              {op.ticker || op.investmentName}
            </p>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                isDayTrade
                  ? "bg-red-500/10 text-red-400"
                  : "bg-blue-500/10 text-blue-400"
              }`}
            >
              {isDayTrade ? translations.dtLabel : translations.stLabel}
            </span>
          </div>
          <p className="text-xs text-[var(--text-dimmed)]">
            {new Date(op.date + "T12:00:00").toLocaleDateString(locale)} ·{" "}
            {op.quantity} un · PM: {fmt(op.avgPrice)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <GainIcon
          className={`w-3 h-3 ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        />
        <span
          className={`text-sm font-medium ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {privacy
            ? HIDDEN
            : `${isPositive ? "+" : ""}${formatCurrency(op.gain)}`}
        </span>
      </div>
    </div>
  );
}
