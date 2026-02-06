"use client";

import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { getCategoryColor } from "@/lib/constants";
import type { DayBills } from "./types";

interface SelectedDayDetailsProps {
  selectedDay: DayBills;
  hideValues: boolean;
  onClose: () => void;
}

export function SelectedDayDetails({
  selectedDay,
  hideValues,
  onClose,
}: SelectedDayDetailsProps) {
  const { formatCurrency } = useCurrency();
  const t = useTranslations("common");
  const td = useTranslations("dashboard");
  return (
    <div className="p-4 sm:p-6 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {t("day")} {selectedDay.day} - {hideValues ? "•••••" : formatCurrency(selectedDay.total)}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-[var(--text-dimmed)] hover:text-[var(--text-primary)]"
        >
          {t("close")}
        </button>
      </div>
      <div className="space-y-2 max-h-[150px] overflow-y-auto">
        {selectedDay.bills.map((bill) => (
          <div
            key={bill.id}
            className={`flex items-center justify-between p-2 rounded-lg ${
              bill.isPastDue
                ? "bg-red-500/10 border border-red-500/30"
                : bill.isPaid
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : bill.type === "invoice"
                ? "bg-blue-500/10 border border-blue-500/30"
                : "bg-amber-500/10 border border-amber-500/30"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {bill.type === "invoice" ? (
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: bill.cardColor || "#8B5CF6" }}
                >
                  <CreditCard className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: `${getCategoryColor(bill.category)}20`,
                    color: getCategoryColor(bill.category),
                  }}
                >
                  {bill.category.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                  {bill.description}
                </p>
                <p className="text-[10px] text-[var(--text-dimmed)]">
                  {bill.type === "invoice" ? td("invoice") : td("recurring")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-xs font-bold ${
                  bill.isPastDue
                    ? "text-red-400"
                    : bill.isPaid
                    ? "text-emerald-400"
                    : bill.type === "invoice"
                    ? "text-blue-400"
                    : "text-amber-400"
                }`}
              >
                {bill.value === 0
                  ? "—"
                  : hideValues
                  ? "•••••"
                  : formatCurrency(bill.value)}
              </p>
              <p
                className={`text-[10px] ${
                  bill.isPastDue
                    ? "text-red-400"
                    : bill.isPaid
                    ? "text-emerald-400"
                    : bill.type === "invoice"
                    ? "text-blue-400"
                    : "text-amber-400"
                }`}
              >
                {bill.isPastDue
                  ? t("overdue")
                  : bill.isPaid
                  ? t("paid")
                  : bill.value === 0
                  ? t("noInvoice")
                  : t("pending")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
