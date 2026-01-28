"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Lightbulb,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getCategoryColor } from "@/lib/constants";
import { usePreferences } from "@/contexts";

const HIDDEN = "•••••";

interface CategoryTrend {
  category: string;
  months: { month: string; value: number }[];
  trend: number;
  average: number;
}

interface DayOfWeekPattern {
  dayOfWeek: number;
  dayName: string;
  totalExpenses: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}

interface SpendingVelocity {
  currentMonth: {
    spent: number;
    dailyAverage: number;
    daysElapsed: number;
    projectedTotal: number;
  };
  comparison: {
    vsLastMonth: number;
    vsSameMonthLastYear: number;
  };
}

interface YearComparison {
  currentYear: number;
  previousYear: number;
  months: {
    month: number;
    monthName: string;
    currentYearExpenses: number;
    previousYearExpenses: number;
    currentYearIncome: number;
    previousYearIncome: number;
  }[];
  totals: {
    currentYearExpenses: number;
    previousYearExpenses: number;
    currentYearIncome: number;
    previousYearIncome: number;
    expenseChange: number;
    incomeChange: number;
  };
}

interface TopInsight {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  value?: number;
  category?: string;
}

interface AnalyticsData {
  dayOfWeekPatterns: DayOfWeekPattern[];
  categoryTrends: CategoryTrend[];
  spendingVelocity: SpendingVelocity;
  yearComparison: YearComparison;
  insights: TopInsight[];
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(["insights", "velocity"]);
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxDayExpense = Math.max(...data.dayOfWeekPatterns.map((d) => d.totalExpenses));

  return (
    <div className="space-y-6">
      {/* Insights Section */}
      {data.insights.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <button
            onClick={() => toggleSection("insights")}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Insights Inteligentes
              </h2>
            </div>
            {expandedSections.includes("insights") ? (
              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </button>

          {expandedSections.includes("insights") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    insight.type === "positive"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : insight.type === "negative"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        insight.type === "positive"
                          ? "bg-emerald-500/20"
                          : insight.type === "negative"
                          ? "bg-red-500/20"
                          : "bg-blue-500/20"
                      }`}
                    >
                      {insight.type === "positive" ? (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      ) : insight.type === "negative" ? (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      ) : (
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          insight.type === "positive"
                            ? "text-emerald-400"
                            : insight.type === "negative"
                            ? "text-red-400"
                            : "text-blue-400"
                        }`}
                      >
                        {insight.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spending Velocity */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <button
          onClick={() => toggleSection("velocity")}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-soft rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-color" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Velocidade de Gastos
            </h2>
          </div>
          {expandedSections.includes("velocity") ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </button>

        {expandedSections.includes("velocity") && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)]">Gasto até agora</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {fmt(data.spendingVelocity.currentMonth.spent)}
                </p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)]">Média diária</p>
                <p className="text-lg font-bold text-primary-color">
                  {fmt(data.spendingVelocity.currentMonth.dailyAverage)}
                </p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)]">Projeção mensal</p>
                <p className="text-lg font-bold text-amber-400">
                  {fmt(data.spendingVelocity.currentMonth.projectedTotal)}
                </p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)]">Dias passados</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {data.spendingVelocity.currentMonth.daysElapsed}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div
                className={`flex-1 p-3 rounded-xl border ${
                  data.spendingVelocity.comparison.vsLastMonth <= 0
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">vs mês passado</span>
                  <div className="flex items-center gap-1">
                    {data.spendingVelocity.comparison.vsLastMonth <= 0 ? (
                      <ArrowDown className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowUp className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        data.spendingVelocity.comparison.vsLastMonth <= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {Math.abs(data.spendingVelocity.comparison.vsLastMonth).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`flex-1 p-3 rounded-xl border ${
                  data.spendingVelocity.comparison.vsSameMonthLastYear <= 0
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">vs ano passado</span>
                  <div className="flex items-center gap-1">
                    {data.spendingVelocity.comparison.vsSameMonthLastYear <= 0 ? (
                      <ArrowDown className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowUp className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        data.spendingVelocity.comparison.vsSameMonthLastYear <= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {Math.abs(data.spendingVelocity.comparison.vsSameMonthLastYear).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day of Week Patterns */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <button
          onClick={() => toggleSection("dayOfWeek")}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Padrão por Dia da Semana
            </h2>
          </div>
          {expandedSections.includes("dayOfWeek") ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </button>

        {expandedSections.includes("dayOfWeek") && (
          <div className="space-y-2">
            {data.dayOfWeekPatterns.map((day) => (
              <div key={day.dayOfWeek} className="flex items-center gap-3">
                <span className="w-16 text-xs text-[var(--text-muted)]">{day.dayName}</span>
                <div className="flex-1 h-6 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-gradient rounded-full transition-all duration-500"
                    style={{
                      width: `${maxDayExpense > 0 ? (day.totalExpenses / maxDayExpense) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="w-24 text-right">
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {fmt(day.totalExpenses)}
                  </span>
                </div>
                <span className="w-12 text-right text-xs text-[var(--text-dimmed)]">
                  {day.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Trends */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <button
          onClick={() => toggleSection("trends")}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Tendências por Categoria
            </h2>
          </div>
          {expandedSections.includes("trends") ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </button>

        {expandedSections.includes("trends") && (
          <div className="space-y-3">
            {data.categoryTrends.slice(0, 6).map((category) => (
              <div
                key={category.category}
                className="flex items-center gap-3 p-3 bg-[var(--bg-hover)] rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `${getCategoryColor(category.category)}20`, color: getCategoryColor(category.category) }}
                >
                  {category.category.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {category.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {category.trend > 5 ? (
                        <ArrowUp className="w-3 h-3 text-red-400" />
                      ) : category.trend < -5 ? (
                        <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Minus className="w-3 h-3 text-[var(--text-muted)]" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          category.trend > 5
                            ? "text-red-400"
                            : category.trend < -5
                            ? "text-emerald-400"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {category.trend > 0 ? "+" : ""}
                        {category.trend.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--text-dimmed)]">
                      Média: {fmt(category.average)}/mês
                    </span>
                  </div>
                  {/* Mini sparkline */}
                  <div className="flex items-end gap-0.5 h-4 mt-2">
                    {category.months.map((month, i) => {
                      const maxValue = Math.max(...category.months.map((m) => m.value));
                      const height = maxValue > 0 ? (month.value / maxValue) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] rounded-t"
                          style={{ height: `${Math.max(height, 10)}%` }}
                          title={`${month.month}: ${fmt(month.value)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Year Comparison */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <button
          onClick={() => toggleSection("yearComparison")}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Comparativo Anual ({data.yearComparison.currentYear} vs {data.yearComparison.previousYear})
            </h2>
          </div>
          {expandedSections.includes("yearComparison") ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </button>

        {expandedSections.includes("yearComparison") && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-dimmed)] mb-2">Despesas Totais</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-red-400">
                    {fmt(data.yearComparison.totals.currentYearExpenses)}
                  </span>
                  <span
                    className={`text-xs ${
                      data.yearComparison.totals.expenseChange <= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {data.yearComparison.totals.expenseChange > 0 ? "+" : ""}
                    {data.yearComparison.totals.expenseChange.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-[var(--text-dimmed)] mt-1">
                  {data.yearComparison.previousYear}: {fmt(data.yearComparison.totals.previousYearExpenses)}
                </p>
              </div>

              <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-dimmed)] mb-2">Receitas Totais</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-400">
                    {fmt(data.yearComparison.totals.currentYearIncome)}
                  </span>
                  <span
                    className={`text-xs ${
                      data.yearComparison.totals.incomeChange >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {data.yearComparison.totals.incomeChange > 0 ? "+" : ""}
                    {data.yearComparison.totals.incomeChange.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-[var(--text-dimmed)] mt-1">
                  {data.yearComparison.previousYear}: {fmt(data.yearComparison.totals.previousYearIncome)}
                </p>
              </div>
            </div>

            {/* Monthly bars */}
            <div className="flex items-end justify-between h-32 gap-1 px-2">
              {data.yearComparison.months.map((month) => {
                const maxExpense = Math.max(
                  ...data.yearComparison.months.map((m) =>
                    Math.max(m.currentYearExpenses, m.previousYearExpenses)
                  )
                );
                const currentHeight =
                  maxExpense > 0 ? (month.currentYearExpenses / maxExpense) * 100 : 0;
                const previousHeight =
                  maxExpense > 0 ? (month.previousYearExpenses / maxExpense) * 100 : 0;

                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 w-full h-24">
                      <div
                        className="flex-1 bg-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] rounded-t"
                        style={{ height: `${previousHeight}%` }}
                        title={`${data.yearComparison.previousYear}: ${fmt(month.previousYearExpenses)}`}
                      />
                      <div
                        className="flex-1 bg-[var(--color-primary)] rounded-t"
                        style={{ height: `${currentHeight}%` }}
                        title={`${data.yearComparison.currentYear}: ${fmt(month.currentYearExpenses)}`}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-dimmed)]">{month.monthName}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] rounded" />
                <span className="text-[var(--text-dimmed)]">{data.yearComparison.previousYear}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[var(--color-primary)] rounded" />
                <span className="text-[var(--text-dimmed)]">{data.yearComparison.currentYear}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
