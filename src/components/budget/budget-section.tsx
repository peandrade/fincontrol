"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Wallet, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFeedback } from "@/hooks/use-feedback";
import { useCurrency } from "@/contexts/currency-context";
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

interface BudgetSectionProps {
  refreshTrigger?: number;
}

export function BudgetSection({ refreshTrigger = 0 }: BudgetSectionProps) {
  const t = useTranslations("budget");
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithSpent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const feedback = useFeedback();
  const { formatCurrency } = useCurrency();
  const { privacy, general } = usePreferences();
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
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
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

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden h-full flex flex-col">
        {}
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-soft rounded-lg">
                <Wallet className="w-5 h-5 text-primary-color" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t("title")}
                </h3>
                <p className="text-sm text-[var(--text-dimmed)]">
                  {new Date(data?.year || 0, (data?.month || 1) - 1).toLocaleDateString(general.language === "en" ? "en-US" : general.language === "es" ? "es-ES" : "pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary text-sm"
            >
              <Plus className="w-4 h-4" />
              {t("newBudget")}
            </button>
          </div>

          {}
          {data && data.budgets.length > 0 && (
            <div className="bg-[var(--bg-hover)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[var(--text-muted)]">
                  {t("totalMonth")}
                </span>
                <div className="text-right">
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    {fmt(summary.totalSpent)}
                  </span>
                  <span className="text-sm text-[var(--text-dimmed)]">
                    {" "}/ {fmt(summary.totalLimit)}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-[var(--bg-hover-strong)] rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                      summary.totalPercentage
                    )} transition-all duration-500`}
                    style={{
                      width: `${Math.min(summary.totalPercentage, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span
                    className={`${
                      summary.totalPercentage >= 100
                        ? "text-red-400"
                        : summary.totalPercentage >= 80
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {summary.totalPercentage.toFixed(0)}% {t("percentUsed").replace("% ", "")}
                  </span>
                  <span className={summary.totalRemaining < 0 ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}>
                    {summary.totalRemaining < 0
                      ? `${t("exceededBy")} ${fmt(Math.abs(summary.totalRemaining))}`
                      : `${t("remaining")} ${fmt(summary.totalRemaining)}`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="p-6 flex-1 overflow-y-auto">
          <BudgetList
            budgets={data?.budgets || []}
            onDelete={handleDelete}
            onEdit={(budget) => setEditBudget(budget)}
            isDeleting={isDeleting}
          />
        </div>
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
