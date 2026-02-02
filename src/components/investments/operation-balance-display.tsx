"use client";

import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OperationBalanceDisplayProps {
  balance: number | null;
  isLoading: boolean;
}

export function OperationBalanceDisplay({
  balance,
  isLoading,
}: OperationBalanceDisplayProps) {
  return (
    <div
      className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-center justify-between"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
        <span className="text-sm text-[var(--text-muted)]">Saldo Disponível:</span>
      </div>
      <span
        className={`font-medium ${
          balance !== null && balance < 0 ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {isLoading
          ? "Carregando..."
          : balance !== null
          ? formatCurrency(balance)
          : "—"}
      </span>
    </div>
  );
}
