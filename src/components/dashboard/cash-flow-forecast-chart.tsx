"use client";

import { useState, useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronDown, TrendingDown, TrendingUp, RefreshCw, Eye, EyeOff, AlertTriangle, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { usePreferences } from "@/contexts";
import { useCashFlowForecast } from "@/hooks";
import { SetupPinModal, VerifyPinModal } from "@/components/privacy";
import { Skeleton } from "@/components/ui/skeleton";
import type { CashFlowDataPoint, ForecastPeriod } from "@/types/api-responses";

const HIDDEN = "•••••";

const PERIOD_OPTIONS: { value: ForecastPeriod; key: string }[] = [
  { value: 30, key: "forecastPeriod30" },
  { value: 60, key: "forecastPeriod60" },
  { value: 90, key: "forecastPeriod90" },
];

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
  dataKey: string;
  payload: CashFlowDataPoint;
}

function ChartTooltip({
  active,
  payload,
  hideValues,
  formatCurrency,
  labels,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  hideValues?: boolean;
  formatCurrency: (value: number) => string;
  labels: { balance: string; income: string; expenses: string };
}) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as CashFlowDataPoint;
    if (!data) return null;
    const fmt = (v: number) => (hideValues ? HIDDEN : formatCurrency(v));

    return (
      <div
        className="rounded-lg p-3 shadow-xl"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)",
        }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          {data.label}
        </p>
        <div className="space-y-1 text-xs">
          <p style={{ color: data.isNegative ? "#EF4444" : "#10B981" }}>
            {labels.balance}: <span className="font-medium">{fmt(data.balance)}</span>
          </p>
          {data.income > 0 && (
            <p style={{ color: "#10B981" }}>
              +{labels.income}: <span className="font-medium">{fmt(data.income)}</span>
            </p>
          )}
          {data.expenses > 0 && (
            <p style={{ color: "#EF4444" }}>
              -{labels.expenses}: <span className="font-medium">{fmt(data.expenses)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
}

interface CashFlowForecastChartProps {
  refreshTrigger?: number;
}

export function CashFlowForecastChart({ refreshTrigger = 0 }: CashFlowForecastChartProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { formatCurrency } = useCurrency();
  const { privacy, toggleHideValues, setSessionUnlocked, updatePrivacy, refreshPinStatus } = usePreferences();
  const descriptionId = useId();

  const [period, setPeriod] = useState<ForecastPeriod>(30);
  const [showSetupPinModal, setShowSetupPinModal] = useState(false);
  const [showVerifyPinModal, setShowVerifyPinModal] = useState(false);

  const { data, isLoading, refresh } = useCashFlowForecast(period, [refreshTrigger]);

  const handleToggleVisibility = () => {
    const result = toggleHideValues();
    if (result.needsSetupPin) {
      setShowSetupPinModal(true);
    } else if (result.needsPin) {
      setShowVerifyPinModal(true);
    }
  };

  const handlePinSetupSuccess = async () => {
    await refreshPinStatus();
    updatePrivacy({ hideValues: true });
    setShowSetupPinModal(false);
  };

  const handlePinVerified = () => {
    setSessionUnlocked(true);
    updatePrivacy({ hideValues: false });
    setShowVerifyPinModal(false);
  };

  const summary = data?.summary || {
    currentBalance: 0,
    projectedEndBalance: 0,
    lowestBalance: 0,
    lowestBalanceDate: "",
    totalExpectedIncome: 0,
    totalExpectedExpenses: 0,
    daysUntilNegative: null,
  };

  const alerts = data?.alerts || [];
  const hasNegativeProjection = summary.daysUntilNegative !== null;
  const isEndBalancePositive = summary.projectedEndBalance >= 0;

  return (
    <div
      className="backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-colors duration-300 h-full overflow-hidden"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <h3 className="text-sm sm:text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {t("cashFlowForecast")}
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleToggleVisibility}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={privacy.hideValues ? t("showValues") : t("hideValues")}
            aria-label={privacy.hideValues ? t("showValues") : t("hideValues")}
          >
            {privacy.hideValues ? (
              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={tc("refresh")}
            aria-label={tc("refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value) as ForecastPeriod)}
              className="appearance-none select-icon-manual cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 pr-6 sm:pr-8 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-color)",
              }}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.key)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        </div>
      </div>

      {/* Summary Values */}
      <div className="mb-3 sm:mb-4">
        <p className="text-lg sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {privacy.hideValues ? HIDDEN : formatCurrency(summary.projectedEndBalance)}
        </p>
        {privacy.hideValues ? (
          <div className="flex items-center gap-1 mt-1">
            <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--text-dimmed)]" />
            <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-dimmed)" }}>
              {t("discreteMode")}
            </span>
          </div>
        ) : hasNegativeProjection ? (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-sm font-medium text-red-400">
              {t("negativeIn", { days: summary.daysUntilNegative as number })}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {isEndBalancePositive ? (
              <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
            )}
            <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-dimmed)" }}>
              {t("projectedEndBalance")}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <p id={descriptionId} className="sr-only">
        {t("cashFlowForecastDesc")}
        {privacy.hideValues && ` ${t("valuesHidden")}.`}
      </p>
      <div className="h-48 sm:h-60" role="img" aria-describedby={descriptionId}>
        {isLoading ? (
          <div className="h-full flex flex-col justify-end">
            <div className="flex items-end justify-between gap-2 h-44">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
          </div>
        ) : data && data.forecast.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.forecast}>
              <defs>
                <linearGradient id="colorCashFlowPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCashFlowNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                tickFormatter={(value) =>
                  privacy.hideValues
                    ? "•••"
                    : value >= 1000
                      ? `${(value / 1000).toFixed(0)}k`
                      : value <= -1000
                        ? `${(value / 1000).toFixed(0)}k`
                        : value.toString()
                }
                width={40}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    hideValues={privacy.hideValues}
                    formatCurrency={formatCurrency}
                    labels={{
                      balance: t("balance"),
                      income: t("income"),
                      expenses: t("expenses"),
                    }}
                  />
                }
              />
              <ReferenceLine y={0} stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="balance"
                name={t("balance")}
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCashFlowPositive)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-center" style={{ color: "var(--text-dimmed)" }}>
              {t("noForecastData")}
            </p>
            <p className="text-xs text-center" style={{ color: "var(--text-dimmed)" }}>
              {t("addTransactionsForForecast")}
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border-color)]">
        <div className="text-center min-w-0">
          <span className="text-[9px] sm:text-xs block truncate" style={{ color: "var(--text-dimmed)" }}>
            {t("currentBalanceLabel")}
          </span>
          <p className="text-[10px] sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.currentBalance)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <span className="text-[9px] sm:text-xs block truncate" style={{ color: "var(--text-dimmed)" }}>
            {t("expectedIncome")}
          </span>
          <p className="text-[10px] sm:text-sm font-medium text-emerald-400 truncate">
            {privacy.hideValues ? HIDDEN : `+${formatCurrency(summary.totalExpectedIncome)}`}
          </p>
        </div>
        <div className="text-center min-w-0">
          <span className="text-[9px] sm:text-xs block truncate" style={{ color: "var(--text-dimmed)" }}>
            {t("expectedExpenses")}
          </span>
          <p className="text-[10px] sm:text-sm font-medium text-red-400 truncate">
            {privacy.hideValues ? HIDDEN : `-${formatCurrency(summary.totalExpectedExpenses)}`}
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border-color)]">
          <h4 className="text-xs sm:text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            {t("alerts")}
          </h4>
          <div className="space-y-1.5">
            {alerts.slice(0, 3).map((alert, index) => (
              <div
                key={`${alert.type}-${alert.date}-${index}`}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  alert.severity === "danger" ? "bg-red-500/10" : "bg-amber-500/10"
                }`}
              >
                <AlertTriangle
                  className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                    alert.severity === "danger" ? "text-red-400" : "text-amber-400"
                  }`}
                />
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium ${
                      alert.severity === "danger" ? "text-red-400" : "text-amber-400"
                    }`}
                  >
                    {alert.type === "negative_balance"
                      ? t("negativeBalanceAlert")
                      : alert.type === "low_balance"
                        ? t("lowBalanceAlert")
                        : t("highExpenseAlert")}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-dimmed)" }}>
                    {alert.date.split("-").reverse().join("/")} -{" "}
                    {privacy.hideValues
                      ? HIDDEN
                      : t("projectedBalance", { value: formatCurrency(alert.projectedBalance) })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIN Modals */}
      <SetupPinModal
        open={showSetupPinModal}
        onClose={() => setShowSetupPinModal(false)}
        onSuccess={handlePinSetupSuccess}
      />
      <VerifyPinModal
        open={showVerifyPinModal}
        onClose={() => setShowVerifyPinModal(false)}
        onVerified={handlePinVerified}
      />
    </div>
  );
}
