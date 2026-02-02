"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { X, Target, Sparkles } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_COLORS,
  GOAL_CATEGORY_ICONS,
  type GoalCategoryType,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface EmergencySuggestion {
  suggestedTarget: number;
  estimatedMonthlyExpenses: number;
  monthsAnalyzed: number;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    category: GoalCategoryType;
    targetValue: number;
    currentValue?: number;
    targetDate?: string;
    color?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function GoalModal({ isOpen, onClose, onSave, isSubmitting }: GoalModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategoryType | "">("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [emergencySuggestion, setEmergencySuggestion] = useState<EmergencySuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const titleId = useId();

  // Handle Escape key to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    },
    [onClose, isSubmitting]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (category === "emergency" && !emergencySuggestion) {
      setLoadingSuggestion(true);
      fetch("/api/goals/emergency-suggestion")
        .then((res) => res.json())
        .then((data) => {
          setEmergencySuggestion(data);
        })
        .catch(console.error)
        .finally(() => setLoadingSuggestion(false));
    }
  }, [category, emergencySuggestion]);

  useEffect(() => {
    if (category && !name) {
      setName(GOAL_CATEGORY_LABELS[category as GoalCategoryType]);
    }
  }, [category, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !targetValue) return;

    await onSave({
      name,
      description: description || undefined,
      category: category as GoalCategoryType,
      targetValue: parseFloat(targetValue),
      currentValue: currentValue ? parseFloat(currentValue) : undefined,
      targetDate: targetDate || undefined,
      color: GOAL_CATEGORY_COLORS[category as GoalCategoryType],
    });

    setName("");
    setDescription("");
    setCategory("");
    setTargetValue("");
    setCurrentValue("");
    setTargetDate("");
    setEmergencySuggestion(null);
  };

  const applySuggestion = () => {
    if (emergencySuggestion) {
      setTargetValue(emergencySuggestion.suggestedTarget.toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-soft rounded-lg">
              <Target className="w-5 h-5 text-primary-color" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">
                Nova Meta
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm">
                Defina seu objetivo financeiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Tipo de Meta
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    if (cat !== "emergency") {
                      setEmergencySuggestion(null);
                    }
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    category === cat
                      ? "border-[var(--color-primary)] bg-primary-soft"
                      : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                  }`}
                >
                  <span className="text-xl">{GOAL_CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs text-[var(--text-muted)] text-center leading-tight">
                    {GOAL_CATEGORY_LABELS[cat].split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {}
          {category === "emergency" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Sugestão Automática
                </span>
              </div>
              {loadingSuggestion ? (
                <p className="text-sm text-[var(--text-dimmed)]">Calculando...</p>
              ) : emergencySuggestion ? (
                <>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    Baseado nas suas despesas de{" "}
                    <strong>{formatCurrency(emergencySuggestion.estimatedMonthlyExpenses)}/mês</strong>,
                    recomendamos uma reserva de:
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-red-400">
                      {formatCurrency(emergencySuggestion.suggestedTarget)}
                    </span>
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                      Usar valor
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-dimmed)] mt-1">
                    = 6 meses de despesas
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--text-dimmed)]">
                  Adicione transações para calcular automaticamente
                </p>
              )}
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Nome da Meta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem para Europa"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              required
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Valor Objetivo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                R$
              </span>
              <CurrencyInput
                value={targetValue}
                onChange={setTargetValue}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                required
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Já tenho guardado (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                R$
              </span>
              <CurrencyInput
                value={currentValue}
                onChange={setCurrentValue}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Data Prevista (opcional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
            <p className="mt-1 text-xs text-[var(--text-dimmed)]">
              Usada para calcular quanto guardar por mês
            </p>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anotações sobre a meta..."
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
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
              disabled={isSubmitting || !name || !category || !targetValue}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Criar Meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
