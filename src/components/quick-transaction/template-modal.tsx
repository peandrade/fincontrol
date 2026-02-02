"use client";

import { useState, useEffect, useId } from "react";
import { X } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useCategoryStore } from "@/store/category-store";
import type { TransactionTemplate, TransactionType } from "@/types";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    category: string;
    type: TransactionType;
    value?: number;
  }) => Promise<void>;
  template?: TransactionTemplate | null;
  isSubmitting: boolean;
}

export function TemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
  isSubmitting,
}: TemplateModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [includeValue, setIncludeValue] = useState(false);

  const { fetchCategories, getExpenseCategories, getIncomeCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setType(template.type);
      setCategory(template.category);
      if (template.value) {
        setValue(template.value.toString());
        setIncludeValue(true);
      } else {
        setValue("");
        setIncludeValue(false);
      }
    } else {

      setName("");
      setDescription("");
      setType("expense");
      setCategory("");
      setValue("");
      setIncludeValue(false);
    }
  }, [template, isOpen]);

  const categoryList = type === "income" ? getIncomeCategories() : getExpenseCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return;

    await onSave({
      name,
      description: description || undefined,
      category,
      type,
      value: includeValue && value ? parseFloat(value) : undefined,
    });

    setName("");
    setDescription("");
    setType("expense");
    setCategory("");
    setValue("");
    setIncludeValue(false);
    onClose();
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory("");
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
          <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">
            {template ? "Editar Atalho" : "Novo Atalho"}
          </h2>
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
              Nome do atalho
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Almoço"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              required
            />
          </div>

          {}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                type === "expense"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                type === "income"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              }`}
            >
              Receita
            </button>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                Selecione uma categoria
              </option>
              {categoryList.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.name}
                  className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  {cat.name}
                </option>
              ))}
            </select>
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
              placeholder="Ex: Almoço na empresa"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          {}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={includeValue}
                onChange={(e) => setIncludeValue(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0"
              />
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Incluir valor fixo
              </span>
            </label>

            {includeValue && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                  R$
                </span>
                <CurrencyInput
                  value={value}
                  onChange={setValue}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
            )}
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
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : template ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
