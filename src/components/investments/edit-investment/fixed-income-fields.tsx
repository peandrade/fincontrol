"use client";

import { Percent, Calendar, ChevronDown } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useCurrency } from "@/contexts/currency-context";
import { INDEXER_TYPES } from "@/types";
import { formatRateDescription } from "@/lib/rates-service";
import { useTranslations } from "next-intl";
import type { IndexerType } from "@/types";

interface FixedIncomeFieldsProps {
  totalInvested: string;
  indexer: IndexerType;
  interestRate: string;
  maturityDate: string;
  noMaturity: boolean;
  onTotalInvestedChange: (value: string) => void;
  onIndexerChange: (value: string) => void;
  onInterestRateChange: (value: string) => void;
  onMaturityDateChange: (value: string) => void;
  onNoMaturityChange: (checked: boolean) => void;
}

export function FixedIncomeFields({
  totalInvested,
  indexer,
  interestRate,
  maturityDate,
  noMaturity,
  onTotalInvestedChange,
  onIndexerChange,
  onInterestRateChange,
  onMaturityDateChange,
  onNoMaturityChange,
}: FixedIncomeFieldsProps) {
  const { currencySymbol } = useCurrency();
  const t = useTranslations("investments");
  return (
    <>
      {/* Total Invested */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {t("totalInvestedLabel")}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">{currencySymbol}</span>
          <CurrencyInput
            value={totalInvested}
            onChange={onTotalInvestedChange}
            placeholder="0,00"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
        <p className="mt-1 text-xs text-[var(--text-dimmed)]">
          {t("sumAllDeposits")}
        </p>
      </div>

      {/* Indexer and Rate */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            <Percent className="w-4 h-4 inline mr-1" />
            {t("indexer")}
          </label>
          <div className="relative">
            <select
              value={indexer}
              onChange={(e) => {
                const newIndexer = e.target.value;
                onIndexerChange(newIndexer);
                if (newIndexer === "NA") onInterestRateChange("");
              }}
              className="indexer-select w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 pr-10 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all appearance-none cursor-pointer"
            >
              {INDEXER_TYPES.map((idx) => (
                <option key={idx.value} value={idx.value}>
                  {idx.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            {t("rate")}
          </label>
          <input
            type="number"
            step="0.01"
            value={indexer === "NA" ? "" : interestRate}
            onChange={(e) => onInterestRateChange(e.target.value)}
            placeholder={indexer === "CDI" ? "Ex: 100" : indexer === "NA" ? "-" : "Ex: 5.5"}
            disabled={indexer === "NA"}
            className={`w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all ${indexer === "NA" ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
      </div>

      {/* Rate Description */}
      {interestRate && indexer !== "NA" && (
        <div className="bg-[var(--bg-hover)] rounded-xl p-3 -mt-2">
          <p className="text-sm text-[var(--text-primary)]">
            {t("currentRate")}: <span className="font-semibold">{formatRateDescription(parseFloat(interestRate), indexer)}</span>
          </p>
        </div>
      )}

      {/* Maturity Date */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">
            <Calendar className="w-4 h-4 inline mr-1" />
            {t("maturity")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noMaturity}
              onChange={(e) => onNoMaturityChange(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-[var(--text-muted)]">{t("noMaturity")}</span>
          </label>
        </div>
        {noMaturity && (
          <div className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-dimmed)]">
            {t("dailyLiquidity")}
          </div>
        )}
        {!noMaturity && (
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => onMaturityDateChange(e.target.value)}
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        )}
      </div>
    </>
  );
}
