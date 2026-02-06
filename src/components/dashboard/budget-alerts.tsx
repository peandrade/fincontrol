"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, XCircle, RefreshCw, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { usePreferences } from "@/contexts";
import { getCategoryColor } from "@/lib/constants";
import Link from "next/link";

interface BudgetAlert {
  id: string;
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  remaining: number;
  alertLevel: "warning" | "danger" | "exceeded";
  message: string;
}

interface BudgetAlertsData {
  alerts: BudgetAlert[];
  summary: {
    totalAlerts: number;
    warningCount: number;
    dangerCount: number;
    exceededCount: number;
  };
}

const alertStyles = {
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: AlertTriangle,
    progressBg: "bg-amber-500",
  },
  danger: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    icon: AlertCircle,
    progressBg: "bg-orange-500",
  },
  exceeded: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: XCircle,
    progressBg: "bg-red-500",
  },
};

export function BudgetAlerts() {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState<BudgetAlertsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { privacy, notifications } = usePreferences();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/budget-alerts");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!notifications.budgetAlerts || !data || data.alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${data.summary.exceededCount > 0 ? "bg-red-500/10" : data.summary.dangerCount > 0 ? "bg-orange-500/10" : "bg-amber-500/10"}`}>
              <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${data.summary.exceededCount > 0 ? "text-red-400" : data.summary.dangerCount > 0 ? "text-orange-400" : "text-amber-400"}`} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Alertas de Orçamento
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-dimmed)]">
                {data.summary.totalAlerts} categoria{data.summary.totalAlerts !== 1 ? "s" : ""} precisando de atenção
              </p>
            </div>
          </div>
          <Link
            href="/?tab=budgets"
            className="flex items-center gap-1 text-xs sm:text-sm text-primary-color hover:opacity-80 transition-colors"
          >
            <span className="hidden sm:inline">Ver todos</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2 mt-3">
          {data.summary.exceededCount > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
              {data.summary.exceededCount} excedido{data.summary.exceededCount !== 1 ? "s" : ""}
            </span>
          )}
          {data.summary.dangerCount > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
              {data.summary.dangerCount} crítico{data.summary.dangerCount !== 1 ? "s" : ""}
            </span>
          )}
          {data.summary.warningCount > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {data.summary.warningCount} alerta{data.summary.warningCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto">
        {data.alerts.map((alert) => {
          const style = alertStyles[alert.alertLevel];
          const Icon = style.icon;
          const categoryColor = getCategoryColor(alert.category);

          return (
            <div
              key={alert.id}
              className={`${style.bg} border ${style.border} rounded-lg sm:rounded-xl p-3 sm:p-4`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm font-medium shrink-0"
                    style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                  >
                    {alert.category.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {alert.category}
                    </p>
                    <p className={`text-[10px] sm:text-xs ${style.text}`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${style.text} shrink-0`} />
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="h-1.5 sm:h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${style.progressBg} transition-all duration-300`}
                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Values */}
              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-[var(--text-muted)]">
                  {privacy.hideValues ? "•••••" : formatCurrency(alert.spent)} / {privacy.hideValues ? "•••••" : formatCurrency(alert.limit)}
                </span>
                <span className={`font-medium ${style.text}`}>
                  {alert.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
