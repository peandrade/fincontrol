"use client";

import { INVESTMENT_TYPES, getInvestmentTypeLabel, getInvestmentTypeIcon } from "@/lib/constants";
import type { InvestmentType } from "@/types";

interface InvestmentTypeSelectorProps {
  onSelectType: (type: InvestmentType) => void;
  onCancel: () => void;
}

export function InvestmentTypeSelector({
  onSelectType,
  onCancel,
}: InvestmentTypeSelectorProps) {
  return (
    <div className="p-4 sm:p-6">
      <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-3 sm:mb-4">
        Selecione o tipo de investimento:
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {INVESTMENT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onSelectType(t)}
            className="p-2.5 sm:p-4 rounded-xl text-center transition-all bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] active:bg-[var(--bg-hover-strong)] hover:text-[var(--text-primary)] border border-transparent hover:border-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] group"
          >
            <span className="text-xl sm:text-2xl block mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
              {getInvestmentTypeIcon(t)}
            </span>
            <span className="text-[10px] sm:text-xs font-medium">{getInvestmentTypeLabel(t)}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end mt-4 sm:mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 px-5 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] active:bg-[var(--bg-hover-strong)] transition-all"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
