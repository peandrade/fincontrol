"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import type { CashFlowProjection } from "./types";

interface CashFlowViewProps {
  projections: CashFlowProjection[];
  hideValues: boolean;
}

export function CashFlowView({ projections, hideValues }: CashFlowViewProps) {
  const { formatCurrency } = useCurrency();
  return (
    <div className="p-4 sm:p-6">
      <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
        Projeção de Fluxo de Caixa
      </h4>
      <div className="space-y-3">
        {projections.map((projection) => (
          <div
            key={projection.month}
            className="bg-[var(--bg-hover)] rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                {projection.monthLabel}
              </span>
              <span
                className={`text-sm font-bold ${
                  projection.netFlow >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {projection.netFlow >= 0 ? "+" : ""}
                {hideValues ? "•••••" : formatCurrency(projection.netFlow)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-dimmed)]">Receitas</span>
                <span className="text-emerald-400">
                  {hideValues ? "•••••" : formatCurrency(projection.expectedIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-dimmed)]">Despesas</span>
                <span className="text-red-400">
                  {hideValues ? "•••••" : formatCurrency(projection.expectedExpenses)}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    (projection.expectedIncome /
                      (projection.expectedIncome + projection.expectedExpenses || 1)) *
                      100,
                    100
                  )}%`,
                }}
              />
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${Math.min(
                    (projection.expectedExpenses /
                      (projection.expectedIncome + projection.expectedExpenses || 1)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
