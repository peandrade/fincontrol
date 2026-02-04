"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  PieChart,
  Wallet,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import { useFinancialHealth } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";

const HIDDEN = "•••••";

const scoreColors = {
  excellent: { bg: "from-emerald-500 to-teal-500", text: "text-emerald-400", ring: "ring-emerald-500/30" },
  good: { bg: "from-blue-500 to-cyan-500", text: "text-blue-400", ring: "ring-blue-500/30" },
  fair: { bg: "from-amber-500 to-orange-500", text: "text-amber-400", ring: "ring-amber-500/30" },
  poor: { bg: "from-red-500 to-rose-500", text: "text-red-400", ring: "ring-red-500/30" },
};

interface FinancialHealthScoreProps {
  refreshTrigger?: number;
}

export function FinancialHealthScore({ refreshTrigger = 0 }: FinancialHealthScoreProps) {
  const { data, isLoading, refresh } = useFinancialHealth([refreshTrigger]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {/* Header skeleton */}
        <div className="bg-gradient-to-br from-gray-500/50 to-gray-600/50 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--bg-hover)] rounded-lg p-2">
                <Skeleton className="h-3 w-12 mb-1 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const colors = scoreColors[data.scoreLevel];
  const scorePercentage = (data.score / 1000) * 100;

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden">
      {/* Header with Score */}
      <div className={`bg-gradient-to-br ${colors.bg} p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Score Financeiro</h3>
              <p className="text-xs sm:text-sm text-white/80">{data.scoreMessage}</p>
            </div>
          </div>
          <button
            onClick={() => refresh()}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Atualizar"
            aria-label="Atualizar score financeiro"
          >
            <RefreshCw className="w-4 h-4 text-white/80" aria-hidden="true" />
          </button>
        </div>

        {/* Score Circle */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${scorePercentage * 2.83} 283`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-white">{data.score}</span>
              <span className="text-[10px] sm:text-xs text-white/80">de 1000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Rate Summary */}
      <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary-color" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Taxa de Poupança</span>
          </div>
          <span className={`text-lg font-bold ${data.details.savingsRate.monthly.rate >= 20 ? "text-emerald-400" : data.details.savingsRate.monthly.rate >= 10 ? "text-amber-400" : "text-red-400"}`}>
            {data.details.savingsRate.monthly.rate.toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[var(--bg-hover)] rounded-lg p-2">
            <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)]">Receitas</p>
            <p className="text-xs sm:text-sm font-semibold text-emerald-400">
              {fmt(data.details.savingsRate.monthly.income)}
            </p>
          </div>
          <div className="bg-[var(--bg-hover)] rounded-lg p-2">
            <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)]">Despesas</p>
            <p className="text-xs sm:text-sm font-semibold text-red-400">
              {fmt(data.details.savingsRate.monthly.expenses)}
            </p>
          </div>
          <div className="bg-[var(--bg-hover)] rounded-lg p-2">
            <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)]">Poupado</p>
            <p className={`text-xs sm:text-sm font-semibold ${data.details.savingsRate.monthly.savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmt(data.details.savingsRate.monthly.savings)}
            </p>
          </div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="p-4 sm:p-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">Detalhamento</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-3">
            {/* Credit Utilization */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-xs sm:text-sm text-[var(--text-muted)]">Uso do Crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 sm:w-24 h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${data.details.creditUtilization.percentage <= 30 ? "bg-emerald-500" : data.details.creditUtilization.percentage <= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(data.details.creditUtilization.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {data.details.creditUtilization.percentage.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Emergency Fund */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-[var(--text-muted)]">Reserva Emergência</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {data.details.emergencyFund.monthsCovered.toFixed(1)} meses
                </span>
                {data.details.emergencyFund.monthsCovered >= 6 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : data.details.emergencyFund.monthsCovered >= 3 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>

            {/* Goals Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-color" />
                <span className="text-xs sm:text-sm text-[var(--text-muted)]">Metas</span>
              </div>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {data.details.goals.completed}/{data.details.goals.total} ({data.details.goals.progress.toFixed(0)}%)
              </span>
            </div>

            {/* Investment Diversification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm text-[var(--text-muted)]">Diversificação</span>
              </div>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {data.details.investments.types} classes
              </span>
            </div>

            {/* Spending Trend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {data.details.spendingTrend > 5 ? (
                  <TrendingUp className="w-4 h-4 text-red-400" />
                ) : data.details.spendingTrend < -5 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                )}
                <span className="text-xs sm:text-sm text-[var(--text-muted)]">Tendência de Gastos</span>
              </div>
              <span className={`text-xs font-medium ${data.details.spendingTrend > 5 ? "text-red-400" : data.details.spendingTrend < -5 ? "text-emerald-400" : "text-blue-400"}`}>
                {data.details.spendingTrend > 0 ? "+" : ""}{data.details.spendingTrend.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      {data.tips.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Dicas para melhorar</p>
          <ul className="space-y-1">
            {data.tips.slice(0, 3).map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-[var(--text-dimmed)]">
                <span className="text-primary-color">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
