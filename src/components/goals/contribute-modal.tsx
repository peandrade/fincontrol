"use client";

import { useState, useId } from "react";
import { X, PiggyBank } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/utils";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, notes?: string) => Promise<void>;
  isSubmitting: boolean;
  goalName: string;
  remaining: number;
}

export function ContributeModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  goalName,
  remaining,
}: ContributeModalProps) {
  const titleId = useId();
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    await onSave(parseFloat(value), notes || undefined);

    setValue("");
    setNotes("");
  };

  const setMaxValue = () => {
    setValue(remaining.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-sm shadow-2xl animate-slideUp"
      >
        {}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <PiggyBank className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)]">
                Guardar Dinheiro
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm truncate max-w-[180px]">
                {goalName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {}
          <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--text-dimmed)] mb-1">Faltam</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(remaining)}
            </p>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Valor a guardar
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                R$
              </span>
              <CurrencyInput
                value={value}
                onChange={setValue}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-20 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                autoFocus
                required
              />
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={setMaxValue}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors font-medium"
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: 13º salário"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !value}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-400 hover:to-green-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
