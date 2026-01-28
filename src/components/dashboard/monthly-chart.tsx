"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTheme, usePreferences } from "@/contexts";

const HIDDEN = "•••••";
import type { MonthlyEvolution, EvolutionPeriod } from "@/types";

interface MonthlyChartProps {
  data: MonthlyEvolution[];
  period: EvolutionPeriod;
  onPeriodChange: (period: EvolutionPeriod) => void;
}

const PERIOD_OPTIONS: { value: EvolutionPeriod; label: string }[] = [
  { value: "1w", label: "1 Semana" },
  { value: "1m", label: "30 Dias" },
  { value: "3m", label: "3 Meses" },
  { value: "6m", label: "6 Meses" },
  { value: "1y", label: "1 Ano" },
];

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  hideValues,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  hideValues?: boolean;
}) {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg p-3 shadow-xl"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)"
        }}
      >
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{ color: entry.color }}
            className="text-sm font-medium"
          >
            {entry.name === "income" ? "Receitas" : "Despesas"}:{" "}
            {hideValues ? HIDDEN : formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function MonthlyChart({ data, period, onPeriodChange }: MonthlyChartProps) {
  const { theme } = useTheme();
  const { privacy } = usePreferences();
  const currentPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || "6 Meses";

  const axisTickColor = theme === "dark" ? "#9CA3AF" : "#4B5563";

  return (
    <div
      className="backdrop-blur rounded-2xl p-6 transition-colors duration-300 h-full"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <style>{`
        .period-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: none;
        }
        .period-select::-ms-expand {
          display: none;
        }
        .period-select option {
          background-color: ${theme === "dark" ? "#1f2937" : "#ffffff"};
          color: ${theme === "dark" ? "#f3f4f6" : "#1f2937"};
        }
      `}</style>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Evolução Financeira
        </h3>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as EvolutionPeriod)}
            className="period-select appearance-none cursor-pointer px-3 py-1.5 pr-8 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-primary)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border-color)"
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--text-dimmed)" }}>
        Receitas vs Despesas ({currentPeriodLabel.toLowerCase()})
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 12 }}
              tickFormatter={(value) =>
                privacy.hideValues ? "•••" : `${(value / 1000).toFixed(0)}k`
              }
            />
            <Tooltip content={<ChartTooltip hideValues={privacy.hideValues} />} />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorReceitas)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="expense"
              stroke="#6366F1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDespesas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Despesas</span>
        </div>
      </div>
    </div>
  );
}