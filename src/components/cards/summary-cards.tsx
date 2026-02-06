"use client";

import { CreditCard, Wallet, TrendingUp, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import type { CardSummary } from "@/types/credit-card";

interface SummaryCardsProps {
  summary: CardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const { formatCurrency } = useCurrency();
  const { privacy } = usePreferences();
  const usagePercent = summary.totalLimit > 0
    ? (summary.usedLimit / summary.totalLimit) * 100
    : 0;

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderColor: "var(--border-color)"
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
      {}
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary-medium">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary-color" />
          </div>
          <span className="text-[10px] sm:text-sm truncate" style={{ color: "var(--text-muted)" }}>{t("totalLimit")}</span>
        </div>
        <p className="text-base sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {privacy.hideValues ? "•••••" : formatCurrency(summary.totalLimit)}
        </p>
        <div className="mt-1.5 sm:mt-2">
          <div className="flex justify-between text-[9px] sm:text-xs mb-1" style={{ color: "var(--text-dimmed)" }}>
            <span>{tc("used")}</span>
            <span>{usagePercent.toFixed(0)}%</span>
          </div>
          <div className="w-full rounded-full h-1.5 sm:h-2" style={{ backgroundColor: "var(--bg-hover)" }}>
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-yellow-500" : "bg-[var(--color-primary)]"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {}
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-500/20">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <span className="text-[10px] sm:text-sm truncate" style={{ color: "var(--text-muted)" }}>{t("availableLimit")}</span>
        </div>
        <p className="text-base sm:text-2xl font-bold text-emerald-400 truncate">
          {privacy.hideValues ? "•••••" : formatCurrency(summary.availableLimit)}
        </p>
        <p className="text-[10px] sm:text-sm mt-1 truncate" style={{ color: "var(--text-dimmed)" }}>
          {privacy.hideValues ? "•••••" : formatCurrency(summary.usedLimit)} {tc("used")}
        </p>
      </div>

      {}
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/20">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <span className="text-[10px] sm:text-sm truncate" style={{ color: "var(--text-muted)" }}>{t("currentInvoice")}</span>
        </div>
        <p className="text-base sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {privacy.hideValues ? "•••••" : formatCurrency(summary.currentInvoice)}
        </p>
        <p className="text-[10px] sm:text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>{tc("thisMonth")}</p>
      </div>

      {}
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-orange-500/20">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
          <span className="text-[10px] sm:text-sm truncate" style={{ color: "var(--text-muted)" }}>{t("nextInvoice")}</span>
        </div>
        <p className="text-base sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {privacy.hideValues ? "•••••" : formatCurrency(summary.nextInvoice)}
        </p>
        <p className="text-[10px] sm:text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>{tc("nextMonth")}</p>
      </div>
    </div>
  );
}