"use client";

import { formatCurrency } from "@/lib/utils";

interface InvestmentPreviewCardProps {
  currentValue: number;
  totalInvested: number;
  showTotalInvested?: boolean;
}

export function InvestmentPreviewCard({
  currentValue,
  totalInvested,
  showTotalInvested = false,
}: InvestmentPreviewCardProps) {
  const profit = currentValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return (
    <div className="bg-[var(--bg-hover)] rounded-xl p-4">
      {showTotalInvested && (
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] text-sm">Total investido</span>
          <span className="text-[var(--text-primary)] font-semibold">
            {formatCurrency(totalInvested)}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">Saldo atual</span>
        <span className="text-[var(--text-primary)] font-semibold">
          {formatCurrency(currentValue)}
        </span>
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-[var(--text-muted)] text-sm">Rentabilidade</span>
        <span className={`font-semibold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {profit >= 0 ? "+" : ""}
          {formatCurrency(profit)} ({profitPercent >= 0 ? "+" : ""}
          {profitPercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
