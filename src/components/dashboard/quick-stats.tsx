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
  EyeOff,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";

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
  };
}

export function QuickStats() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { privacy } = usePreferences();

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
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-3 sm:p-5 animate-pulse"
            >
              <div className="h-3 sm:h-4 bg-[var(--bg-hover)] rounded w-1/2 mb-2 sm:mb-3" />
              <div className="h-6 sm:h-8 bg-[var(--bg-hover)] rounded w-3/4 mb-1 sm:mb-2" />
              <div className="h-2 sm:h-3 bg-[var(--bg-hover)] rounded w-1/3" />
            </div>
          ))}
        </div>
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
      iconBg: "bg-primary-soft",
      iconColor: "text-primary-color",
      isPositive: data.balance.monthlyBalance >= 0,
      href: "/",
    },
    {
      title: "Investimentos",
      value: data.investments.currentValue,
      subValue: data.investments.profitLossPercent,
      subLabel: "rendimento",
      icon: TrendingUp,
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
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      isPositive: true,
      isPercent: true,
      href: "/investimentos",
    },
  ];

  return (
    <div className="mb-6 sm:mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        {/* Patrimônio Total - Card compacto */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] to-[color-mix(in_srgb,var(--color-secondary)_20%,transparent)] backdrop-blur rounded-xl sm:rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary-medium">
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-primary-color" />
            </div>
            {privacy.hideValues && (
              <div
                className="p-1.5 rounded-lg"
                title="Modo discreto ativo"
              >
                <EyeOff className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-0.5 sm:mb-1">Patrimônio Total</p>
          <p className="text-base sm:text-xl font-bold text-[var(--text-primary)]">
            {privacy.hideValues ? "•••••" : formatCurrency(data.wealth.total)}
          </p>
        </div>

        {/* Stats Cards */}
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="group bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-3 sm:p-5 transition-all hover:border-[var(--border-color-strong)] hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                </div>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--text-dimmed)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-0.5 sm:mb-1">{stat.title}</p>

              <p className="text-base sm:text-xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2">
                {privacy.hideValues ? "•••••" : formatCurrency(stat.value)}
              </p>

              <div className="flex items-center gap-1 text-[10px] sm:text-xs flex-wrap">
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
                    <span className="text-[var(--text-dimmed)] hidden sm:inline">{stat.subLabel}</span>
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
                      {privacy.hideValues ? "•••••" : formatCurrency(Math.abs(stat.subValue))}
                    </span>
                    <span className="text-[var(--text-dimmed)] hidden sm:inline">{stat.subLabel}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
