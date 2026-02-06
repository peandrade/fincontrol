"use client";

import { Info, Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { useTranslations } from "next-intl";

export interface YieldDetails {
  grossValue: number;
  grossYield: number;
  grossYieldPercent: number;
  iofAmount: number;
  iofPercent: number;
  irAmount: number;
  irPercent: number;
  netValue: number;
  netYield: number;
  netYieldPercent: number;
  businessDays: number;
  calendarDays: number;
}

interface YieldSimulationCardProps {
  yieldDetails: YieldDetails | null;
  isLoading: boolean;
}

export function YieldSimulationCard({ yieldDetails, isLoading }: YieldSimulationCardProps) {
  const { formatCurrency } = useCurrency();
  const t = useTranslations("investments");

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-400">{t("yieldSimulation")}</span>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
      </div>

      {yieldDetails ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{t("calendarDays")}</span>
            <span className="text-[var(--text-primary)]">
              {t("daysCalc", { calendarDays: yieldDetails.calendarDays, businessDays: yieldDetails.businessDays })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{t("grossYield")}</span>
            <span className="text-emerald-400 font-medium">
              +{formatCurrency(yieldDetails.grossYield)} ({yieldDetails.grossYieldPercent.toFixed(2)}%)
            </span>
          </div>
          {yieldDetails.iofAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">{t("iofLabel", { percent: yieldDetails.iofPercent })}</span>
              <span className="text-red-400">-{formatCurrency(yieldDetails.iofAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{t("irLabel", { percent: yieldDetails.irPercent })}</span>
            <span className="text-red-400">-{formatCurrency(yieldDetails.irAmount)}</span>
          </div>
          <div className="border-t border-amber-500/20 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">{t("netYield")}</span>
              <span className="text-emerald-400 font-semibold">
                +{formatCurrency(yieldDetails.netYield)} ({yieldDetails.netYieldPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[var(--text-muted)]">{t("estimatedNetValue")}</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {formatCurrency(yieldDetails.netValue)}
              </span>
            </div>
          </div>
        </div>
      ) : !isLoading ? (
        <p className="text-xs text-[var(--text-dimmed)]">
          {t("yieldSimHint")}
        </p>
      ) : null}
    </div>
  );
}
