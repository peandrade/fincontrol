"use client";

import { Target, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import type { AllocationTarget, InvestmentAnalyticsData } from "./analytics-types";
import { typeColors } from "./analytics-types";

const HIDDEN = "•••••";

interface AllocationTargetsProps {
  data: AllocationTarget[];
  summary: InvestmentAnalyticsData["summary"];
}

export function AllocationTargets({ data, summary }: AllocationTargetsProps) {
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  const filtered = data.filter((a) => a.currentPercent > 0 || a.targetPercent > 0);

  if (filtered.length === 0) return null;

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-soft rounded-lg">
          <Target className="w-5 h-5 text-primary-color" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            Alocação vs Meta
          </h3>
          <p className="text-xs text-[var(--text-dimmed)]">
            Diversificação: {summary.diversificationScore.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Allocation Bars */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <AllocationBar key={item.type} item={item} />
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
        <div className="text-center">
          <p className="text-xs text-[var(--text-dimmed)]">Investido</p>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {fmt(summary.totalInvested)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-dimmed)]">Valor Atual</p>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {fmt(summary.currentValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-dimmed)]">Retorno</p>
          <p
            className={`text-sm font-bold ${
              summary.totalProfitLossPercent >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {summary.totalProfitLossPercent >= 0 ? "+" : ""}
            {summary.totalProfitLossPercent.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

function AllocationBar({ item }: { item: AllocationTarget }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: typeColors[item.type] || "#6B7280" }}
          />
          <span className="text-sm text-[var(--text-primary)]">{item.typeName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-dimmed)]">
            {item.currentPercent.toFixed(0)}% / {item.targetPercent.toFixed(0)}%
          </span>
          <ActionBadge action={item.suggestedAction} />
        </div>
      </div>
      <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden relative">
        {/* Target marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/50 z-10"
          style={{ left: `${item.targetPercent}%` }}
        />
        {/* Current value bar */}
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(item.currentPercent, 100)}%`,
            backgroundColor: typeColors[item.type] || "#6B7280",
          }}
        />
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: "buy" | "sell" | "hold" }) {
  if (action === "buy") {
    return (
      <span className="flex items-center gap-0.5 text-xs text-emerald-400">
        <ArrowUp className="w-3 h-3" />
        Comprar
      </span>
    );
  }

  if (action === "sell") {
    return (
      <span className="flex items-center gap-0.5 text-xs text-red-400">
        <ArrowDown className="w-3 h-3" />
        Vender
      </span>
    );
  }

  return (
    <span className="flex items-center gap-0.5 text-xs text-[var(--text-dimmed)]">
      <Minus className="w-3 h-3" />
      OK
    </span>
  );
}
