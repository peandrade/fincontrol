"use client";

import { useState, useEffect, useId } from "react";
import { X, TrendingUp, Target, History } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { getInvestmentTypeLabel, getInvestmentTypeIcon } from "@/lib/constants";
import { isVariableIncome, isFixedIncome } from "@/types";
import { TransactionHistoryModal } from "./transaction-history-modal";
import {
  InvestmentInfoDisplay,
  YieldSimulationCard,
  FixedIncomeFields,
  GoalProgressCard,
  InvestmentPreviewCard,
  type YieldDetails,
} from "./edit-investment";
import type { Investment, UpdateInvestmentInput, IndexerType } from "@/types";

interface EditInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onSave: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  isSubmitting: boolean;
}

interface FormState {
  currentPrice: string;
  currentValue: string;
  totalInvested: string;
  goalValue: string;
  notes: string;
  interestRate: string;
  indexer: IndexerType;
  maturityDate: string;
  noMaturity: boolean;
}

function EditInvestmentForm({
  investment,
  onClose,
  onSave,
  isSubmitting,
}: {
  investment: Investment;
  onClose: () => void;
  onSave: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const titleId = useId();
  const [form, setForm] = useState<FormState>({
    currentPrice: investment.currentPrice?.toString() || "",
    currentValue: investment.currentValue?.toString() || "",
    totalInvested: investment.totalInvested?.toString() || "",
    goalValue: investment.goalValue?.toString() || "",
    notes: investment.notes || "",
    interestRate: investment.interestRate?.toString() || "",
    indexer: (investment.indexer as IndexerType) || "CDI",
    maturityDate: investment.maturityDate
      ? new Date(investment.maturityDate).toISOString().split("T")[0]
      : "",
    noMaturity: !investment.maturityDate,
  });

  const [yieldDetails, setYieldDetails] = useState<YieldDetails | null>(null);
  const [isLoadingYield, setIsLoadingYield] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const isFixed = isFixedIncome(investment.type);
  const isVariable = isVariableIncome(investment.type);

  useEffect(() => {
    if (isFixed && investment.indexer && investment.indexer !== "NA") {
      setIsLoadingYield(true);
      fetch(`/api/investments/${investment.id}/yield`)
        .then(res => res.json())
        .then(data => {
          if (data.calculation) {
            setYieldDetails(data.calculation);
          }
        })
        .catch(err => console.error("Erro ao buscar rendimento:", err))
        .finally(() => setIsLoadingYield(false));
    }
  }, [isFixed, investment.id, investment.indexer]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: UpdateInvestmentInput = {
      notes: form.notes || undefined,
      goalValue: form.goalValue ? parseFloat(form.goalValue) : null,
    };

    if (isVariable) {
      if (form.currentPrice) {
        data.currentPrice = parseFloat(form.currentPrice);
      }
    } else {
      if (form.currentValue) {
        data.currentValue = parseFloat(form.currentValue);
      }
      if (form.totalInvested) {
        data.totalInvested = parseFloat(form.totalInvested);
      }
    }

    if (isFixed) {
      data.interestRate = form.interestRate ? parseFloat(form.interestRate) : null;
      data.indexer = form.indexer;
      data.noMaturity = form.noMaturity;
      data.maturityDate = form.noMaturity ? null : (form.maturityDate ? new Date(form.maturityDate) : null);
    }

    await onSave(investment.id, data);
    onClose();
  };

  // Calculate preview values
  const previewValue = isVariable && form.currentPrice
    ? investment.quantity * parseFloat(form.currentPrice)
    : parseFloat(form.currentValue) || investment.currentValue;

  const previewTotalInvested = isFixed && form.totalInvested
    ? parseFloat(form.totalInvested)
    : investment.totalInvested;

  const showPreview = form.currentPrice || form.currentValue || (isFixed && form.totalInvested);
  const goalValue = form.goalValue ? parseFloat(form.goalValue) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <style>{`
        .indexer-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: none;
        }
        .indexer-select::-ms-expand {
          display: none;
        }
        .indexer-select option {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{getInvestmentTypeIcon(investment.type)}</span>
            <div>
              <h2 id={titleId} className="text-xl font-semibold text-[var(--text-primary)]">
                {investment.ticker || investment.name}
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm">
                {getInvestmentTypeLabel(investment.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Histórico de transações"
              aria-label="Ver histórico de transações"
            >
              <History className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Transaction History Modal */}
        <TransactionHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          investment={investment}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Investment Info */}
          <InvestmentInfoDisplay investment={investment} noMaturity={form.noMaturity} />

          {/* Yield Simulation (Fixed Income Only) */}
          {isFixed && investment.indexer && investment.indexer !== "NA" && (
            <YieldSimulationCard yieldDetails={yieldDetails} isLoading={isLoadingYield} />
          )}

          {/* Fixed Income Fields */}
          {isFixed && (
            <FixedIncomeFields
              totalInvested={form.totalInvested}
              indexer={form.indexer}
              interestRate={form.interestRate}
              maturityDate={form.maturityDate}
              noMaturity={form.noMaturity}
              onTotalInvestedChange={(v) => handleChange("totalInvested", v)}
              onIndexerChange={(v) => handleChange("indexer", v)}
              onInterestRateChange={(v) => handleChange("interestRate", v)}
              onMaturityDateChange={(v) => handleChange("maturityDate", v)}
              onNoMaturityChange={(v) => handleChange("noMaturity", v)}
            />
          )}

          {/* Variable Income: Current Price */}
          {isVariable ? (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Preço Atual por Cota
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
                <CurrencyInput
                  value={form.currentPrice}
                  onChange={(value) => handleChange("currentPrice", value)}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                Atualize com a cotação atual do ativo
              </p>
            </div>
          ) : !isFixed && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Saldo Atual
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
                <CurrencyInput
                  value={form.currentValue}
                  onChange={(value) => handleChange("currentValue", value)}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                Atualize com o saldo atual incluindo rendimentos
              </p>
            </div>
          )}

          {/* Preview Card */}
          {showPreview && (
            <InvestmentPreviewCard
              currentValue={previewValue}
              totalInvested={previewTotalInvested}
              showTotalInvested={isFixed && !!form.totalInvested}
            />
          )}

          {/* Goal Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              Meta (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
              <CurrencyInput
                value={form.goalValue}
                onChange={(value) => handleChange("goalValue", value)}
                placeholder="10.000,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {/* Goal Progress */}
          {goalValue > 0 && (
            <GoalProgressCard currentValue={previewValue} goalValue={goalValue} />
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Anotações..."
              rows={2}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white hover:opacity-90 transition-all shadow-lg shadow-primary disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditInvestmentModal({
  isOpen,
  onClose,
  investment,
  onSave,
  isSubmitting,
}: EditInvestmentModalProps) {
  if (!isOpen || !investment) return null;

  return (
    <EditInvestmentForm
      key={investment.id}
      investment={investment}
      onClose={onClose}
      onSave={onSave}
      isSubmitting={isSubmitting}
    />
  );
}
