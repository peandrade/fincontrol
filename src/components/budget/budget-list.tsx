"use client";

import { useState } from "react";
import { Trash2, Pencil, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import { CATEGORY_COLORS } from "@/lib/constants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { BudgetWithSpent } from "@/app/api/budgets/route";

interface BudgetListProps {
  budgets: BudgetWithSpent[];
  onDelete: (id: string) => Promise<void>;
  onEdit?: (budget: BudgetWithSpent) => void;
  isDeleting: boolean;
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "from-red-500 to-red-600";
  if (percentage >= 80) return "from-amber-500 to-orange-500";
  return "from-emerald-500 to-teal-500";
}

function getStatusIcon(percentage: number) {
  if (percentage >= 100) {
    return <AlertTriangle className="w-4 h-4 text-red-400" />;
  }
  if (percentage >= 80) {
    return <TrendingUp className="w-4 h-4 text-amber-400" />;
  }
  return <CheckCircle className="w-4 h-4 text-emerald-400" />;
}

function getStatusText(
  percentage: number,
  remaining: number,
  hideValues: boolean,
  formatCurrency: (v: number) => string,
  t: (key: string) => string
): string {
  const fmt = (v: number) => hideValues ? "•••••" : formatCurrency(v);
  if (percentage >= 100) {
    return `${t("exceeded")} ${fmt(Math.abs(remaining))}`;
  }
  return `${t("remaining")} ${fmt(remaining)}`;
}

export function BudgetList({ budgets, onDelete, onEdit, isDeleting }: BudgetListProps) {
  const t = useTranslations("budget");
  const tc = useTranslations("common");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();
  const { privacy, general } = usePreferences();

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDelete(deleteId);
    setDeleteId(null);
  };

  if (budgets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--text-muted)]">
          {t("noBudgets")}
        </p>
        <p className="text-sm text-[var(--text-dimmed)] mt-1">
          {t("startBudgeting")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {budgets.map((budget) => {
          const categoryColor = CATEGORY_COLORS[budget.category] || "#8B5CF6";
          const progressColor = getProgressColor(budget.percentage);
          const cappedPercentage = Math.min(budget.percentage, 100);

          return (
            <div
              key={budget.id}
              className="bg-[var(--bg-hover)] rounded-xl p-4 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)]">
                      {budget.category}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusIcon(budget.percentage)}
                      <span
                        className={`text-xs ${
                          budget.percentage >= 100
                            ? "text-red-400"
                            : budget.percentage >= 80
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {getStatusText(budget.percentage, budget.remaining, privacy.hideValues, formatCurrency, t)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {privacy.hideValues ? "•••••" : formatCurrency(budget.spent)}
                    </p>
                    <p className="text-xs text-[var(--text-dimmed)]">
                      {tc("of")} {privacy.hideValues ? "•••••" : formatCurrency(budget.limit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(budget)}
                        className="p-1.5 hover:bg-amber-500/20 active:bg-amber-500/30 rounded-lg transition-all"
                        title={t("editBudget")}
                        aria-label={`${t("editBudgetOf")} ${budget.category}`}
                      >
                        <Pencil className="w-4 h-4 text-amber-400" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!general.confirmBeforeDelete) {
                          onDelete(budget.id);
                          return;
                        }
                        setDeleteId(budget.id);
                      }}
                      className="p-1.5 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all"
                      title={t("removeBudget")}
                      aria-label={`${t("removeBudgetOf")} ${budget.category}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {}
              <div className="relative">
                <div className="w-full bg-[var(--bg-hover-strong)] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                    style={{ width: `${cappedPercentage}%` }}
                  />
                </div>
                <span className="absolute right-0 -top-5 text-xs text-[var(--text-dimmed)]">
                  {budget.percentage.toFixed(0)}%
                </span>
              </div>

              {budget.month === 0 && (
                <p className="text-xs text-[var(--text-dimmed)] mt-2">
                  {t("fixedBudget")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("removeBudgetTitle")}
        message={t("removeBudgetConfirm")}
        confirmText={tc("remove")}
        isLoading={isDeleting}
      />
    </>
  );
}
