"use client";

import { useId } from "react";
import { X, TrendingUp, TrendingDown, PiggyBank, Wallet, FileText, Coins } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { isFixedIncome } from "@/types";
import type { Investment, Operation, OperationType, InvestmentType } from "@/types";

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
}

function getOperationIcon(type: OperationType, isFixed: boolean) {
  if (type === "dividend") {
    return <Coins className="w-4 h-4" />;
  }
  if (isFixed) {
    return type === "buy" || type === "deposit" ? (
      <PiggyBank className="w-4 h-4" />
    ) : (
      <Wallet className="w-4 h-4" />
    );
  }
  return type === "buy" ? (
    <TrendingUp className="w-4 h-4" />
  ) : (
    <TrendingDown className="w-4 h-4" />
  );
}

function useOperationLabel() {
  const t = useTranslations("investments");
  return (type: OperationType, isFixed: boolean): string => {
    if (type === "dividend") {
      return t("dividendLabel");
    }
    if (isFixed) {
      return type === "buy" || type === "deposit" ? t("depositLabel") : t("withdrawLabel");
    }
    return type === "buy" ? t("purchaseLabel") : t("saleLabel");
  };
}

function useFormatDate() {
  const locale = useLocale();
  return (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString(locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
}

export function TransactionHistoryModal({
  isOpen,
  onClose,
  investment,
}: TransactionHistoryModalProps) {
  const titleId = useId();
  const t = useTranslations("investments");
  const tc = useTranslations("common");
  const { formatCurrency } = useCurrency();

  if (!isOpen || !investment) return null;

  const isFixed = isFixedIncome(investment.type as InvestmentType);
  const operations = investment.operations || [];

  const sortedOperations = [...operations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalDeposits = operations
    .filter((op) => op.type === "buy" || op.type === "deposit")
    .reduce((sum, op) => sum + op.total, 0);

  const totalWithdrawals = operations
    .filter((op) => op.type === "sell" || op.type === "withdraw")
    .reduce((sum, op) => sum + op.total, 0);

  const totalDividends = operations
    .filter((op) => op.type === "dividend")
    .reduce((sum, op) => sum + op.total, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-lg shadow-2xl animate-slideUp max-h-[90vh] flex flex-col"
      >
        {}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">
              {t("transactionHistory")}
            </h2>
            <p className="text-[var(--text-dimmed)] text-sm">
              {investment.ticker || investment.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={tc("close")}
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-4 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div className={`grid gap-4 ${totalDividends > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] mb-1">
                {isFixed ? t("deposits") : t("purchases")}
              </p>
              <p className="text-emerald-400 font-semibold">
                {formatCurrency(totalDeposits)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] mb-1">
                {isFixed ? t("withdrawals") : t("sales")}
              </p>
              <p className="text-red-400 font-semibold">
                {formatCurrency(totalWithdrawals)}
              </p>
            </div>
            {totalDividends > 0 && (
              <div className="text-center">
                <p className="text-xs text-[var(--text-muted)] mb-1">{t("dividendsTab")}</p>
                <p className="text-amber-400 font-semibold">
                  {formatCurrency(totalDividends)}
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] mb-1">{t("operations")}</p>
              <p className="text-[var(--text-primary)] font-semibold">
                {operations.length}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedOperations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-[var(--text-dimmed)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">
                {t("noTransactions")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedOperations.map((op) => (
                <TransactionItem
                  key={op.id}
                  operation={op}
                  isFixed={isFixed}
                />
              ))}
            </div>
          )}
        </div>

        {}
        <div className="p-4 border-t border-[var(--border-color-strong)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all"
          >
            {tc("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionItem({
  operation,
  isFixed,
}: {
  operation: Operation;
  isFixed: boolean;
}) {
  const t = useTranslations("investments");
  const { formatCurrency } = useCurrency();
  const getOperationLabel = useOperationLabel();
  const formatDate = useFormatDate();
  const locale = useLocale();
  const isDividend = operation.type === "dividend";
  const isDeposit = operation.type === "buy" || operation.type === "deposit";
  const isPositive = isDividend || isDeposit;

  const colorClass = isDividend
    ? "text-amber-400"
    : isPositive
      ? "text-emerald-400"
      : "text-red-400";
  const bgClass = isDividend
    ? "bg-amber-500/10"
    : isPositive
      ? "bg-emerald-500/10"
      : "bg-red-500/10";

  return (
    <div className="bg-[var(--bg-hover)] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        {/* Left side */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <span className={colorClass}>
              {getOperationIcon(operation.type, isFixed)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${colorClass}`}>
                {getOperationLabel(operation.type, isFixed)}
              </span>
              <span className="text-xs text-[var(--text-dimmed)]">
                {formatDate(operation.date)}
              </span>
            </div>
            {!isFixed && !isDividend && (
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {operation.quantity.toLocaleString(locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US", {
                  maximumFractionDigits: 6,
                })}{" "}
                {t("shares")} × {formatCurrency(operation.price)}
              </p>
            )}
            {operation.fees > 0 && (
              <p className="text-xs text-[var(--text-dimmed)] mt-0.5">
                {t("fees", { amount: formatCurrency(operation.fees) })}
              </p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="text-right">
          <p className={`font-semibold ${colorClass}`}>
            {isPositive ? "+" : "-"}
            {formatCurrency(operation.total)}
          </p>
        </div>
      </div>

      {/* Notes */}
      {operation.notes && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-muted)] flex items-start gap-2">
            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--text-dimmed)]" />
            <span>{operation.notes}</span>
          </p>
        </div>
      )}
    </div>
  );
}
