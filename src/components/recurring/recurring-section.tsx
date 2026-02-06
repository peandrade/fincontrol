"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Repeat, RefreshCw, Trash2, Pencil, Check, AlertCircle, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import { useFeedback } from "@/hooks/use-feedback";
import { CATEGORY_COLORS } from "@/lib/constants";
import { RecurringExpenseModal } from "./recurring-expense-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { RecurringExpenseWithStatus } from "@/app/api/recurring-expenses/route";

interface RecurringData {
  expenses: RecurringExpenseWithStatus[];
  summary: {
    totalMonthly: number;
    totalLaunched: number;
    totalPending: number;
    launchedCount: number;
    pendingCount: number;
    totalCount: number;
  };
  currentMonth: number;
  currentYear: number;
}

interface RecurringSectionProps {
  onExpenseLaunched?: () => void;
}

export function RecurringSection({ onExpenseLaunched }: RecurringSectionProps) {
  const t = useTranslations("recurring");
  const tc = useTranslations("common");
  const [data, setData] = useState<RecurringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<RecurringExpenseWithStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { formatCurrency } = useCurrency();
  const { privacy, general } = usePreferences();
  const feedback = useFeedback();

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch("/api/recurring-expenses");
      if (response.ok) {
        const expenseData = await response.json();
        setData(expenseData);
      }
    } catch (error) {
      console.error("Erro ao buscar despesas recorrentes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSave = async (expenseData: {
    description: string;
    value: number;
    category: string;
    dueDay: number;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/recurring-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        feedback.success();
        await fetchExpenses();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao salvar despesa recorrente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSave = async (expenseData: {
    description: string;
    value: number;
    category: string;
    dueDay: number;
    notes?: string;
  }) => {
    if (!editExpense) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recurring-expenses/${editExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        feedback.success();
        await fetchExpenses();
        setEditExpense(null);
      }
    } catch (error) {
      console.error("Erro ao editar despesa recorrente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recurring-expenses/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Erro ao deletar despesa recorrente:", error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (!general.confirmBeforeDelete) {
      (async () => {
        setIsDeleting(true);
        try {
          const response = await fetch(`/api/recurring-expenses/${id}`, { method: "DELETE" });
          if (response.ok) await fetchExpenses();
        } catch (error) {
          console.error("Erro ao deletar despesa recorrente:", error);
        } finally {
          setIsDeleting(false);
        }
      })();
      return;
    }
    setDeleteId(id);
  };

  const handleLaunchAll = async () => {
    setIsLaunching(true);
    try {
      const response = await fetch("/api/recurring-expenses/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchExpenses();
        onExpenseLaunched?.();
      }
    } catch (error) {
      console.error("Erro ao lançar despesas:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleLaunchSingle = async (id: string) => {
    setIsLaunching(true);
    try {
      const response = await fetch("/api/recurring-expenses/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseIds: [id] }),
      });

      if (response.ok) {
        await fetchExpenses();
        onExpenseLaunched?.();
      }
    } catch (error) {
      console.error("Erro ao lançar despesa:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalMonthly: 0,
    totalLaunched: 0,
    totalPending: 0,
    launchedCount: 0,
    pendingCount: 0,
    totalCount: 0,
  };

  const pendingExpenses = data?.expenses.filter((e) => e.isActive && !e.isLaunchedThisMonth) || [];
  const launchedExpenses = data?.expenses.filter((e) => e.isActive && e.isLaunchedThisMonth) || [];

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden max-h-[420px] flex flex-col">
        {}
        <div className="p-3 sm:p-5 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                  {t("title")}
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)] truncate">
                  {summary.pendingCount > 0
                    ? t("pendingThisMonth", { count: summary.pendingCount })
                    : t("allLaunched")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 text-[10px] sm:text-xs flex-shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {t("newShort")}
            </button>
          </div>

          {}
          {data && data.expenses.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--bg-hover)] rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-center">
                <p className="text-[10px] sm:text-[11px] text-[var(--text-dimmed)] mb-0.5">{t("totalMonthly")}</p>
                <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  {privacy.hideValues ? "•••••" : formatCurrency(summary.totalMonthly)}
                </p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-center">
                <p className="text-[10px] sm:text-[11px] text-[var(--text-dimmed)] mb-0.5">{t("pendingLabel")}</p>
                <p className={`text-xs sm:text-sm font-bold truncate ${summary.totalPending > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {privacy.hideValues ? "•••••" : formatCurrency(summary.totalPending)}
                </p>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
          {data?.expenses.length === 0 ? (
            <div className="text-center py-6">
              <Repeat className="w-10 h-10 text-[var(--text-dimmed)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)]">{t("noExpenses")}</p>
              <p className="text-xs text-[var(--text-dimmed)]">
                {t("addMonthlyBills")}
              </p>
            </div>
          ) : (
            <>
              {}
              {pendingExpenses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                      {t("pendingSection")} ({pendingExpenses.length})
                    </span>
                    {pendingExpenses.length > 1 && (
                      <button
                        onClick={handleLaunchAll}
                        disabled={isLaunching}
                        className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3" />
                        {t("launchAll")}
                      </button>
                    )}
                  </div>
                  {pendingExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      onLaunch={() => handleLaunchSingle(expense.id)}
                      onEdit={() => setEditExpense(expense)}
                      onDelete={() => handleDeleteExpense(expense.id)}
                      isLaunching={isLaunching}
                      hideValues={privacy.hideValues}
                    />
                  ))}
                </div>
              )}

              {}
              {launchedExpenses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                    {t("launchedSection")} ({launchedExpenses.length})
                  </span>
                  {launchedExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      onEdit={() => setEditExpense(expense)}
                      onDelete={() => handleDeleteExpense(expense.id)}
                      isLaunching={isLaunching}
                      hideValues={privacy.hideValues}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RecurringExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      <RecurringExpenseModal
        isOpen={!!editExpense}
        onClose={() => setEditExpense(null)}
        onSave={handleEditSave}
        isSubmitting={isSubmitting}
        initialData={editExpense ? {
          description: editExpense.description,
          value: editExpense.value,
          category: editExpense.category,
          dueDay: editExpense.dueDay,
          notes: editExpense.notes,
        } : null}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("removeExpense")}
        message={t("removeExpenseConfirm")}
        confirmText={tc("remove")}
        isLoading={isDeleting}
      />
    </>
  );
}

function ExpenseItem({
  expense,
  onLaunch,
  onEdit,
  onDelete,
  isLaunching,
  hideValues,
}: {
  expense: RecurringExpenseWithStatus;
  onLaunch?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  isLaunching: boolean;
  hideValues: boolean;
}) {
  const t = useTranslations("recurring");
  const tc = useTranslations("common");
  const { formatCurrency } = useCurrency();
  const categoryColor = CATEGORY_COLORS[expense.category] || "#8B5CF6";
  const isLaunched = expense.isLaunchedThisMonth;

  return (
    <div className={`bg-[var(--bg-hover)] rounded-xl p-3 group ${isLaunched ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)] truncate">
                {expense.description}
              </span>
              {isLaunched && (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              {!isLaunched && expense.isPastDue && (
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-dimmed)]">
              <span>{expense.category}</span>
              <span>•</span>
              <span>{t("dayPrefix")} {expense.dueDay}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            {hideValues ? "•••••" : formatCurrency(expense.value)}
          </span>

          {!isLaunched && onLaunch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              disabled={isLaunching}
              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-all disabled:opacity-50"
              title={t("launchNow")}
              aria-label={t("launchExpense")}
            >
              <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 hover:bg-amber-500/20 active:bg-amber-500/30 rounded-lg transition-all"
              title={tc("edit")}
              aria-label={t("editExpense")}
            >
              <Pencil className="w-4 h-4 text-amber-400" aria-hidden="true" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all"
            title={tc("remove")}
            aria-label={t("removeExpenseButton")}
          >
            <Trash2 className="w-4 h-4 text-red-400" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
