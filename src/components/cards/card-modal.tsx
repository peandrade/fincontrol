"use client";

import { useState, useId } from "react";
import { X, CreditCard } from "lucide-react";
import type { CreateCardInput } from "@/types/credit-card";
import { CARD_COLORS } from "@/lib/card-constants";
import { CurrencyInput } from "@/components/ui/currency-input";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCardInput) => Promise<void>;
  isSubmitting: boolean;
}

export function CardModal({ isOpen, onClose, onSave, isSubmitting }: CardModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [lastDigits, setLastDigits] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");
  const [color, setColor] = useState(CARD_COLORS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !closingDay || !dueDay) return;

    await onSave({
      name,
      lastDigits: lastDigits || undefined,
      limit: limit ? parseFloat(limit) : 0,
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color,
    });

    setName("");
    setLastDigits("");
    setLimit("");
    setClosingDay("1");
    setDueDay("10");
    setColor(CARD_COLORS[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp"
      >
        {}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}30` }}>
              <CreditCard className="w-5 h-5" style={{ color }} aria-hidden="true" />
            </div>
            <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">Novo Cartão</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Nome do Cartão *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Inter, Itaú..."
              required
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Últimos 4 dígitos (opcional)
            </label>
            <input
              type="text"
              value={lastDigits}
              onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              maxLength={4}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Limite (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
              <CurrencyInput
                value={limit}
                onChange={setLimit}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Dia de Fechamento *
              </label>
              <select
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                required
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 pr-10 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] appearance-none cursor-pointer"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Dia de Vencimento *
              </label>
              <select
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 pr-10 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] appearance-none cursor-pointer"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Cor do Cartão
            </label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--bg-secondary)]" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-10 rounded-md flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-medium">{name || "Nome do Cartão"}</p>
                <p className="text-[var(--text-muted)] text-sm">
                  •••• {lastDigits || "0000"}
                </p>
              </div>
            </div>
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
              disabled={isSubmitting || !name}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-lg disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {isSubmitting ? "Salvando..." : "Criar Cartão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}