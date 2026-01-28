"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronDown, TrendingUp, TrendingDown, Wallet, RefreshCw, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTheme, usePreferences } from "@/contexts";

const HIDDEN = "•••••";

type WealthPeriod = "1w" | "1m" | "3m" | "6m" | "1y";

// Helper function to map defaultPeriod to WealthPeriod
function mapDefaultPeriodToWealth(defaultPeriod: string): WealthPeriod {
  const periodMap: Record<string, WealthPeriod> = {
    week: "1w",
    month: "1m",
    quarter: "3m",
    year: "1y",
  };
  return periodMap[defaultPeriod] || "1y";
}

interface WealthDataPoint {
  month: string;
  label: string;
  transactionBalance: number;
  investmentValue: number;
  cardDebt: number;
  totalWealth: number;
  goalsSaved: number;
}

interface WealthSummary {
  currentWealth: number;
  transactionBalance: number;
  investmentValue: number;
  goalsSaved: number;
  cardDebt: number;
  wealthChange: number;
  wealthChangePercent: number;
}

interface WealthData {
  evolution: WealthDataPoint[];
  summary: WealthSummary;
  period: string;
}

const PERIOD_OPTIONS: { value: WealthPeriod; label: string }[] = [
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
  dataKey: string;
  payload: WealthDataPoint;
}

function ChartTooltip({
  active,
  payload,
  hideValues,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  hideValues?: boolean;
}) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as WealthDataPoint;
    if (!data) return null;
    const fmt = (v: number) => (hideValues ? HIDDEN : formatCurrency(v));

    return (
      <div
        className="rounded-lg p-3 shadow-xl"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)",
        }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          {data.label}
        </p>
        <div className="space-y-1 text-xs">
          <p style={{ color: "#8B5CF6" }}>
            Patrimônio: <span className="font-medium">{fmt(data.totalWealth)}</span>
          </p>
          <p style={{ color: "#10B981" }}>
            Saldo: <span className="font-medium">{fmt(data.transactionBalance)}</span>
          </p>
          <p style={{ color: "#3B82F6" }}>
            Investido: <span className="font-medium">{fmt(data.investmentValue)}</span>
          </p>
          {data.goalsSaved > 0 && (
            <p style={{ color: "#F59E0B" }}>
              Metas: <span className="font-medium">{fmt(data.goalsSaved)}</span>
            </p>
          )}
          {data.cardDebt > 0 && (
            <p style={{ color: "#EF4444" }}>
              Dívida: <span className="font-medium">-{fmt(data.cardDebt)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function WealthEvolutionChart() {
  const { theme } = useTheme();
  const { general, privacy } = usePreferences();
  const [period, setPeriod] = useState<WealthPeriod>(() =>
    mapDefaultPeriodToWealth(general.defaultPeriod)
  );
  const [data, setData] = useState<WealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/wealth-evolution?period=${period}`);
      if (response.ok) {
        const wealthData = await response.json();
        setData(wealthData);
      }
    } catch (error) {
      console.error("Erro ao buscar evolução patrimonial:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update period when defaultPeriod preference changes
  useEffect(() => {
    setPeriod(mapDefaultPeriodToWealth(general.defaultPeriod));
  }, [general.defaultPeriod]);

  const axisTickColor = theme === "dark" ? "#9CA3AF" : "#4B5563";

  const summary = data?.summary || {
    currentWealth: 0,
    transactionBalance: 0,
    investmentValue: 0,
    goalsSaved: 0,
    cardDebt: 0,
    wealthChange: 0,
    wealthChangePercent: 0,
  };

  const isPositiveChange = summary.wealthChange >= 0;

  return (
    <div
      className="backdrop-blur rounded-2xl p-4 sm:p-6 transition-colors duration-300 h-full"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)",
      }}
    >
      <style>{`
        .wealth-period-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: none;
        }
        .wealth-period-select::-ms-expand {
          display: none;
        }
        .wealth-period-select option {
          background-color: ${theme === "dark" ? "#1f2937" : "#ffffff"};
          color: ${theme === "dark" ? "#f3f4f6" : "#1f2937"};
        }
      `}</style>

      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-soft rounded-lg">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-color" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Evolução Patrimonial
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <div className="relative flex-1 sm:flex-none">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as WealthPeriod)}
              className="wealth-period-select w-full sm:w-auto appearance-none cursor-pointer px-3 py-1.5 pr-8 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-color)",
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
      </div>

      {}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.currentWealth)}
          </p>
          {privacy.hideValues ? (
            <div className="flex items-center gap-1 mt-1">
              <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--text-dimmed)]" />
              <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-dimmed)" }}>
                Modo discreto ativo
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              {isPositiveChange ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
              )}
              <span
                className={`text-xs sm:text-sm font-medium ${
                  isPositiveChange ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPositiveChange ? "+" : ""}
                {formatCurrency(summary.wealthChange)} ({summary.wealthChangePercent.toFixed(1)}%)
              </span>
              <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-dimmed)" }}>
                vs mês anterior
              </span>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="h-72">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
          </div>
        ) : data && data.evolution.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.evolution}>
              <defs>
                <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11 }}
                tickFormatter={(value) =>
                  privacy.hideValues
                    ? "•••"
                    : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                }
                width={50}
              />
              <Tooltip content={<ChartTooltip hideValues={privacy.hideValues} />} />
              <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="transactionBalance"
                name="Saldo"
                stroke="#10B981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
              <Area
                type="monotone"
                dataKey="investmentValue"
                name="Investido"
                stroke="#3B82F6"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorInvestment)"
              />
              <Area
                type="monotone"
                dataKey="goalsSaved"
                name="Metas"
                stroke="#F59E0B"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorGoals)"
              />
              <Area
                type="monotone"
                dataKey="cardDebt"
                name="Dívida"
                stroke="#EF4444"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorDebt)"
              />
              <Area
                type="monotone"
                dataKey="totalWealth"
                name="Patrimônio"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorWealth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>
              Sem dados para exibir
            </p>
          </div>
        )}
      </div>

      {}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs" style={{ color: "var(--text-dimmed)" }}>
              Saldo
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.transactionBalance)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs" style={{ color: "var(--text-dimmed)" }}>
              Investido
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.investmentValue)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs" style={{ color: "var(--text-dimmed)" }}>
              Metas
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.goalsSaved)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs" style={{ color: "var(--text-dimmed)" }}>
              Dívida
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-red-400">
            {privacy.hideValues ? HIDDEN : `-${formatCurrency(summary.cardDebt)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
