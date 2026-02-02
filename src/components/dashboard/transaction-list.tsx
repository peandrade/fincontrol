"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import { getCategoryColor } from "@/lib/constants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TransactionFilters } from "@/components/filters/transaction-filters";
import { useTransactionStore } from "@/store/transaction-store";
import type { Transaction } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  deletingId?: string | null;
}

export function TransactionList({
  transactions,
  onDelete,
  onEdit,
  deletingId,
}: TransactionListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
  const { getFilteredTransactions, hasActiveFilters } = useTransactionStore();
  const { privacy, general } = usePreferences();

  const handleDeleteClick = (transaction: Transaction) => {
    if (!general.confirmBeforeDelete) {
      onDelete(transaction.id);
      return;
    }
    setDeleteConfirm(transaction);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const filteredTransactions = hasActiveFilters() ? getFilteredTransactions() : transactions;

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (general.defaultSort) {
      case "oldest":  return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "highest": return b.value - a.value;
      case "lowest":  return a.value - b.value;
      case "recent":
      default:        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <div
      className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300 flex flex-col"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Transações
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-dimmed)" }}>
            {hasActiveFilters()
              ? `${filteredTransactions.length} de ${transactions.length}`
              : `${transactions.length} transações`
            }
          </p>
        </div>
      </div>

      {}
      <TransactionFilters className="mb-3 sm:mb-4" />

      {sortedTransactions.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          {hasActiveFilters() ? (
            <>
              <p className="text-sm sm:text-base" style={{ color: "var(--text-dimmed)" }}>Nenhuma transação encontrada</p>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
                Tente ajustar os filtros
              </p>
            </>
          ) : (
            <>
              <p className="text-sm sm:text-base" style={{ color: "var(--text-dimmed)" }}>Nenhuma transação registrada</p>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
                Clique em &quot;+&quot; para começar
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 overflow-y-auto pr-1 sm:pr-2 max-h-[300px] sm:max-h-[400px]">
          {sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-2.5 sm:p-4 rounded-xl transition-all group gap-2"
              style={{ backgroundColor: "var(--bg-hover)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${getCategoryColor(transaction.category)}20`,
                    color: getCategoryColor(transaction.category),
                  }}
                >
                  {transaction.type === "income" ? (
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate" style={{ color: "var(--text-primary)" }}>
                    {transaction.description || transaction.category}
                  </p>
                  <p className="text-[10px] sm:text-sm truncate" style={{ color: "var(--text-dimmed)" }}>
                    <span className="hidden sm:inline">{transaction.category} • </span>{formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                <p
                  className={`font-semibold text-sm sm:text-base ${
                    transaction.type === "income"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {privacy.hideValues ? "•••••" : formatCurrency(transaction.value)}
                </p>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-1.5 hover:bg-amber-500/20 active:bg-amber-500/30 rounded-lg transition-all"
                      title="Editar"
                      aria-label="Editar transação"
                    >
                      <Pencil className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(transaction)}
                    disabled={deletingId === transaction.id}
                    className="p-1.5 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all disabled:opacity-50"
                    title="Excluir"
                    aria-label="Excluir transação"
                  >
                    {deletingId === transaction.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" aria-label="Excluindo..." />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir transação"
        message={`Tem certeza que deseja excluir a transação "${deleteConfirm?.description || deleteConfirm?.category}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={!!deletingId}
      />
    </div>
  );
}