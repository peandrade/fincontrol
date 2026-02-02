"use client";

import { formatCurrency } from "@/lib/utils";

interface GoalProgressCardProps {
  currentValue: number;
  goalValue: number;
}

export function GoalProgressCard({ currentValue, goalValue }: GoalProgressCardProps) {
  const progress = goalValue > 0 ? (currentValue / goalValue) * 100 : 0;

  return (
    <div className="bg-[var(--bg-hover)] rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[var(--text-muted)] text-sm">Progresso da meta</span>
        <span className="text-[var(--text-primary)] font-semibold">
          {Math.min(progress, 100).toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-[var(--bg-hover-strong)] rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress >= 100
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-primary-gradient"
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-2 text-xs">
        <span className="text-[var(--text-dimmed)]">{formatCurrency(currentValue)}</span>
        <span className="text-[var(--text-dimmed)]">{formatCurrency(goalValue)}</span>
      </div>
      {progress >= 100 && (
        <p className="text-emerald-400 text-sm mt-2 text-center">🎉 Meta alcançada!</p>
      )}
    </div>
  );
}
