"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { X, Bookmark } from "lucide-react";
import { formatDateForInput } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { useCategoryStore } from "@/store/category-store";
import type { CreateTransactionInput, Transaction, TransactionType, TransactionTemplate } from "@/types";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTransactionInput, saveAsTemplate?: { name: string }) => Promise<void>;
  isSubmitting: boolean;
  initialType?: TransactionType;
  template?: TransactionTemplate | null;
  editTransaction?: Transaction | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  initialType,
  template,
  editTransaction,
}: TransactionModalProps) {
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const isEditing = !!editTransaction;
  const { currencySymbol, convertToBRL } = useCurrency();
  const [type, setType] = useState<TransactionType>("expense");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [description, setDescription] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const titleId = useId();
  const { fetchCategories, getExpenseCategories, getIncomeCategories } = useCategoryStore();

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
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setCategory(editTransaction.category);
        setDescription(editTransaction.description || "");
        setValue(editTransaction.value?.toString() || "");
        setDate(formatDateForInput(new Date(editTransaction.date)));
        setSaveAsTemplate(false);
        setTemplateName("");
      } else if (template) {
        setType(template.type);
        setCategory(template.category);
        setDescription(template.description || "");
        setValue(template.value?.toString() || "");
        setDate(formatDateForInput(new Date()));
        setSaveAsTemplate(false);
        setTemplateName("");
      } else if (initialType) {
        setType(initialType);
        setCategory("");
        setDescription("");
        setValue("");
        setDate(formatDateForInput(new Date()));
        setSaveAsTemplate(false);
        setTemplateName("");
      }
    }
  }, [isOpen, template, initialType, editTransaction]);

  const categoryList = type === "income" ? getIncomeCategories() : getExpenseCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !category) return;
    if (saveAsTemplate && !templateName) return;

    await onSave(
      {
        type,
        value: convertToBRL(parseFloat(value)),
        category,
        date: new Date(date),
        description: description || undefined,
      },
      saveAsTemplate ? { name: templateName } : undefined
    );

    setValue("");
    setCategory("");
    setDescription("");
    setSaveAsTemplate(false);
    setTemplateName("");
    onClose();
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory("");
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
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)]">
          <h2
            id={titleId}
            className="text-xl font-semibold text-[var(--text-primary)]"
          >
            {isEditing ? t("editTransaction") : t("newTransaction")}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label={t("closeModal")}
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              {t("expense")}
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
              {t("income")}
            </button>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {tc("value")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                {currencySymbol}
              </span>
              <CurrencyInput
                value={value}
                onChange={setValue}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
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
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                {t("selectCategory")}
              </option>
              {categoryList.map((cat) => (
                <option key={cat.id} value={cat.name} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {tc("date")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              required
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {t("descriptionOptional")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          {}
          {!template && (
            <div className="border-t border-[var(--border-color)] pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0"
                />
                <Bookmark className="w-4 h-4 text-[var(--text-dimmed)]" />
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  {t("saveAsShortcut")}
                </span>
              </label>

              {saveAsTemplate && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t("shortcutName")}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-2.5 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
                    required={saveAsTemplate}
                  />
                </div>
              )}
            </div>
          )}

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
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary disabled:opacity-50"
            >
              {isSubmitting ? tc("saving") : isEditing ? tc("save") : tc("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}