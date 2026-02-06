"use client";

import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import type { BillEvent } from "./types";

interface InvoicesSummaryProps {
  invoiceBills: BillEvent[];
  totalInvoices: number;
  hideValues: boolean;
}

export function InvoicesSummary({
  invoiceBills,
  totalInvoices,
  hideValues,
}: InvoicesSummaryProps) {
  const t = useTranslations("dashboard");
  const { formatCurrency } = useCurrency();
  if (invoiceBills.length === 0) return null;

  return (
    <div className="p-4 sm:p-6 border-t border-[var(--border-color)]">
      <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
        {t("invoicesOfMonth")}
      </p>
      <div className="space-y-2">
        {invoiceBills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ backgroundColor: bill.cardColor || "#8B5CF6" }}
              >
                <CreditCard className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-[var(--text-primary)]">
                {bill.cardName}
              </span>
              <span className="text-[10px] text-[var(--text-dimmed)]">
                {t("dayLabel")} {bill.day}
              </span>
            </div>
            <span
              className={`text-xs font-bold ${
                bill.isPaid
                  ? "text-emerald-400"
                  : bill.isPastDue
                  ? "text-red-400"
                  : "text-blue-400"
              }`}
            >
              {hideValues ? "•••••" : formatCurrency(bill.value)}
            </span>
          </div>
        ))}
        {invoiceBills.length > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {t("totalInvoices")}
            </span>
            <span className="text-xs font-bold text-blue-400">
              {hideValues ? "•••••" : formatCurrency(totalInvoices)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
