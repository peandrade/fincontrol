"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDateForInput, parseDateFromDB, formatDateFromDB } from "@/lib/utils";
import { isFixedIncome } from "@/types";
import { CurrencyInput } from "@/components/ui/currency-input";
import { OperationTypeSelector } from "./operation-type-selector";
import { OperationBalanceDisplay } from "./operation-balance-display";
import { OperationSellMode } from "./operation-sell-mode";
import { OperationFormActions } from "./operation-form-actions";
import { useCurrency } from "@/contexts/currency-context";
import type { Investment, CreateOperationInput, OperationType } from "@/types";

type SellMode = "quantity" | "value";

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onSave: (data: CreateOperationInput) => Promise<void>;
  isSubmitting: boolean;
}

export function OperationModal({
  isOpen,
  onClose,
  investment,
  onSave,
  isSubmitting,
}: OperationModalProps) {
  const [type, setType] = useState<OperationType>("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [fees, setFees] = useState("");
  const [notes, setNotes] = useState("");

  const [sellMode, setSellMode] = useState<SellMode>("quantity");
  const [sellTargetValue, setSellTargetValue] = useState("");

  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [skipBalanceCheck, setSkipBalanceCheck] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const t = useTranslations("investments");
  const tc = useTranslations("common");
  const { currencySymbol, convertToBRL, formatCurrency } = useCurrency();
  const titleId = useId();
  const isFixed = investment ? isFixedIncome(investment.type) : false;

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

  const priceNum = parseFloat(price) || 0;
  const sellTargetNum = parseFloat(sellTargetValue) || 0;
  const calculatedQuantity = priceNum > 0 && sellTargetNum > 0
    ? Math.floor((sellTargetNum / priceNum) * 1000000) / 1000000
    : 0;
  const calculatedValue = calculatedQuantity * priceNum;

  useEffect(() => {
    if (type === "sell" && sellMode === "value" && calculatedQuantity > 0) {
      setQuantity(calculatedQuantity.toString());
    }
  }, [calculatedQuantity, type, sellMode]);

  useEffect(() => {
    if (type === "buy") {
      setSellMode("quantity");
      setSellTargetValue("");
    }
  }, [type]);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingBalance(true);
      fetch("/api/balance")
        .then((res) => res.json())
        .then((data) => {
          setAvailableBalance(data.balance);
        })
        .catch(() => {
          setAvailableBalance(null);
        })
        .finally(() => {
          setIsLoadingBalance(false);
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investment) return;

    if (isFixed) {
      if (!totalValue) return;
      await onSave({
        investmentId: investment.id,
        type,
        quantity: 1,
        price: convertToBRL(parseFloat(totalValue)),
        date: new Date(date),
        fees: fees ? convertToBRL(parseFloat(fees)) : 0,
        notes: notes || undefined,
        skipBalanceCheck: type === "buy" ? skipBalanceCheck : undefined,
      });
    } else {
      if (!quantity || !price) return;
      await onSave({
        investmentId: investment.id,
        type,
        quantity: parseFloat(quantity),
        price: convertToBRL(parseFloat(price)),
        date: new Date(date),
        fees: fees ? convertToBRL(parseFloat(fees)) : 0,
        notes: notes || undefined,
        skipBalanceCheck: type === "buy" ? skipBalanceCheck : undefined,
      });
    }

    setType("buy");
    setQuantity("");
    setPrice("");
    setTotalValue("");
    setDate(formatDateForInput(new Date()));
    setFees("");
    setNotes("");
    setSellMode("quantity");
    setSellTargetValue("");
    setSkipBalanceCheck(false);
    onClose();
  };

  const total = isFixed
    ? (parseFloat(totalValue) || 0) + (parseFloat(fees) || 0)
    : (parseFloat(quantity) || 0) * (parseFloat(price) || 0) + (parseFloat(fees) || 0);

  const quantityNum = parseFloat(quantity) || 0;
  const totalValueNum = parseFloat(totalValue) || 0;

  const exceedsQuantity = !isFixed && type === "sell" && !!investment && quantityNum > investment.quantity;
  const exceedsValue = isFixed && type === "sell" && !!investment && totalValueNum > investment.currentValue;
  const exceedsSellTargetValue = !isFixed && type === "sell" && sellMode === "value" && !!investment && sellTargetNum > investment.currentValue;
  const hasExcessError = exceedsQuantity || exceedsValue || exceedsSellTargetValue;

  if (!isOpen || !investment) return null;

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
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">
              {t("newOperationTitle")}
            </h2>
            <p className="text-[var(--text-dimmed)] text-sm">
              {investment.ticker || investment.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label={t("closeModal")}
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Type Selector */}
          <OperationTypeSelector
            type={type}
            onTypeChange={setType}
            isFixed={isFixed}
          />

          {/* Balance Display */}
          {type === "buy" && (
            <OperationBalanceDisplay
              balance={availableBalance}
              isLoading={isLoadingBalance}
            />
          )}

          {/* Variable Income Fields (Buy/Sell) */}
          {!isFixed && (
            <>
              {/* Price Field */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  {t("unitPrice")}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                    {currencySymbol}
                  </span>
                  <CurrencyInput
                    value={price}
                    onChange={setPrice}
                    placeholder="0,00"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    required
                  />
                </div>
                {type === "sell" && investment.currentPrice > 0 && (
                  <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                    {t("lastPrice", { price: formatCurrency(investment.currentPrice) })}
                  </p>
                )}
              </div>

              {/* Sell Mode Selector */}
              {type === "sell" && (
                <OperationSellMode
                  sellMode={sellMode}
                  onSellModeChange={setSellMode}
                  sellTargetValue={sellTargetValue}
                  onSellTargetValueChange={setSellTargetValue}
                  price={price}
                  currentValue={investment.currentValue}
                  calculatedQuantity={calculatedQuantity}
                  calculatedValue={calculatedValue}
                  exceedsSellTargetValue={exceedsSellTargetValue}
                />
              )}

              {}
              {(type === "buy" || sellMode === "quantity") && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">
                      {t("quantity")}
                    </label>
                    {type === "sell" && investment.quantity > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuantity(investment.quantity.toString())}
                        className="text-xs font-semibold text-primary-color hover:opacity-80 bg-primary-soft hover:bg-primary-medium px-2 py-1 rounded-md transition-all"
                      >
                        {t("max")}
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.000001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    required
                  />
                  {type === "sell" && investment.quantity > 0 && (
                    <p className={`mt-1 text-xs ${exceedsQuantity ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}`}>
                      {exceedsQuantity
                        ? t("quantityExceeds", { available: investment.quantity.toLocaleString("pt-BR") })
                        : t("availableShares", { available: investment.quantity.toLocaleString("pt-BR") })
                      }
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {}
          {isFixed && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  {type === "buy" ? t("depositValue") : t("withdrawValue")}
                </label>
                {type === "sell" && investment.currentValue > 0 && (
                  <button
                    type="button"
                    onClick={() => setTotalValue(investment.currentValue.toString())}
                    className="text-xs font-semibold text-primary-color hover:opacity-80 bg-primary-soft hover:bg-primary-medium px-2 py-1 rounded-md transition-all"
                  >
                    {t("max")}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                  {currencySymbol}
                </span>
                <CurrencyInput
                  value={totalValue}
                  onChange={setTotalValue}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                  required
                />
              </div>
              {type === "sell" && investment.currentValue > 0 && (
                <p className={`mt-1 text-xs ${exceedsValue ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}`}>
                  {exceedsValue
                    ? t("valueExceedsBalance", { balance: formatCurrency(investment.currentValue) })
                    : t("currentBalance", { balance: formatCurrency(investment.currentValue) })
                  }
                </p>
              )}
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {t("operationDate")}
            </label>
            {(() => {

              const lastOpDate = investment.operations && investment.operations.length > 0
                ? [...investment.operations].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  )[0].date
                : null;

              const minDateStr = lastOpDate ? parseDateFromDB(lastOpDate) : undefined;
              const minDateDisplay = lastOpDate ? formatDateFromDB(lastOpDate) : null;

              return (
                <>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={minDateStr}
                    max={formatDateForInput(new Date())}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    required
                  />
                  {minDateDisplay && (
                    <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                      {t("minDate", { date: minDateDisplay })}
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          {}
          {!isFixed && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                {t("feesOptional")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                  {currencySymbol}
                </span>
                <CurrencyInput
                  value={fees}
                  onChange={setFees}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
            </div>
          )}

          {/* Form Actions (total, warnings, notes, buttons) */}
          <OperationFormActions
            type={type}
            isFixed={isFixed}
            isSubmitting={isSubmitting}
            total={total}
            availableBalance={availableBalance}
            skipBalanceCheck={skipBalanceCheck}
            onSkipBalanceCheckChange={setSkipBalanceCheck}
            notes={notes}
            onNotesChange={setNotes}
            onClose={onClose}
            hasExcessError={hasExcessError}
            totalValue={totalValue}
            quantity={quantity}
            price={price}
            sellMode={sellMode}
            sellTargetValue={sellTargetValue}
            calculatedQuantity={calculatedQuantity}
          />
        </form>
      </div>
    </div>
  );
}