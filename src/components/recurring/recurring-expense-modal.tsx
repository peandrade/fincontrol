"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { X, Repeat, Calendar } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { useCategoryStore } from "@/store/category-store";

interface RecurringExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    description: string;
    value: number;
    category: string;
    dueDay: number;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  initialData?: {
    description: string;
    value: number;
    category: string;
    dueDay: number;
    notes?: string | null;
  } | null;
}

export function RecurringExpenseModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  initialData,
}: RecurringExpenseModalProps) {
  const t = useTranslations("recurring");
  const tc = useTranslations("common");
  const { currencySymbol, convertToBRL } = useCurrency();
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [notes, setNotes] = useState("");
  const isEditing = !!initialData;
  const titleId = useId();

  const { fetchCategories, getExpenseCategories } = useCategoryStore();

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
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (isOpen && initialData) {
      setDescription(initialData.description);
      setValue(initialData.value.toString());
      setCategory(initialData.category);
      setDueDay(initialData.dueDay.toString());
      setNotes(initialData.notes || "");
    } else if (isOpen && !initialData) {
      setDescription("");
      setValue("");
      setCategory("");
      setDueDay("1");
      setNotes("");
    }
  }, [isOpen, initialData]);

  const expenseCategories = getExpenseCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !value || !category) return;

    await onSave({
      description,
      value: convertToBRL(parseFloat(value)),
      category,
      dueDay: parseInt(dueDay),
      notes: notes || undefined,
    });

    setDescription("");
    setValue("");
    setCategory("");
    setDueDay("1");
    setNotes("");
    onClose();
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
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Repeat className="w-5 h-5 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">
                {isEditing ? t("editExpenseTitle") : t("newExpenseTitle")}
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm">
                {isEditing ? t("editExpenseSubtitle") : t("newExpenseSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label={tc("close")}
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {t("descriptionLabel")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              required
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {t("monthlyValue")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                {currencySymbol}
              </span>
              <CurrencyInput
                value={value}
                onChange={setValue}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                required
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {tc("category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-[var(--bg-secondary)]">
                {t("selectCategory")}
              </option>
              {expenseCategories.map((cat) => (
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
              <Calendar className="w-4 h-4 inline mr-1" />
              {t("dueDayLabel")}
            </label>
            <select
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option
                  key={day}
                  value={day}
                  className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  {t("dueDayOption", { day })}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--text-dimmed)]">
              {t("dueDayHint")}
            </p>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {tc("notesOptional")}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description || !value || !category}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
            >
              {isSubmitting ? tc("saving") : isEditing ? tc("save") : t("createExpense")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
