"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import type { OperationType } from "@/types";

type SellMode = "quantity" | "value";

interface OperationFormActionsProps {
  type: OperationType;
  isFixed: boolean;
  isSubmitting: boolean;
  total: number;
  availableBalance: number | null;
  skipBalanceCheck: boolean;
  onSkipBalanceCheckChange: (value: boolean) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  hasExcessError: boolean;
  totalValue: string;
  quantity: string;
  price: string;
  sellMode: SellMode;
  sellTargetValue: string;
  calculatedQuantity: number;
}

export function OperationFormActions({
  type,
  isFixed,
  isSubmitting,
  total,
  availableBalance,
  skipBalanceCheck,
  onSkipBalanceCheckChange,
  notes,
  onNotesChange,
  onClose,
  hasExcessError,
  totalValue,
  quantity,
  price,
  sellMode,
  sellTargetValue,
  calculatedQuantity,
}: OperationFormActionsProps) {
  const t = useTranslations("investments");
  const tc = useTranslations("common");
  const { formatCurrency } = useCurrency();
  const hasInsufficientBalance = type === "buy" && availableBalance !== null && total > availableBalance && !skipBalanceCheck;

  const isFormInvalid = type === "dividend"
    ? !totalValue
    : isFixed
      ? !totalValue
      : (type === "sell" && sellMode === "value"
          ? (!sellTargetValue || !price || calculatedQuantity <= 0)
          : (!quantity || !price)
        );

  return (
    <>
      {/* Total Display */}
      {total > 0 && (
        <div className="bg-[var(--bg-hover)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">
              {type === "dividend" ? t("dividendValue") : t("operationTotal")}
            </span>
            <span className={`text-xl font-bold ${
              type === "buy" || type === "dividend" ? "text-emerald-400" : "text-red-400"
            }`}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}

      {/* Insufficient Balance Warning */}
      {type === "buy" && hasInsufficientBalance && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-red-400 font-medium">{t("insufficientBalance")}</p>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">
              {t("insufficientBalanceDesc", { needed: formatCurrency(total), available: formatCurrency(availableBalance || 0) })}
            </p>
          </div>
        </div>
      )}

      {/* Skip Balance Checkbox */}
      {type === "buy" && (
        <div className="bg-[var(--bg-hover)] rounded-xl p-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipBalanceCheck}
              onChange={(e) => onSkipBalanceCheckChange(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
            />
            <div>
              <span className="text-sm text-[var(--text-primary)]">{t("noBalanceDiscount")}</span>
              <p className="text-xs text-[var(--text-dimmed)] mt-0.5">
                {t("noBalanceDiscountDesc")}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Notes Field */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {tc("notesOptional")}
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t("notePlaceholder")}
          className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
        />
      </div>

      {/* Form Buttons */}
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
          disabled={isSubmitting || hasExcessError || hasInsufficientBalance || isFormInvalid}
          className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-lg disabled:opacity-50 ${
            type === "buy" || type === "dividend"
              ? type === "dividend"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 shadow-amber-500/25"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25"
              : "bg-gradient-to-r from-red-500 to-orange-500 shadow-red-500/25"
          }`}
        >
          {isSubmitting
            ? tc("saving")
            : type === "dividend"
              ? t("registerDividend")
              : isFixed
                ? type === "buy"
                  ? skipBalanceCheck ? t("registerNoDiscount") : t("registerDeposit")
                  : t("registerWithdraw")
                : type === "buy"
                  ? skipBalanceCheck ? t("registerNoDiscount") : t("registerPurchase")
                  : t("registerSale")
          }
        </button>
      </div>
    </>
  );
}
