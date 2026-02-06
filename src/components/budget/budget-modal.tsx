"use client";

import { useState, useEffect, useId } from "react";
import { X, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useCurrency } from "@/contexts/currency-context";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { category: string; limit: number; isFixed: boolean }) => Promise<void>;
  isSubmitting: boolean;
  existingCategories: string[];
  editData?: { category: string; limit: number; isFixed: boolean } | null;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  existingCategories,
  editData,
}: BudgetModalProps) {
  const t = useTranslations("budget");
  const tc = useTranslations("common");
  const titleId = useId();
  const { currencySymbol, convertToBRL } = useCurrency();
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [isFixed, setIsFixed] = useState(true);
  const isEditing = !!editData;

  useEffect(() => {
    if (isOpen && editData) {
      setCategory(editData.category);
      setLimit(editData.limit.toString());
      setIsFixed(editData.isFixed);
    } else if (isOpen && !editData) {
      setCategory("");
      setLimit("");
      setIsFixed(true);
    }
  }, [isOpen, editData]);

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (cat) => !existingCategories.includes(cat) || (isEditing && cat === editData?.category)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !limit) return;

    await onSave({
      category,
      limit: convertToBRL(parseFloat(limit)),
      isFixed,
    });

    setCategory("");
    setLimit("");
    setIsFixed(true);
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
            <div className="p-2 bg-primary-soft rounded-lg">
              <Wallet className="w-5 h-5 text-primary-color" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">
                {isEditing ? t("editBudgetTitle") : t("newBudgetTitle")}
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm">
                {isEditing ? t("editBudgetSubtitle") : t("newBudgetSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={tc("close")}
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {tc("category")}
            </label>
            {isEditing ? (
              <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-hover)] rounded-xl py-3 px-4 font-medium">
                {editData?.category}
              </p>
            ) : availableCategories.length === 0 ? (
              <p className="text-sm text-[var(--text-dimmed)] bg-[var(--bg-hover)] rounded-xl p-4">
                {t("allCategoriesBudgeted")}
              </p>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-[var(--bg-secondary)]">
                  {tc("selectCategory") || t("selectCategory")}
                </option>
                {availableCategories.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  >
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {t("monthlyLimit")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                {currencySymbol}
              </span>
              <CurrencyInput
                value={limit}
                onChange={setLimit}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                required
              />
            </div>
          </div>

          {}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-5 h-5 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t("fixedBudgetLabel")}
                </span>
                <p className="text-xs text-[var(--text-dimmed)]">
                  {t("fixedBudgetHint")}
                </p>
              </div>
            </label>
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
              disabled={isSubmitting || !category || !limit || (!isEditing && availableCategories.length === 0)}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary disabled:opacity-50"
            >
              {isSubmitting ? tc("saving") : isEditing ? tc("save") : t("createBudget")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
