"use client";

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
import { useDashboardSummary } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";

// Local interface for the component's expected data shape
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
  const { data: hookData, isLoading } = useDashboardSummary();
  const { privacy } = usePreferences();

  // Cast to local interface (API returns compatible structure)
  const data = hookData as unknown as DashboardSummary | null;

  if (isLoading) {
    return (
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`${i === 1 ? "col-span-2 lg:col-span-1" : ""} bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-3 sm:p-5`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
              </div>
              <Skeleton className="h-3 sm:h-4 w-20 mb-1 sm:mb-2" />
              <Skeleton className="h-5 sm:h-6 w-24 mb-2" />
              <Skeleton className="h-2 sm:h-3 w-16" />
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
    <div className="mb-6 sm:mb-8 overflow-hidden w-full">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
        {/* Patrimônio Total - Card compacto */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] to-[color-mix(in_srgb,var(--color-secondary)_20%,transparent)] backdrop-blur rounded-xl sm:rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-2 rounded-lg bg-primary-medium flex-shrink-0">
              <PiggyBank className="w-5 h-5 sm:w-5 sm:h-5 text-primary-color" />
            </div>
            {privacy.hideValues && (
              <div
                className="p-1.5 rounded-lg flex-shrink-0"
                title="Modo discreto ativo"
              >
                <EyeOff className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-1 truncate">Patrimônio Total</p>
          <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">
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
              className="group bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-5 transition-all hover:border-[var(--border-color-strong)] hover:shadow-lg min-w-0 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`p-2 sm:p-2 rounded-lg ${stat.iconBg} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-dimmed)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-1 truncate">{stat.title}</p>

              <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1.5 sm:mb-2 truncate">
                {privacy.hideValues ? "•••••" : formatCurrency(stat.value)}
              </p>

              <div className="flex items-center gap-1 text-xs sm:text-xs">
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
                    <span className="text-[var(--text-dimmed)] hidden sm:inline truncate">{stat.subLabel}</span>
                  </>
                ) : (
                  <>
                    {stat.isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`truncate ${stat.isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {privacy.hideValues ? "•••••" : formatCurrency(Math.abs(stat.subValue))}
                    </span>
                    <span className="text-[var(--text-dimmed)] hidden sm:inline truncate">{stat.subLabel}</span>
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
