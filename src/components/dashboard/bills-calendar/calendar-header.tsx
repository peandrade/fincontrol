"use client";

import {
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import type { BillsCalendarData } from "./types";

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
] as const;

interface CalendarHeaderProps {
  data: BillsCalendarData;
  isLoading: boolean;
  showCashFlow: boolean;
  hideValues: boolean;
  onToggleCashFlow: () => void;
  onRefresh: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
}

export function CalendarHeader({
  data,
  isLoading,
  showCashFlow,
  hideValues,
  onToggleCashFlow,
  onRefresh,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}: CalendarHeaderProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const tm = useTranslations("months");
  const { formatCurrency } = useCurrency();
  return (
    <div className="pt-4 px-4 pb-4 sm:pt-5 sm:px-6 sm:pb-5 border-b border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              {t("billsCalendar")}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCashFlow}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showCashFlow
                ? "bg-blue-500 text-white"
                : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className="hidden sm:inline">{t("cashFlow")}</span>
            <TrendingUp className="w-4 h-4 sm:hidden" />
          </button>
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            title={tc("refresh")}
            aria-label={t("refreshCalendar")}
          >
            <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          title={t("previousMonth")}
          aria-label={t("goToPreviousMonth")}
        >
          <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
        </button>
        <button
          onClick={onGoToToday}
          className="flex items-center gap-1 text-sm font-medium text-[var(--text-primary)] hover:text-blue-400 transition-colors"
          aria-label={t("goToCurrentMonth")}
        >
          <span>{tm(MONTH_KEYS[data.currentMonth - 1])} {data.currentYear}</span>
        </button>
        <button
          onClick={onNextMonth}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          title={t("nextMonthLabel")}
          aria-label={t("goToNextMonth")}
        >
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {data.summary.overdueCount > 0 ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3 text-center">
            <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <p className="text-[10px] sm:text-xs text-red-400">{t("overdueLabel")}</p>
            <p className="text-xs sm:text-sm font-bold text-red-400">
              {hideValues ? "•••••" : formatCurrency(data.summary.overdueValue)}
            </p>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 sm:p-3 text-center">
            <CreditCard className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-[10px] sm:text-xs text-blue-400">{t("invoices")}</p>
            <p className="text-xs sm:text-sm font-bold text-blue-400">
              {hideValues ? "•••••" : formatCurrency(data.summary.totalInvoices)}
            </p>
          </div>
        )}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 sm:p-3 text-center">
          <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-[10px] sm:text-xs text-amber-400">{t("upcoming")}</p>
          <p className="text-xs sm:text-sm font-bold text-amber-400">
            {hideValues ? "•••••" : formatCurrency(data.summary.upcomingValue)}
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 sm:p-3 text-center">
          <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-[10px] sm:text-xs text-emerald-400">{t("paidLabel")}</p>
          <p className="text-xs sm:text-sm font-bold text-emerald-400">
            {hideValues ? "•••••" : formatCurrency(data.summary.totalPaid)}
          </p>
        </div>
      </div>
    </div>
  );
}
