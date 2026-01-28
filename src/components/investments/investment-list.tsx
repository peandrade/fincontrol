"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Trash2, Plus, Pencil, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import {
  getInvestmentTypeLabel,
  getInvestmentTypeColor,
  getInvestmentTypeIcon,
} from "@/lib/constants";
import { isVariableIncome } from "@/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Investment } from "@/types";

interface InvestmentListProps {
  investments: Investment[];
  onDelete: (id: string) => void;
  onAddOperation: (investment: Investment) => void;
  onEdit: (investment: Investment) => void;
  deletingId?: string | null;
  headerExtra?: React.ReactNode;
}

export function InvestmentList({
  investments,
  onDelete,
  onAddOperation,
  onEdit,
  deletingId,
  headerExtra,
}: InvestmentListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<Investment | null>(null);
  const { privacy, general } = usePreferences();

  const handleDeleteClick = (investment: Investment) => {
    if (!general.confirmBeforeDelete) {
      onDelete(investment.id);
      return;
    }
    setDeleteConfirm(investment);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };
  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderColor: "var(--border-color)"
  };

  if (investments.length === 0) {
    return (
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300 h-full" style={cardStyle}>
        <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: "var(--text-primary)" }}>Meus Investimentos</h3>
        <div className="text-center py-8 sm:py-12">
          <p className="text-sm sm:text-base" style={{ color: "var(--text-dimmed)" }}>Nenhum investimento registrado</p>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
            Clique em &quot;Novo Investimento&quot; para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur rounded-2xl p-4 sm:p-6 transition-colors duration-300 h-full flex flex-col" style={cardStyle}>
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Meus Investimentos</h3>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-dimmed)" }}>Acompanhe sua carteira</p>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <span className="text-xs sm:text-sm" style={{ color: "var(--text-dimmed)" }}>
            {investments.length} {investments.length === 1 ? "ativo" : "ativos"}
          </span>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-1 sm:pr-2 flex-1 min-h-0 max-h-[500px] lg:max-h-none">
        {investments.map((investment) => {
          const isPositive = investment.profitLoss >= 0;
          const color = getInvestmentTypeColor(investment.type);
          const isVariable = isVariableIncome(investment.type);

          const hasGoal = investment.goalValue && investment.goalValue > 0;
          const goalProgress = hasGoal
            ? (investment.currentValue / investment.goalValue!) * 100
            : 0;

          return (
            <div
              key={investment.id}
              className="p-3 sm:p-4 rounded-xl transition-all group"
              style={{ backgroundColor: "var(--bg-hover)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            >
              {}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {getInvestmentTypeIcon(investment.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
                        {investment.ticker || investment.name}
                      </p>
                      {investment.ticker && (
                        <span className="text-xs sm:text-sm truncate" style={{ color: "var(--text-dimmed)" }}>{investment.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap mt-1">
                      <span
                        className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium"
                        style={{ backgroundColor: `${color}30`, color }}
                      >
                        {getInvestmentTypeLabel(investment.type)}
                      </span>
                      {isVariable ? (
                        <>
                          <span className="hidden sm:inline" style={{ color: "var(--text-dimmed)" }}>
                            {investment.quantity.toLocaleString("pt-BR")} cotas
                          </span>
                          <span className="hidden sm:inline" style={{ color: "var(--text-dimmed)" }}>•</span>
                          <span style={{ color: "var(--text-dimmed)" }}>
                            PM: {privacy.hideValues ? "•••••" : formatCurrency(investment.averagePrice)}
                          </span>
                          {investment.currentPrice > 0 && (
                            <>
                              <span className="hidden sm:inline" style={{ color: "var(--text-dimmed)" }}>•</span>
                              <span className="hidden sm:inline" style={{ color: "var(--text-dimmed)" }}>
                                Atual: {privacy.hideValues ? "•••••" : formatCurrency(investment.currentPrice)}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "var(--text-dimmed)" }}>
                          Aplicado: {privacy.hideValues ? "•••••" : formatCurrency(investment.totalInvested)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
                      {privacy.hideValues ? "•••••" : formatCurrency(investment.currentValue)}
                    </p>
                    <div className={`flex items-center sm:justify-end gap-1 text-xs sm:text-sm ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {privacy.hideValues ? "•••••" : `${isPositive ? "+" : ""}${formatCurrency(investment.profitLoss)}`}
                      </span>
                      <span className="hidden sm:inline" style={{ color: "var(--text-dimmed)" }}>
                        ({isPositive ? "+" : ""}{investment.profitLossPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAddOperation(investment)}
                      className="p-1.5 hover:bg-emerald-500/20 active:bg-emerald-500/30 rounded-lg transition-all"
                      title="Nova operação"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => onEdit(investment)}
                      className="p-1.5 hover:bg-amber-500/20 active:bg-amber-500/30 rounded-lg transition-all"
                      title="Editar / Atualizar"
                    >
                      <Pencil className="w-4 h-4 text-amber-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(investment)}
                      disabled={deletingId === investment.id}
                      className="p-1.5 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all disabled:opacity-50"
                      title="Excluir"
                    >
                      {deletingId === investment.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {}
              {hasGoal && (
                <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-primary-color" />
                      <span style={{ color: "var(--text-muted)" }}>Meta</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: "var(--text-dimmed)" }}>
                        {privacy.hideValues ? "•••••" : formatCurrency(investment.currentValue)} / {privacy.hideValues ? "•••••" : formatCurrency(investment.goalValue!)}
                      </span>
                      <span className={`font-medium ${
                        goalProgress >= 100 ? "text-emerald-400" : "text-primary-color"
                      }`}>
                        {Math.min(goalProgress, 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: "var(--bg-hover)" }}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goalProgress >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-primary-gradient"
                      }`}
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                  </div>
                  {goalProgress >= 100 && (
                    <p className="text-emerald-400 text-xs mt-2 text-center">🎉 Meta alcançada!</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir investimento"
        message={`Tem certeza que deseja excluir "${deleteConfirm?.ticker || deleteConfirm?.name}"? Todas as operações relacionadas serão removidas. Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={!!deletingId}
      />
    </div>
  );
}