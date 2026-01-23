"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  PiggyBank,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardSummary {
  balance: {
    current: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyBalance: number;
  };
  investments: {
    totalInvested: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    count: number;
  };
  cards: {
    totalLimit: number;
    usedLimit: number;
    availableLimit: number;
    usagePercent: number;
    count: number;
    nextInvoice: {
      cardId: string;
      cardName: string;
      total: number;
      dueDate: string;
    } | null;
  };
  goals: {
    total: number;
    completed: number;
    targetValue: number;
    currentValue: number;
    progress: number;
  };
  wealth: {
    total: number;
    breakdown: {
      balance: number;
      investments: number;
      goals: number;
      debts: number;
    };
  };
}

export function QuickStats() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/dashboard/summary");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erro ao buscar resumo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 animate-pulse"
          >
            <div className="h-4 bg-[var(--bg-hover)] rounded w-1/2 mb-3" />
            <div className="h-8 bg-[var(--bg-hover)] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[var(--bg-hover)] rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: "Saldo em Conta",
      value: data.balance.current,
      subValue: data.balance.monthlyBalance,
      subLabel: "este mês",
      icon: Wallet,
      color: "violet",
      gradient: "from-violet-600 to-indigo-600",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      isPositive: data.balance.monthlyBalance >= 0,
      href: "/",
    },
    {
      title: "Investimentos",
      value: data.investments.currentValue,
      subValue: data.investments.profitLossPercent,
      subLabel: "rendimento",
      icon: TrendingUp,
      color: "emerald",
      gradient: "from-emerald-600 to-teal-600",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      isPositive: data.investments.profitLoss >= 0,
      isPercent: true,
      href: "/investimentos",
    },
    {
      title: "Cartões",
      value: data.cards.availableLimit,
      subValue: data.cards.usagePercent,
      subLabel: "do limite usado",
      icon: CreditCard,
      color: "blue",
      gradient: "from-blue-600 to-cyan-600",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      isPositive: data.cards.usagePercent < 50,
      isPercent: true,
      invertPercent: true,
      href: "/cartoes",
    },
    {
      title: "Metas",
      value: data.goals.currentValue,
      subValue: data.goals.progress,
      subLabel: "do objetivo",
      icon: Target,
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      isPositive: true,
      isPercent: true,
      href: "/investimentos",
    },
  ];

  return (
    <div className="mb-8">
      {/* Patrimônio Total */}
      <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 backdrop-blur rounded-2xl border border-violet-500/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Patrimônio Total
              </span>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(data.wealth.total)}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="text-center px-4">
              <p className="text-xs text-[var(--text-dimmed)] mb-1">Saldo</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {formatCurrency(data.wealth.breakdown.balance)}
              </p>
            </div>
            <div className="text-center px-4 border-l border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-dimmed)] mb-1">Investimentos</p>
              <p className="text-sm font-semibold text-emerald-400">
                {formatCurrency(data.wealth.breakdown.investments)}
              </p>
            </div>
            <div className="text-center px-4 border-l border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-dimmed)] mb-1">Metas</p>
              <p className="text-sm font-semibold text-amber-400">
                {formatCurrency(data.wealth.breakdown.goals)}
              </p>
            </div>
            {data.wealth.breakdown.debts < 0 && (
              <div className="text-center px-4 border-l border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-dimmed)] mb-1">Dívidas</p>
                <p className="text-sm font-semibold text-red-400">
                  {formatCurrency(data.wealth.breakdown.debts)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="group bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 transition-all hover:border-[var(--border-color-strong)] hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-dimmed)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <p className="text-sm text-[var(--text-muted)] mb-1">{stat.title}</p>

              <p className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {formatCurrency(stat.value)}
              </p>

              <div className="flex items-center gap-1 text-xs">
                {stat.isPercent ? (
                  <>
                    <span
                      className={
                        stat.invertPercent
                          ? stat.subValue > 80
                            ? "text-red-400"
                            : stat.subValue > 50
                            ? "text-amber-400"
                            : "text-emerald-400"
                          : stat.isPositive
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {stat.subValue.toFixed(1)}%
                    </span>
                    <span className="text-[var(--text-dimmed)]">{stat.subLabel}</span>
                  </>
                ) : (
                  <>
                    {stat.isPositive ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={stat.isPositive ? "text-emerald-400" : "text-red-400"}
                    >
                      {formatCurrency(Math.abs(stat.subValue))}
                    </span>
                    <span className="text-[var(--text-dimmed)]">{stat.subLabel}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Próxima Fatura */}
      {data.cards.nextInvoice && (
        <Link
          href={`/cartoes?card=${data.cards.nextInvoice.cardId}`}
          className="mt-4 block bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 transition-all hover:border-[var(--border-color-strong)] hover:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <CreditCard className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Próxima Fatura</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {data.cards.nextInvoice.cardName}
                </p>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {formatCurrency(data.cards.nextInvoice.total)}
                </p>
                <p className="text-xs text-[var(--text-dimmed)]">
                  Vence em{" "}
                  {new Date(data.cards.nextInvoice.dueDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-dimmed)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
