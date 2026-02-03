"use client";

import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import type { InvestmentSummary } from "@/types";

interface InvestmentSummaryCardsProps {
  summary: InvestmentSummary;
}

export function InvestmentSummaryCards({ summary }: InvestmentSummaryCardsProps) {
  const { privacy } = usePreferences();
  const { totalInvested, currentValue, profitLoss, profitLossPercent, totalAssets } = summary;
  const isPositive = profitLoss >= 0;

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderColor: "var(--border-color)"
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
      {}
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-2.5 sm:p-6 transition-colors duration-300 min-w-0" style={cardStyle}>
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 truncate" style={{ color: "var(--text-muted)" }}>
              Total Investido
            </p>
            <p className="text-sm sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="p-1.5 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400" />
          </div>
        </div>
        <p className="mt-1.5 sm:mt-3 text-[9px] sm:text-sm truncate" style={{ color: "var(--text-dimmed)" }}>
          Capital aplicado
        </p>
      </div>

      {}
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-2.5 sm:p-6 transition-colors duration-300 min-w-0" style={cardStyle}>
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 truncate" style={{ color: "var(--text-muted)" }}>
              Valor Atual
            </p>
            <p className="text-sm sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(currentValue)}
            </p>
          </div>
          <div className="p-1.5 sm:p-3 bg-primary-medium rounded-lg sm:rounded-xl flex-shrink-0">
            <PieChart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-primary-color" />
          </div>
        </div>
        <p className="mt-1.5 sm:mt-3 text-[9px] sm:text-sm truncate" style={{ color: "var(--text-dimmed)" }}>
          {totalAssets} {totalAssets === 1 ? "ativo" : "ativos"}
        </p>
      </div>

      {}
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-2.5 sm:p-6 transition-colors duration-300 min-w-0" style={cardStyle}>
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 truncate" style={{ color: "var(--text-muted)" }}>
              Rentabilidade
            </p>
            <p className={`text-sm sm:text-2xl font-bold truncate ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {privacy.hideValues ? "•••••" : `${isPositive ? "+" : ""}${formatCurrency(profitLoss)}`}
            </p>
          </div>
          <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isPositive ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-400" />
            )}
          </div>
        </div>
        <p className={`mt-1.5 sm:mt-3 text-[9px] sm:text-sm truncate ${isPositive ? "text-emerald-400/70" : "text-red-400/70"}`}>
          {isPositive ? "Lucro" : "Prejuízo"} total
        </p>
      </div>

      {}
      <div
        className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-6 min-w-0 ${
          isPositive
            ? "bg-gradient-to-br from-emerald-500/90 to-teal-600/90"
            : "bg-gradient-to-br from-red-500/90 to-orange-600/90"
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 truncate ${isPositive ? "text-emerald-100" : "text-red-100"}`}>
              Rentab. %
            </p>
            <p className="text-sm sm:text-2xl font-bold text-white truncate">
              {isPositive ? "+" : ""}{profitLossPercent.toFixed(2)}%
            </p>
          </div>
          <div className="p-1.5 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
            )}
          </div>
        </div>
        <p className={`mt-1.5 sm:mt-3 text-[9px] sm:text-sm truncate ${isPositive ? "text-emerald-100" : "text-red-100"}`}>
          {isPositive ? "📈 Valorizada!" : "📉 Desvalorizada"}
        </p>
      </div>
    </div>
  );
}