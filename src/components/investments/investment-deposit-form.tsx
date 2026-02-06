"use client";

import { ChevronLeft, ArrowRight, PiggyBank, AlertTriangle, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDateForInput } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import { CurrencyInput } from "@/components/ui/currency-input";

interface InvestmentDepositFormProps {
  name: string;
  institution: string;
  initialDeposit: string;
  onInitialDepositChange: (value: string) => void;
  depositDate: string;
  onDepositDateChange: (value: string) => void;
  availableBalance: number | null;
  isLoadingBalance: boolean;
  skipBalanceCheck: boolean;
  onSkipBalanceCheckChange: (value: boolean) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function InvestmentDepositForm({
  name,
  institution,
  initialDeposit,
  onInitialDepositChange,
  depositDate,
  onDepositDateChange,
  availableBalance,
  isLoadingBalance,
  skipBalanceCheck,
  onSkipBalanceCheckChange,
  notes,
  onNotesChange,
  isSubmitting,
  onBack,
  onSubmit,
}: InvestmentDepositFormProps) {
  const t = useTranslations("investments");
  const tc = useTranslations("common");
  const { currencySymbol, formatCurrency } = useCurrency();
  const depositValue = parseFloat(initialDeposit) || 0;
  const hasInsufficientBalance = availableBalance !== null && depositValue > availableBalance && !skipBalanceCheck;

  return (
    <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      {/* Balance Display */}
      <div className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-muted)]">{t("availableBalance")}</span>
        </div>
        <span className={`font-medium ${availableBalance !== null && availableBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {isLoadingBalance ? tc("loading") : availableBalance !== null ? formatCurrency(availableBalance) : "—"}
        </span>
      </div>

      {/* Asset Info */}
      <div className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-center gap-2">
        <span className="text-sm text-[var(--text-muted)]">{t("assetLabel")}</span>
        <span className="text-[var(--text-primary)] font-medium">
          {name}{institution && ` • ${institution}`}
        </span>
      </div>

      {/* Deposit Section */}
      <div className={`bg-gradient-to-br ${hasInsufficientBalance ? 'from-red-500/10 to-orange-500/10 border-red-500/20' : 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20'} border rounded-xl p-4 space-y-4`}>
        <div className="flex items-center gap-2">
          <PiggyBank className={`w-4 h-4 ${hasInsufficientBalance ? 'text-red-400' : 'text-emerald-400'}`} />
          <span className={`text-sm font-medium ${hasInsufficientBalance ? 'text-red-400' : 'text-emerald-400'}`}>{t("initialDeposit")}</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            {tc("value")} *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">{currencySymbol}</span>
            <CurrencyInput
              value={initialDeposit}
              onChange={onInitialDepositChange}
              placeholder="0,00"
              className={`w-full bg-[var(--bg-hover)] border rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none transition-all ${hasInsufficientBalance ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[var(--border-color-strong)] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`}
              autoFocus
              required
            />
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-400 font-medium">{t("insufficientBalance")}</p>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">
                {t("insufficientBalanceDesc", { needed: formatCurrency(depositValue), available: formatCurrency(availableBalance || 0) })}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            {t("depositDate")}
          </label>
          <input
            type="date"
            value={depositDate}
            onChange={(e) => onDepositDateChange(e.target.value)}
            max={formatDateForInput(new Date())}
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            required
          />
        </div>

        <p className="text-xs text-[var(--text-dimmed)]">
          {t("minDeposit", { symbol: currencySymbol })}
        </p>
      </div>

      {/* Skip Balance Check */}
      <div className="bg-[var(--bg-hover)] rounded-xl p-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={skipBalanceCheck}
            onChange={(e) => onSkipBalanceCheckChange(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
          />
          <div>
            <span className="text-sm text-[var(--text-primary)]">{t("existingInvestment")}</span>
            <p className="text-xs text-[var(--text-dimmed)] mt-0.5">
              {t("existingInvestmentDesc")}
            </p>
          </div>
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {tc("notes")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={tc("notesPlaceholder")}
          rows={2}
          className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {tc("back")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !initialDeposit || parseFloat(initialDeposit) < 1 || hasInsufficientBalance}
          className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? tc("saving") : skipBalanceCheck ? t("createNoDiscount") : t("createAsset")}
          {!isSubmitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}
