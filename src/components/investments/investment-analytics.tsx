"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";

const HIDDEN = "•••••";

export interface PerformanceData {
  investmentId: string;
  name: string;
  type: string;
  ticker?: string;
  profitLoss: number;
  profitLossPercent: number;
  currentValue: number;
  totalInvested: number;
}

export interface AllocationTarget {
  type: string;
  typeName: string;
  currentPercent: number;
  targetPercent: number;
  difference: number;
  currentValue: number;
  suggestedAction: "buy" | "sell" | "hold";
}

export interface PortfolioInsight {
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
}

export interface InvestmentAnalyticsData {
  performance: {
    top: PerformanceData[];
    worst: PerformanceData[];
  };
  allocation: AllocationTarget[];
  insights: PortfolioInsight[];
  summary: {
    totalInvested: number;
    currentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    diversificationScore: number;
    investmentCount: number;
    typeCount: number;
  };
}

export const typeColors: Record<string, string> = {
  stock: "#8B5CF6",
  fii: "#10B981",
  etf: "#3B82F6",
  crypto: "#F59E0B",
  cdb: "#EC4899",
  treasury: "#14B8A6",
  lci_lca: "#6366F1",
  savings: "#84CC16",
  other: "#6B7280",
};

export function InvestmentAnalytics() {
  const [data, setData] = useState<InvestmentAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/investments/analytics");
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

  if (!data || data.summary.investmentCount === 0) return null;

  return (
    <div className="space-y-6">
      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              Insights da Carteira
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-xl border ${
                  insight.type === "positive"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : insight.type === "negative"
                    ? "bg-red-500/10 border-red-500/30"
                    : insight.type === "warning"
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      insight.type === "positive"
                        ? "bg-emerald-500/20"
                        : insight.type === "negative"
                        ? "bg-red-500/20"
                        : insight.type === "warning"
                        ? "bg-amber-500/20"
                        : "bg-blue-500/20"
                    }`}
                  >
                    {insight.type === "positive" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : insight.type === "negative" ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : insight.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        insight.type === "positive"
                          ? "text-emerald-400"
                          : insight.type === "negative"
                          ? "text-red-400"
                          : insight.type === "warning"
                          ? "text-amber-400"
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
        </div>
      )}

      {/* Top & Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        {data.performance.top.length > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Melhores Desempenhos
              </h3>
            </div>

            <div className="space-y-3">
              {data.performance.top.map((item, index) => (
                <div
                  key={item.investmentId}
                  className="flex items-center justify-between p-3 bg-[var(--bg-hover)] rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
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
                    <p className="text-sm font-bold text-emerald-400">
                      +{item.profitLossPercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-emerald-400/80">
                      +{fmt(item.profitLoss)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worst Performers */}
        {data.performance.worst.length > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Atenção Necessária
              </h3>
            </div>

            <div className="space-y-3">
              {data.performance.worst.map((item, index) => (
                <div
                  key={item.investmentId}
                  className="flex items-center justify-between p-3 bg-[var(--bg-hover)] rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold opacity-60"
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
                    <p className="text-sm font-bold text-red-400">
                      {item.profitLossPercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-red-400/80">
                      {fmt(item.profitLoss)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Allocation Targets / Rebalancing */}
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-soft rounded-lg">
            <Target className="w-5 h-5 text-primary-color" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              Alocação vs Meta
            </h3>
            <p className="text-xs text-[var(--text-dimmed)]">
              Diversificação: {data.summary.diversificationScore.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {data.allocation
            .filter((a) => a.currentPercent > 0 || a.targetPercent > 0)
            .map((item) => (
              <div key={item.type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: typeColors[item.type] || "#6B7280" }}
                    />
                    <span className="text-sm text-[var(--text-primary)]">{item.typeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-dimmed)]">
                      {item.currentPercent.toFixed(0)}% / {item.targetPercent.toFixed(0)}%
                    </span>
                    {item.suggestedAction === "buy" ? (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                        <ArrowUp className="w-3 h-3" />
                        Comprar
                      </span>
                    ) : item.suggestedAction === "sell" ? (
                      <span className="flex items-center gap-0.5 text-xs text-red-400">
                        <ArrowDown className="w-3 h-3" />
                        Vender
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-xs text-[var(--text-dimmed)]">
                        <Minus className="w-3 h-3" />
                        OK
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden relative">
                  {/* Target marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white/50 z-10"
                    style={{ left: `${item.targetPercent}%` }}
                  />
                  {/* Current value bar */}
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(item.currentPercent, 100)}%`,
                      backgroundColor: typeColors[item.type] || "#6B7280",
                    }}
                  />
                </div>
              </div>
            ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
          <div className="text-center">
            <p className="text-xs text-[var(--text-dimmed)]">Investido</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {fmt(data.summary.totalInvested)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--text-dimmed)]">Valor Atual</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {fmt(data.summary.currentValue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--text-dimmed)]">Retorno</p>
            <p
              className={`text-sm font-bold ${
                data.summary.totalProfitLossPercent >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {data.summary.totalProfitLossPercent >= 0 ? "+" : ""}
              {data.summary.totalProfitLossPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Pure render components (accept data as props, no fetching) ---

export function PortfolioInsights({ insights }: { insights: PortfolioInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`p-3 sm:p-4 rounded-xl border ${
            insight.type === "positive"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : insight.type === "negative"
              ? "bg-red-500/10 border-red-500/30"
              : insight.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-blue-500/10 border-blue-500/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-1.5 rounded-lg ${
                insight.type === "positive"
                  ? "bg-emerald-500/20"
                  : insight.type === "negative"
                  ? "bg-red-500/20"
                  : insight.type === "warning"
                  ? "bg-amber-500/20"
                  : "bg-blue-500/20"
              }`}
            >
              {insight.type === "positive" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : insight.type === "negative" ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : insight.type === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <Lightbulb className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  insight.type === "positive"
                    ? "text-emerald-400"
                    : insight.type === "negative"
                    ? "text-red-400"
                    : insight.type === "warning"
                    ? "text-amber-400"
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

export function AllocationTargets({
  data,
  summary,
}: {
  data: AllocationTarget[];
  summary: InvestmentAnalyticsData["summary"];
}) {
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  const filtered = data.filter((a) => a.currentPercent > 0 || a.targetPercent > 0);
  if (filtered.length === 0) return null;

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-soft rounded-lg">
          <Target className="w-5 h-5 text-primary-color" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            Alocação vs Meta
          </h3>
          <p className="text-xs text-[var(--text-dimmed)]">
            Diversificação: {summary.diversificationScore.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.type} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: typeColors[item.type] || "#6B7280" }}
                />
                <span className="text-sm text-[var(--text-primary)]">{item.typeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-dimmed)]">
                  {item.currentPercent.toFixed(0)}% / {item.targetPercent.toFixed(0)}%
                </span>
                {item.suggestedAction === "buy" ? (
                  <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                    <ArrowUp className="w-3 h-3" />
                    Comprar
                  </span>
                ) : item.suggestedAction === "sell" ? (
                  <span className="flex items-center gap-0.5 text-xs text-red-400">
                    <ArrowDown className="w-3 h-3" />
                    Vender
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-xs text-[var(--text-dimmed)]">
                    <Minus className="w-3 h-3" />
                    OK
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 h-full w-0.5 bg-white/50 z-10"
                style={{ left: `${item.targetPercent}%` }}
              />
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(item.currentPercent, 100)}%`,
                  backgroundColor: typeColors[item.type] || "#6B7280",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
        <div className="text-center">
          <p className="text-xs text-[var(--text-dimmed)]">Investido</p>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {fmt(summary.totalInvested)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-dimmed)]">Valor Atual</p>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {fmt(summary.currentValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-dimmed)]">Retorno</p>
          <p
            className={`text-sm font-bold ${
              summary.totalProfitLossPercent >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {summary.totalProfitLossPercent >= 0 ? "+" : ""}
            {summary.totalProfitLossPercent.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export function PerformanceCards({
  performance,
}: {
  performance: InvestmentAnalyticsData["performance"];
}) {
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  const hasTop = performance.top.length > 0;
  const hasWorst = performance.worst.length > 0;
  if (!hasTop && !hasWorst) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {hasTop && (
        <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              Melhores Desempenhos
            </h3>
          </div>
          <div className="space-y-3">
            {performance.top.map((item, index) => (
              <div
                key={item.investmentId}
                className="flex items-center justify-between p-3 bg-[var(--bg-hover)] rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
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
                  <p className="text-sm font-bold text-emerald-400">
                    +{item.profitLossPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-emerald-400/80">
                    +{fmt(item.profitLoss)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasWorst && (
        <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              Atenção Necessária
            </h3>
          </div>
          <div className="space-y-3">
            {performance.worst.map((item, index) => (
              <div
                key={item.investmentId}
                className="flex items-center justify-between p-3 bg-[var(--bg-hover)] rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold opacity-60"
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
                  <p className="text-sm font-bold text-red-400">
                    {item.profitLossPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-red-400/80">
                    {fmt(item.profitLoss)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
