"use client";

import { useState, useEffect, useId } from "react";
import { X, RefreshCw } from "lucide-react";
import { ColorPicker } from "./color-picker";
import { IconPicker, DynamicIcon } from "./icon-picker";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/store/category-store";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  isSubmitting: boolean;
  category?: Category | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  category,
}: CategoryModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("Tag");
  const [color, setColor] = useState("#8B5CF6");
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setName("");
      setType("expense");
      setIcon("Tag");
      setColor("#8B5CF6");
    }
    setError(null);
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      if (isEditing) {
        await onSave({ name, icon, color } as UpdateCategoryInput);
      } else {
        await onSave({ name, type, icon, color } as CreateCategoryInput);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria");
    }
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
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
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
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {}
          <div className="flex items-center justify-center p-4 rounded-xl bg-[var(--bg-hover)]">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <DynamicIcon name={icon} className="w-6 h-6" style={{ color }} />
            </div>
            <span className="ml-3 text-lg font-medium text-[var(--text-primary)]">
              {name || "Nome da categoria"}
            </span>
          </div>

          {}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Tipo
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType("expense")}
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
                  onClick={() => setType("income")}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    type === "income"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                  }`}
                >
                  Receita
                </button>
              </div>
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Academia, Assinaturas..."
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              required
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Cor
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Ícone
            </label>
            <IconPicker value={icon} onChange={setIcon} color={color} />
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
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white hover:opacity-90 transition-all shadow-lg shadow-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando...
                </span>
              ) : isEditing ? (
                "Salvar"
              ) : (
                "Criar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
