"use client";

import { Hash, DollarSign } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";

type SellMode = "quantity" | "value";

interface OperationSellModeProps {
  sellMode: SellMode;
  onSellModeChange: (mode: SellMode) => void;
  sellTargetValue: string;
  onSellTargetValueChange: (value: string) => void;
  price: string;
  currentValue: number;
  calculatedQuantity: number;
  calculatedValue: number;
  exceedsSellTargetValue: boolean;
}

export function OperationSellMode({
  sellMode,
  onSellModeChange,
  sellTargetValue,
  onSellTargetValueChange,
  price,
  currentValue,
  calculatedQuantity,
  calculatedValue,
  exceedsSellTargetValue,
}: OperationSellModeProps) {
  const priceNum = parseFloat(price) || 0;
  const sellTargetNum = parseFloat(sellTargetValue) || 0;

  return (
    <>
      {/* Sell Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          Vender por
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onSellModeChange("quantity");
              onSellTargetValueChange("");
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              sellMode === "quantity"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
            }`}
          >
            <Hash className="w-4 h-4" />
            Quantidade
          </button>
          <button
            type="button"
            onClick={() => onSellModeChange("value")}
            className={`flex-1 py-2.5 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              sellMode === "value"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Valor
          </button>
        </div>
      </div>

      {/* Sell by Value Fields */}
      {sellMode === "value" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--text-muted)]">
              Valor Desejado
            </label>
            {currentValue > 0 && (
              <button
                type="button"
                onClick={() => onSellTargetValueChange(currentValue.toString())}
                className="text-xs font-semibold text-primary-color hover:opacity-80 bg-primary-soft hover:bg-primary-medium px-2 py-1 rounded-md transition-all"
              >
                MAX
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
              R$
            </span>
            <CurrencyInput
              value={sellTargetValue}
              onChange={onSellTargetValueChange}
              placeholder="0,00"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>
          {currentValue > 0 && (
            <p className={`mt-1 text-xs ${exceedsSellTargetValue ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}`}>
              {exceedsSellTargetValue
                ? `Valor excede o disponível (R$ ${currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                : `Valor total disponível: R$ ${currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            </p>
          )}

          {/* Calculation Display */}
          {calculatedQuantity > 0 && priceNum > 0 && (
            <div className="mt-3 p-3 bg-primary-soft border border-[var(--color-primary)]/20 rounded-xl">
              <p className="text-sm text-primary-color font-medium mb-1">Cálculo automático:</p>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Cotas a vender:</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {calculatedQuantity.toLocaleString("pt-BR", { maximumFractionDigits: 6 })}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[var(--text-muted)]">Valor real:</span>
                <span className="text-[var(--text-primary)] font-medium">
                  R$ {calculatedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {calculatedValue !== sellTargetNum && (
                <p className="text-xs text-[var(--text-dimmed)] mt-2">
                  * Valor arredondado para baixo (cotas inteiras ou fração disponível)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
