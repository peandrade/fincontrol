"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Wallet, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useFeedback } from "@/hooks/use-feedback";
import { usePreferences } from "@/contexts";

const HIDDEN = "•••••";
import { BudgetList } from "./budget-list";
import { BudgetModal } from "./budget-modal";
import type { BudgetWithSpent } from "@/app/api/budgets/route";

interface BudgetData {
  budgets: BudgetWithSpent[];
  summary: {
    totalLimit: number;
    totalSpent: number;
    totalRemaining: number;
    totalPercentage: number;
  };
  month: number;
  year: number;
}

interface BudgetOverviewCardProps {
  refreshTrigger?: number;
}

export function BudgetOverviewCard({ refreshTrigger = 0 }: BudgetOverviewCardProps) {
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithSpent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const feedback = useFeedback();
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await fetch("/api/budgets");
      if (response.ok) {
        const budgetData = await response.json();
        setData(budgetData);
      }
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, refreshTrigger]);

  const handleSave = async (budgetData: {
    category: string;
    limit: number;
    isFixed: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...budgetData,
          month: budgetData.isFixed ? null : data?.month,
          year: budgetData.isFixed ? null : data?.year,
        }),
      });

      if (response.ok) {
        feedback.success();
        await fetchBudgets();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSave = async (budgetData: {
    category: string;
    limit: number;
    isFixed: boolean;
  }) => {
    if (!editBudget) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/budgets/${editBudget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: budgetData.limit }),
      });

      if (response.ok) {
        feedback.success();
        await fetchBudgets();
        setEditBudget(null);
      }
    } catch (error) {
      console.error("Erro ao editar orçamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBudgets();
      }
    } catch (error) {
      console.error("Erro ao deletar orçamento:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return "from-red-500 to-red-600";
    if (percentage >= 80) return "from-amber-500 to-orange-500";
    return "from-[var(--color-primary)] to-[var(--color-secondary)]";
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  const existingCategories = data?.budgets.map((b) => b.category) || [];
  const summary = data?.summary || {
    totalLimit: 0,
    totalSpent: 0,
    totalRemaining: 0,
    totalPercentage: 0,
  };
  const hasBudgets = data && data.budgets.length > 0;

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[420px]">
        {/* Header */}
        <div className="p-3 sm:p-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-primary-soft rounded-lg flex-shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-color" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                  Orçamento Mensal
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)] truncate">
                  {new Date(data?.year || 0, (data?.month || 1) - 1).toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary text-[10px] sm:text-xs flex-shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Novo
            </button>
          </div>

          {/* Progress bar geral */}
          {hasBudgets && (
            <div className="bg-[var(--bg-hover)] rounded-lg sm:rounded-xl p-2.5 sm:p-3">
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">Total do mês</span>
                <div className="text-right min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {fmt(summary.totalSpent)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-[var(--text-dimmed)]">
                    {" "}/ {fmt(summary.totalLimit)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-[var(--bg-hover-strong)] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                    summary.totalPercentage
                  )} transition-all duration-500`}
                  style={{
                    width: `${Math.min(summary.totalPercentage, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[11px]">
                <span
                  className={`${
                    summary.totalPercentage >= 100
                      ? "text-red-400"
                      : summary.totalPercentage >= 80
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {summary.totalPercentage.toFixed(0)}% utilizado
                </span>
                <span className={summary.totalRemaining < 0 ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}>
                  {summary.totalRemaining < 0
                    ? `Excedeu em ${fmt(Math.abs(summary.totalRemaining))}`
                    : `Restam ${fmt(summary.totalRemaining)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Budget list with scroll */}
        {hasBudgets && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 overflow-y-auto flex-1 min-h-0">
            <BudgetList
              budgets={data?.budgets || []}
              onDelete={handleDelete}
              onEdit={(budget) => setEditBudget(budget)}
              isDeleting={isDeleting}
            />
          </div>
        )}

        {/* Empty state */}
        {!hasBudgets && (
          <div className="text-center py-4 px-4">
            <p className="text-sm text-[var(--text-dimmed)]">Nenhum orçamento definido</p>
            <p className="text-xs text-[var(--text-dimmed)] mt-1">
              Defina limites de gastos por categoria
            </p>
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        existingCategories={existingCategories}
      />

      <BudgetModal
        isOpen={!!editBudget}
        onClose={() => setEditBudget(null)}
        onSave={handleEditSave}
        isSubmitting={isSubmitting}
        existingCategories={existingCategories}
        editData={editBudget ? {
          category: editBudget.category,
          limit: editBudget.limit,
          isFixed: editBudget.month === 0,
        } : null}
      />
    </>
  );
}
