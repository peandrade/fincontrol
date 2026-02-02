"use client";

import { TrendingUp, TrendingDown, PiggyBank, Wallet, Coins } from "lucide-react";
import type { OperationType } from "@/types";

interface OperationTypeSelectorProps {
  type: OperationType;
  onTypeChange: (type: OperationType) => void;
  isFixed: boolean;
}

export function OperationTypeSelector({
  type,
  onTypeChange,
  isFixed,
}: OperationTypeSelectorProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Tipo de operação">
      <button
        type="button"
        onClick={() => onTypeChange("buy")}
        aria-pressed={type === "buy"}
        className={`flex-1 py-3 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          type === "buy"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
            : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
        }`}
      >
        {isFixed ? (
          <PiggyBank className="w-4 h-4" aria-hidden="true" />
        ) : (
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{isFixed ? "Depósito" : "Compra"}</span>
        <span className="sm:hidden">{isFixed ? "Dep." : "Compra"}</span>
      </button>

      <button
        type="button"
        onClick={() => onTypeChange("sell")}
        aria-pressed={type === "sell"}
        className={`flex-1 py-3 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          type === "sell"
            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
            : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
        }`}
      >
        {isFixed ? (
          <Wallet className="w-4 h-4" aria-hidden="true" />
        ) : (
          <TrendingDown className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{isFixed ? "Resgate" : "Venda"}</span>
        <span className="sm:hidden">{isFixed ? "Resg." : "Venda"}</span>
      </button>

      {!isFixed && (
        <button
          type="button"
          onClick={() => onTypeChange("dividend")}
          aria-pressed={type === "dividend"}
          className={`flex-1 py-3 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            type === "dividend"
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/25"
              : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
          }`}
        >
          <Coins className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Provento</span>
          <span className="sm:hidden">Prov.</span>
        </button>
      )}
    </div>
  );
}
