"use client";

import { TrendingUp, TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OperationType } from "@/types";

interface OperationTypeSelectorProps {
  type: OperationType;
  onTypeChange: (type: OperationType) => void;
  isFixed: boolean;
}

export function OperationTypeSelector({
  type,
  onTypeChange,
  isFixed,
}: OperationTypeSelectorProps) {
  const t = useTranslations("investments");

  return (
    <div className="flex gap-2" role="group" aria-label={t("operationType")}>
      <button
        type="button"
        onClick={() => onTypeChange("buy")}
        aria-pressed={type === "buy"}
        className={`flex-1 py-3 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          type === "buy"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
            : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
        }`}
      >
        {isFixed ? (
          <PiggyBank className="w-4 h-4" aria-hidden="true" />
        ) : (
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{isFixed ? t("depositLabel") : t("purchaseLabel")}</span>
        <span className="sm:hidden">{isFixed ? t("depositShort") : t("purchaseLabel")}</span>
      </button>

      <button
        type="button"
        onClick={() => onTypeChange("sell")}
        aria-pressed={type === "sell"}
        className={`flex-1 py-3 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          type === "sell"
            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
            : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
        }`}
      >
        {isFixed ? (
          <Wallet className="w-4 h-4" aria-hidden="true" />
        ) : (
          <TrendingDown className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{isFixed ? t("withdrawLabel") : t("saleLabel")}</span>
        <span className="sm:hidden">{isFixed ? t("withdrawShort") : t("saleLabel")}</span>
      </button>

    </div>
  );
}
