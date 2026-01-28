"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import type { Transaction } from "@/types";

const HIDDEN = "•••••";

interface MonthlyComparisonProps {
  transactions: Transaction[];
  currentMonth: number;
  currentYear: number;
}

interface MonthData {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export function MonthlyComparison({ transactions, currentMonth, currentYear }: MonthlyComparisonProps) {
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));
  const { chartData, comparison } = useMemo(() => {

    const months: { month: number; year: number; label: string }[] = [];
    for (let i = 2; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      months.push({
        month: m,
        year: y,
        label: `${MONTH_NAMES[m - 1]}/${y.toString().slice(-2)}`,
      });
    }

    const data: MonthData[] = months.map(({ month, year, label }) => {
      const monthTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() + 1 === month && date.getFullYear() === year;
      });

      const receitas = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.value, 0);

      const despesas = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.value, 0);

      return {
        month: label,
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });

    const current = data[2];
    const previous = data[1];

    const receitasChange = previous.receitas > 0
      ? ((current.receitas - previous.receitas) / previous.receitas) * 100
      : current.receitas > 0 ? 100 : 0;

    const despesasChange = previous.despesas > 0
      ? ((current.despesas - previous.despesas) / previous.despesas) * 100
      : current.despesas > 0 ? 100 : 0;

    const saldoChange = previous.saldo !== 0
      ? ((current.saldo - previous.saldo) / Math.abs(previous.saldo)) * 100
      : current.saldo !== 0 ? 100 : 0;

    return {
      chartData: data,
      comparison: {
        receitas: {
          current: current.receitas,
          previous: previous.receitas,
          change: receitasChange,
        },
        despesas: {
          current: current.despesas,
          previous: previous.despesas,
          change: despesasChange,
        },
        saldo: {
          current: current.saldo,
          previous: previous.saldo,
          change: saldoChange,
        },
      },
    };
  }, [transactions, currentMonth, currentYear]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg p-3 shadow-xl"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--border-color)",
          }}
        >
          <p className="font-medium text-[var(--text-primary)] mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === "receitas" ? "Receitas" : "Despesas"}: {fmt(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChangeIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    const isNeutral = value === 0;

    if (isNeutral) {
      return (
        <div className="flex items-center gap-1 text-[var(--text-dimmed)]">
          <Minus className="w-4 h-4" />
          <span className="text-sm">0%</span>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-1 ${
          isPositive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span className="text-sm">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-emerald-400">Receitas</span>
            <ChangeIndicator value={comparison.receitas.change} />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {fmt(comparison.receitas.current)}
          </p>
          <p className="text-xs text-[var(--text-dimmed)] mt-1">
            Mês anterior: {fmt(comparison.receitas.previous)}
          </p>
        </div>

        {}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-400">Despesas</span>
            <ChangeIndicator value={comparison.despesas.change} inverted />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {fmt(comparison.despesas.current)}
          </p>
          <p className="text-xs text-[var(--text-dimmed)] mt-1">
            Mês anterior: {fmt(comparison.despesas.previous)}
          </p>
        </div>

        {}
        <div
          className={`p-4 rounded-xl border ${
            comparison.saldo.current >= 0
              ? "bg-blue-500/10 border-blue-500/20"
              : "bg-orange-500/10 border-orange-500/20"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-sm ${
                comparison.saldo.current >= 0 ? "text-blue-400" : "text-orange-400"
              }`}
            >
              Saldo
            </span>
            <ChangeIndicator value={comparison.saldo.change} />
          </div>
          <p
            className={`text-2xl font-bold ${
              comparison.saldo.current >= 0 ? "text-blue-400" : "text-orange-400"
            }`}
          >
            {fmt(comparison.saldo.current)}
          </p>
          <p className="text-xs text-[var(--text-dimmed)] mt-1">
            Mês anterior: {fmt(comparison.saldo.previous)}
          </p>
        </div>
      </div>

      {}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={8}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-dimmed)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-dimmed)", fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span style={{ color: "var(--text-muted)" }}>
                  {value === "receitas" ? "Receitas" : "Despesas"}
                </span>
              )}
            />
            <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
