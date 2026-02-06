"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { useTheme, usePreferences } from "@/contexts";

const HIDDEN = "•••••";
import type { MonthlyEvolution, EvolutionPeriod } from "@/types";

interface MonthlyChartProps {
  data: MonthlyEvolution[];
  period: EvolutionPeriod;
  onPeriodChange: (period: EvolutionPeriod) => void;
}

const PERIOD_KEYS: { value: EvolutionPeriod; key: string }[] = [
  { value: "1w", key: "1w" },
  { value: "1m", key: "1m" },
  { value: "3m", key: "3m" },
  { value: "6m", key: "6m" },
  { value: "1y", key: "1y" },
];

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  hideValues,
  formatCurrency,
  incomeLabel,
  expensesLabel,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  hideValues?: boolean;
  formatCurrency: (value: number) => string;
  incomeLabel: string;
  expensesLabel: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg p-3 shadow-xl"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)"
        }}
      >
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{ color: entry.color }}
            className="text-sm font-medium"
          >
            {entry.name === "income" ? incomeLabel : expensesLabel}:{" "}
            {hideValues ? HIDDEN : formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function MonthlyChart({ data, period, onPeriodChange }: MonthlyChartProps) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("periods");
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  const { privacy } = usePreferences();
  const descriptionId = useId();
  const PERIOD_OPTIONS = PERIOD_KEYS.map(p => ({ value: p.value, label: tp(p.key) }));
  const currentPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || tp("6m");

  const axisTickColor = theme === "dark" ? "#9CA3AF" : "#4B5563";

  // Calculate totals for accessibility description
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);

  return (
    <div
      className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300 h-full overflow-hidden"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <style>{`
        .period-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: none;
        }
        .period-select::-ms-expand {
          display: none;
        }
        .period-select option {
          background-color: ${theme === "dark" ? "#1f2937" : "#ffffff"};
          color: ${theme === "dark" ? "#f3f4f6" : "#1f2937"};
        }
      `}</style>
      <div className="flex items-center justify-between mb-1 gap-2">
        <h3 className="text-base sm:text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {t("financialEvolution")}
        </h3>
        <div className="relative flex-shrink-0">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as EvolutionPeriod)}
            className="period-select appearance-none cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 pr-6 sm:pr-8 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-primary)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border-color)"
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>
      <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: "var(--text-dimmed)" }}>
        {t("incomeVsExpenses")}
      </p>
      <p id={descriptionId} className="sr-only">
        {t("chartDescription")} {currentPeriodLabel.toLowerCase()}.
        {privacy.hideValues ? ` ${t("valuesHidden")}.` : ` ${t("totalIncome")} ${formatCurrency(totalIncome)}. ${t("totalExpenses")} ${formatCurrency(totalExpense)}.`}
      </p>
      <div className="h-48 sm:h-64" role="img" aria-describedby={descriptionId}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 12 }}
              tickFormatter={(value) =>
                privacy.hideValues ? "•••" : `${(value / 1000).toFixed(0)}k`
              }
            />
            <Tooltip content={<ChartTooltip hideValues={privacy.hideValues} formatCurrency={formatCurrency} incomeLabel={t("income")} expensesLabel={t("expenses")} />} />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorReceitas)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="expense"
              stroke="#6366F1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDespesas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 sm:mt-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
          <span className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{t("income")}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-500" />
          <span className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{t("expenses")}</span>
        </div>
      </div>
    </div>
  );
}