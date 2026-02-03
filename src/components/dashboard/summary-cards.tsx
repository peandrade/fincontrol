"use client";

import { TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import type { MonthlySummary } from "@/types";

interface SummaryCardsProps {
  summary: MonthlySummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { privacy } = usePreferences();
  const { income, expense, balance, incomeChange, expenseChange } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
      {/* Receitas */}
      <div className="card-hover bg-gradient-to-br from-emerald-500/90 to-teal-600/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl shadow-emerald-500/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-emerald-100 text-xs sm:text-sm font-medium mb-1">
              Receitas
            </p>
            <p className="text-xl sm:text-3xl font-bold text-white">
              {privacy.hideValues ? "•••••" : formatCurrency(income)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-center gap-1 text-emerald-100 text-xs sm:text-sm">
          {incomeChange !== undefined && incomeChange >= 0 ? (
            <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          )}
          <span>
            {incomeChange !== undefined
              ? `${incomeChange >= 0 ? "+" : ""}${incomeChange.toFixed(1)}%`
              : "+0.0%"}
            {" "}vs mês anterior
          </span>
        </div>
      </div>

      {/* Despesas */}
      <div className="card-hover bg-gradient-to-br from-orange-500/90 to-red-500/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl shadow-orange-500/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">
              Despesas
            </p>
            <p className="text-xl sm:text-3xl font-bold text-white">
              {privacy.hideValues ? "•••••" : formatCurrency(expense)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl flex-shrink-0">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-center gap-1 text-orange-100 text-xs sm:text-sm">
          {expenseChange !== undefined && expenseChange <= 0 ? (
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          )}
          <span>
            {expenseChange !== undefined
              ? `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}%`
              : "+0.0%"}
            {" "}vs mês anterior
          </span>
        </div>
      </div>

      {/* Saldo */}
      <div
        className={`card-hover bg-gradient-to-br ${
          balance >= 0
            ? "from-cyan-500/90 to-blue-600/90 shadow-cyan-500/10"
            : "from-red-600/90 to-rose-700/90 shadow-red-500/10"
        } rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs sm:text-sm font-medium mb-1 ${
                balance >= 0 ? "text-cyan-100" : "text-red-100"
              }`}
            >
              Saldo do Mês
            </p>
            <p className="text-xl sm:text-3xl font-bold text-white">
              {privacy.hideValues ? "•••••" : formatCurrency(balance)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl flex-shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div
          className={`mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm ${
            balance >= 0 ? "text-cyan-100" : "text-red-100"
          }`}
        >
          <span>
            {balance >= 0 ? "✨ Saldo positivo este mês!" : "⚠️ Atenção: saldo negativo"}
          </span>
        </div>
      </div>
    </div>
  );
}