"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  PieChart,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getCategoryColor } from "@/lib/constants";
import { usePreferences } from "@/contexts";

const HIDDEN = "•••••";

interface CardSpendingByCategory {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

interface CardMonthlySpending {
  month: string;
  monthLabel: string;
  total: number;
  cardBreakdown: {
    cardId: string;
    cardName: string;
    cardColor: string;
    total: number;
  }[];
}

interface CardAlert {
  type: "payment_due" | "high_usage" | "closing_soon";
  cardId: string;
  cardName: string;
  cardColor: string;
  message: string;
  value?: number;
  daysUntil?: number;
}

interface CardAnalyticsData {
  spendingByCategory: CardSpendingByCategory[];
  monthlySpending: CardMonthlySpending[];
  alerts: CardAlert[];
  summary: {
    totalCards: number;
    totalLimit: number;
    totalUsed: number;
    usagePercentage: number;
    averageMonthlySpending: number;
    totalSpendingLast6Months: number;
  };
}

export function CardAnalytics() {
  const [data, setData] = useState<CardAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/cards/analytics");
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

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxMonthlySpending = Math.max(...data.monthlySpending.map((m) => m.total));

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              Alertas de Cartões
            </h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {data.alerts.map((alert, index) => (
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
                    {alert.message}
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
        </div>
      )}

      {/* Summary */}
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-soft rounded-lg">
            <CreditCard className="w-5 h-5 text-primary-color" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            Resumo de Cartões
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--text-dimmed)]">Limite Total</p>
            <p className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              {fmt(data.summary.totalLimit)}
            </p>
          </div>
          <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--text-dimmed)]">Usado</p>
            <p className="text-base sm:text-lg font-bold text-red-400">
              {fmt(data.summary.totalUsed)}
            </p>
          </div>
          <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--text-dimmed)]">Uso do Limite</p>
            <p
              className={`text-base sm:text-lg font-bold ${
                data.summary.usagePercentage >= 80
                  ? "text-red-400"
                  : data.summary.usagePercentage >= 50
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {data.summary.usagePercentage.toFixed(0)}%
            </p>
          </div>
          <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--text-dimmed)]">Média Mensal</p>
            <p className="text-base sm:text-lg font-bold text-primary-color">
              {fmt(data.summary.averageMonthlySpending)}
            </p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-dimmed)]">Uso do limite total</span>
            <span
              className={
                data.summary.usagePercentage >= 80
                  ? "text-red-400"
                  : data.summary.usagePercentage >= 50
                  ? "text-amber-400"
                  : "text-emerald-400"
              }
            >
              {fmt(data.summary.totalUsed)} / {fmt(data.summary.totalLimit)}
            </span>
          </div>
          <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                data.summary.usagePercentage >= 80
                  ? "bg-red-500"
                  : data.summary.usagePercentage >= 50
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(data.summary.usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Spending Trend */}
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            Evolução Mensal
          </h3>
        </div>

        <div className="flex items-end justify-between h-32 gap-2">
          {data.monthlySpending.map((month) => (
            <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-24 flex items-end justify-center">
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
              Gastos por Categoria
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
  );
}
