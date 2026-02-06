"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import type { BillEvent } from "./types";

interface NextDueAlertProps {
  nextDue: BillEvent;
  hideValues: boolean;
}

export function NextDueAlert({ nextDue, hideValues }: NextDueAlertProps) {
  const t = useTranslations("dashboard");
  const { formatCurrency } = useCurrency();
  return (
    <div className="p-4 sm:p-6 border-t border-[var(--border-color)]">
      <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-amber-400">{t("nextDue")}</p>
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {nextDue.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-amber-400">
            {hideValues ? "•••••" : formatCurrency(nextDue.value)}
          </p>
          <p className="text-xs text-[var(--text-dimmed)]">{t("dayLabel")} {nextDue.day}</p>
        </div>
      </div>
    </div>
  );
}
