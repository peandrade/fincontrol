"use client";

import { useState, useMemo, useId } from "react";
import { X, ShoppingCart, Repeat, CreditCard, AlertTriangle } from "lucide-react";
import { PURCHASE_CATEGORIES } from "@/lib/card-constants";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { CreatePurchaseInput, CreditCard as CardType } from "@/types/credit-card";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardType | null;
  onSave: (data: CreatePurchaseInput) => Promise<void>;
  isSubmitting: boolean;
}

export function PurchaseModal({
  isOpen,
  onClose,
  card,
  onSave,
  isSubmitting,
}: PurchaseModalProps) {
  const titleId = useId();
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<string>(PURCHASE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [installments, setInstallments] = useState("1");
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");

  const { usedLimit, availableLimit } = useMemo(() => {
    if (!card) return { usedLimit: 0, availableLimit: 0 };

    const used = (card.invoices || [])
      .filter((inv) => inv.status === "open" || inv.status === "closed")
      .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

    return {
      usedLimit: used,
      availableLimit: card.limit - used,
    };
  }, [card]);

  const purchaseValue = value ? parseFloat(value) : 0;
  const exceedsLimit = purchaseValue > availableLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !description || !value || !category || !date || exceedsLimit) return;

    await onSave({
      creditCardId: card.id,
      description,
      value: parseFloat(value),
      category,
      date: new Date(date),
      installments: parseInt(installments),
      isRecurring,
      notes: notes || undefined,
    });

    setDescription("");
    setValue("");
    setCategory(PURCHASE_CATEGORIES[0] as string);
    setDate(new Date().toISOString().split("T")[0]);
    setInstallments("1");
    setIsRecurring(false);
    setNotes("");
    onClose();
  };

  if (!isOpen || !card) return null;

  const installmentValue = value && parseInt(installments) > 1
    ? parseFloat(value) / parseInt(installments)
    : null;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto"
      >
        {}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] sticky top-0 bg-[var(--bg-secondary)] z-10">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${card.color}30` }}
            >
              <ShoppingCart className="w-5 h-5" style={{ color: card.color }} aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">Nova Compra</h2>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{card.name}</span>
              </div>
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
        <div className="px-6 pt-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${card.color}15` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-dimmed)] mb-1">Limite Disponível</p>
                <p
                  className="text-xl font-bold"
                  style={{ color: availableLimit <= 0 ? "#EF4444" : card.color }}
                >
                  {formatCurrency(availableLimit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-dimmed)] mb-1">Limite Total</p>
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  {formatCurrency(card.limit)}
                </p>
              </div>
            </div>
            {}
            <div className="mt-3">
              <div className="w-full rounded-full h-2 bg-[var(--bg-hover)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((usedLimit / card.limit) * 100, 100)}%`,
                    backgroundColor: (usedLimit / card.limit) > 0.8 ? "#EF4444" : card.color,
                  }}
                />
              </div>
              <p className="text-xs text-[var(--text-dimmed)] mt-1 text-right">
                {formatCurrency(usedLimit)} usado de {formatCurrency(card.limit)}
              </p>
            </div>
          </div>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Amazon, iFood, Uber..."
              required
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color"
            />
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Valor Total *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
                <CurrencyInput
                  value={value}
                  onChange={setValue}
                  placeholder="0,00"
                  required
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Data *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Categoria *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color appearance-none cursor-pointer"
            >
              {PURCHASE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Parcelas
            </label>
            <select
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color appearance-none cursor-pointer"
            >
              <option value="1" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">À vista</option>
              {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                  {n}x
                </option>
              ))}
            </select>
            {installmentValue && (
              <p className="mt-1 text-sm text-gray-500">
                {installments}x de {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(installmentValue)}
              </p>
            )}
          </div>

          {}
          <div
            onClick={() => setIsRecurring(!isRecurring)}
            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
              isRecurring
                ? "bg-blue-500/20 border border-blue-500/50"
                : "bg-[var(--bg-hover)] border border-[var(--border-color-strong)]"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                isRecurring ? "bg-blue-500/30" : "bg-[var(--bg-hover-strong)]"
              }`}
            >
              <Repeat className={`w-5 h-5 ${isRecurring ? "text-blue-400" : "text-[var(--text-muted)]"}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${isRecurring ? "text-blue-400" : "text-[var(--text-primary)]"}`}>
                Cobrança Recorrente
              </p>
              <p className="text-[var(--text-dimmed)] text-sm">
                Assinaturas que se repetem todo mês
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isRecurring ? "border-blue-400 bg-blue-400" : "border-gray-500"
              }`}
            >
              {isRecurring && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione detalhes..."
              rows={2}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color resize-none"
            />
          </div>

          {}
          {exceedsLimit && purchaseValue > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  Valor excede o limite disponível
                </p>
                <p className="text-xs text-red-400/70">
                  Limite disponível: {formatCurrency(availableLimit)} | Valor da compra: {formatCurrency(purchaseValue)}
                </p>
              </div>
            </div>
          )}

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
              disabled={isSubmitting || !description || !value || exceedsLimit}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-lg disabled:opacity-50"
              style={{ backgroundColor: card.color }}
            >
              {isSubmitting ? "Adicionando..." : "Adicionar Compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}