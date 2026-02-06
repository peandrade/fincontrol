"use client";

import { useCurrency } from "@/contexts/currency-context";
import { useTranslations } from "next-intl";

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
  const { formatCurrency } = useCurrency();
  const t = useTranslations("investments");
  const profit = currentValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return (
    <div className="bg-[var(--bg-hover)] rounded-xl p-4">
      {showTotalInvested && (
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] text-sm">{t("totalInvestedLabel")}</span>
          <span className="text-[var(--text-primary)] font-semibold">
            {formatCurrency(totalInvested)}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">{t("currentBalanceLabel")}</span>
        <span className="text-[var(--text-primary)] font-semibold">
          {formatCurrency(currentValue)}
        </span>
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-[var(--text-muted)] text-sm">{t("profitability")}</span>
        <span className={`font-semibold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {profit >= 0 ? "+" : ""}
          {formatCurrency(profit)} ({profitPercent >= 0 ? "+" : ""}
          {profitPercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
