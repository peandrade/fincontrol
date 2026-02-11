"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Target, RefreshCw, Trophy, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import { useFeedback } from "@/hooks/use-feedback";
import { getGoalCategoryLabel, getGoalCategoryColor, getGoalCategoryIcon, type GoalCategoryType } from "@/lib/constants";
import { GoalModal } from "./goal-modal";
import { EditGoalModal } from "./edit-goal-modal";
import { ContributeModal } from "./contribute-modal";
import { GoalCard } from "./goal-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { GoalWithProgress } from "@/app/api/goals/route";

interface GoalData {
  goals: GoalWithProgress[];
  summary: {
    totalGoals: number;
    completedGoals: number;
    totalTargetValue: number;
    totalCurrentValue: number;
    overallProgress: number;
  };
}

interface GoalSectionProps {
  onGoalUpdated?: () => void;
  headerExtra?: React.ReactNode;
}

type OperationType = "deposit" | "withdraw";

export function GoalSection({ onGoalUpdated, headerExtra }: GoalSectionProps) {
  const [data, setData] = useState<GoalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [operationType, setOperationType] = useState<OperationType>("deposit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const { formatCurrency } = useCurrency();
  const { privacy, general } = usePreferences();
  const feedback = useFeedback();
  const t = useTranslations("goals");
  const tc = useTranslations("common");

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch("/api/goals");
      if (response.ok) {
        const goalData = await response.json();
        setData(goalData);
      }
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSave = async (goalData: {
    name: string;
    description?: string;
    category: GoalCategoryType;
    targetValue: number;
    currentValue?: number;
    targetDate?: string;
    color?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        feedback.success();
        await fetchGoals();
        setIsModalOpen(false);
        onGoalUpdated?.();
      }
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = (id: string) => {
    if (!general.confirmBeforeDelete) {
      (async () => {
        setIsDeleting(true);
        try {
          const response = await fetch(`/api/goals/${id}`, { method: "DELETE" });
          if (response.ok) {
            await fetchGoals();
            onGoalUpdated?.();
          }
        } catch (error) {
          console.error("Erro ao deletar meta:", error);
        } finally {
          setIsDeleting(false);
        }
      })();
      return;
    }
    setDeleteGoalId(id);
  };

  const handleDelete = async () => {
    if (!deleteGoalId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/goals/${deleteGoalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchGoals();
        onGoalUpdated?.();
      }
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
    } finally {
      setIsDeleting(false);
      setDeleteGoalId(null);
    }
  };

  const handleEdit = async (goalData: {
    name: string;
    description?: string;
    category: GoalCategoryType;
    targetValue: number;
    targetDate?: string;
    color?: string;
  }) => {
    if (!editGoalId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/goals/${editGoalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        await fetchGoals();
        setEditGoalId(null);
        onGoalUpdated?.();
      }
    } catch (error) {
      console.error("Erro ao editar meta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenContribute = (goalId: string, type: OperationType) => {
    setContributeGoalId(goalId);
    setOperationType(type);
  };

  const handleContribute = async (value: number, notes?: string) => {
    if (!contributeGoalId) return;
    setIsContributing(true);
    try {
      const response = await fetch(`/api/goals/${contributeGoalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: operationType === "withdraw" ? -value : value,
          notes,
          operationType,
        }),
      });

      if (response.ok) {
        feedback.success();
        await fetchGoals();
        setContributeGoalId(null);
        onGoalUpdated?.();
      }
    } catch (error) {
      console.error("Erro ao contribuir:", error);
    } finally {
      setIsContributing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center justify-center py-6 sm:py-8">
          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalGoals: 0,
    completedGoals: 0,
    totalTargetValue: 0,
    totalCurrentValue: 0,
    overallProgress: 0,
  };

  const activeGoals = data?.goals.filter((g) => !g.isCompleted) || [];
  const completedGoals = data?.goals.filter((g) => g.isCompleted) || [];
  const editGoal = data?.goals.find((g) => g.id === editGoalId);
  const contributeGoal = data?.goals.find((g) => g.id === contributeGoalId);

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden max-h-[540px] flex flex-col">
        {}
        <div className="p-4 sm:p-6 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary-soft rounded-lg">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary-color" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  {t("title")}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-dimmed)]">
                  {summary.totalGoals > 0
                    ? t("completedOf", { completed: summary.completedGoals, total: summary.totalGoals })
                    : t("defineObjectives")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {headerExtra}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("newGoal")}</span>
              </button>
            </div>
          </div>

          {}
          {data && data.goals.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-[var(--bg-hover)] rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)] mb-0.5 sm:mb-1">{t("savedLabel")}</p>
                <p className="text-sm sm:text-lg font-bold text-emerald-400">
                  {privacy.hideValues ? "•••••" : formatCurrency(summary.totalCurrentValue)}
                </p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)] mb-0.5 sm:mb-1">{t("objectiveLabel")}</p>
                <p className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                  {privacy.hideValues ? "•••••" : formatCurrency(summary.totalTargetValue)}
                </p>
              </div>
            </div>
          )}

          {}
          {data && data.goals.length > 0 && (
            <div className="mt-2 sm:mt-3">
              <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                <span className="text-[var(--text-dimmed)]">{t("overallProgress")}</span>
                <span className="text-primary-color font-medium">
                  {summary.overallProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(summary.overallProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto flex-1 min-h-0 max-h-[400px] lg:max-h-none">
          {data?.goals.length === 0 ? (
            <div className="text-center py-4 sm:py-6">
              <Target className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--text-dimmed)] mx-auto mb-2" />
              <p className="text-sm sm:text-base text-[var(--text-muted)]">{t("noGoals")}</p>
              <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)]">
                {t("defineFinancialGoals")}
              </p>
            </div>
          ) : (
            <>
              {}
              {activeGoals.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-primary-color uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {t("inProgress")} ({activeGoals.length})
                  </span>
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => setEditGoalId(goal.id)}
                      onDelete={() => handleDeleteGoal(goal.id)}
                      onDeposit={() => handleOpenContribute(goal.id, "deposit")}
                      onWithdraw={() => handleOpenContribute(goal.id, "withdraw")}
                    />
                  ))}
                </div>
              )}

              {}
              {completedGoals.length > 0 && (
                <div className="space-y-2 mt-4">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {t("completed")} ({completedGoals.length})
                  </span>
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => setEditGoalId(goal.id)}
                      onDelete={() => handleDeleteGoal(goal.id)}
                      onWithdraw={() => handleOpenContribute(goal.id, "withdraw")}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      <EditGoalModal
        isOpen={!!editGoalId}
        onClose={() => setEditGoalId(null)}
        onSave={handleEdit}
        isSubmitting={isSubmitting}
        goal={editGoal || null}
      />

      <ConfirmDialog
        isOpen={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={handleDelete}
        title={t("removeGoal")}
        message={t("removeGoalConfirm")}
        confirmText={tc("remove")}
        isLoading={isDeleting}
      />

      <ContributeModal
        isOpen={!!contributeGoalId}
        onClose={() => setContributeGoalId(null)}
        onSave={handleContribute}
        isSubmitting={isContributing}
        goalName={contributeGoal?.name || ""}
        remaining={contributeGoal?.remaining || 0}
        currentValue={contributeGoal?.currentValue || 0}
        operationType={operationType}
      />
    </>
  );
}
