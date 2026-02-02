"use client";

import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getCategoryColor } from "@/lib/constants";
import { usePreferences } from "@/contexts";
import { useAnalytics } from "@/hooks";
import type { SpendingVelocity, TopInsight, AnalyticsData } from "@/hooks";

const HIDDEN = "•••••";

// Re-export types for backwards compatibility
export type { SpendingVelocity, TopInsight, AnalyticsData };

export function AdvancedAnalytics() {
  const { data, isLoading } = useAnalytics();
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

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
      {/* Grid: Day of Week Patterns + Category Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Patterns */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Padrão por Dia da Semana
            </h2>
          </div>

          <div className="flex items-end justify-between gap-2 h-56">
            {data.dayOfWeekPatterns.map((day) => (
              <div key={day.dayOfWeek} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center h-44 relative">
                  <div
                    className="w-full max-w-[36px] bg-primary-gradient rounded-t transition-all duration-500 cursor-pointer hover:opacity-80"
                    style={{
                      height: `${maxDayExpense > 0 ? (day.totalExpenses / maxDayExpense) * 100 : 0}%`,
                      minHeight: day.totalExpenses > 0 ? "4px" : "0px",
                    }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <p className="text-xs font-medium text-[var(--text-primary)]">{fmt(day.totalExpenses)}</p>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {day.dayName.slice(0, 3)}
                </span>
                <span className="text-xs text-[var(--text-dimmed)]">
                  {day.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Trends */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Tendências por Categoria
            </h2>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {data.categoryTrends.slice(0, 8).map((category) => (
              <div
                key={category.category}
                className="flex items-center gap-3 p-2.5 bg-[var(--bg-hover)] rounded-xl"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
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
                  <span className="text-xs text-[var(--text-dimmed)]">
                    Média: {fmt(category.average)}/mês
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to render insights (for use in popups)
export function InsightsContent({ insights }: { insights: TopInsight[] }) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--text-muted)]">Nenhum insight no momento</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {insights.map((insight, index) => (
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
  );
}

// Component to render spending velocity (for use in popups)
export function SpendingVelocityContent({ velocity }: { velocity: SpendingVelocity }) {
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-[var(--bg-hover)] rounded-lg p-3 text-center">
        <p className="text-[10px] text-[var(--text-dimmed)] mb-0.5">Média diária</p>
        <p className="text-sm font-bold text-primary-color">
          {fmt(velocity.currentMonth.dailyAverage)}
        </p>
      </div>
      <div className="bg-[var(--bg-hover)] rounded-lg p-3 text-center">
        <p className="text-[10px] text-[var(--text-dimmed)] mb-0.5">Projeção mensal</p>
        <p className="text-sm font-bold text-amber-400">
          {fmt(velocity.currentMonth.projectedTotal)}
        </p>
      </div>
    </div>
  );
}
