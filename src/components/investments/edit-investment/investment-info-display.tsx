"use client";

import { useCurrency } from "@/contexts/currency-context";
import { formatRateDescription } from "@/lib/rates-service";
import { isVariableIncome, isFixedIncome } from "@/types";
import { useTranslations } from "next-intl";
import type { Investment } from "@/types";

interface InvestmentInfoDisplayProps {
  investment: Investment;
  noMaturity: boolean;
}

export function InvestmentInfoDisplay({ investment, noMaturity }: InvestmentInfoDisplayProps) {
  const { formatCurrency } = useCurrency();
  const t = useTranslations("investments");
  const isVariable = isVariableIncome(investment.type);
  const isFixed = isFixedIncome(investment.type);

  return (
    <div className="bg-[var(--bg-hover)] rounded-xl p-4 space-y-2">
      {isVariable && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{t("totalInvestedLabel")}</span>
            <span className="text-[var(--text-primary)]">{formatCurrency(investment.totalInvested)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{t("quantityLabel")}</span>
            <span className="text-[var(--text-primary)]">{investment.quantity.toLocaleString("pt-BR")} {t("shares")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{t("avgPriceLabel")}</span>
            <span className="text-[var(--text-primary)]">{formatCurrency(investment.averagePrice)}</span>
          </div>
        </>
      )}
      {isFixed && investment.interestRate && investment.indexer && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">{t("currentRate")}</span>
          <span className="text-emerald-400 font-medium">
            {formatRateDescription(investment.interestRate, investment.indexer)}
          </span>
        </div>
      )}
      {isFixed && investment.maturityDate && !noMaturity && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">{t("maturity")}</span>
          <span className="text-[var(--text-primary)]">
            {new Date(investment.maturityDate).toLocaleDateString("pt-BR")}
          </span>
        </div>
      )}
      {isFixed && noMaturity && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">{t("maturity")}</span>
          <span className="text-[var(--text-primary)]">{t("dailyLiquidityShort")}</span>
        </div>
      )}
    </div>
  );
}
