"use client";

import { useState, useEffect, useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronDown, TrendingUp, TrendingDown, Wallet, RefreshCw, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTheme, usePreferences } from "@/contexts";
import { useWealthEvolution } from "@/hooks";
import { SetupPinModal, VerifyPinModal } from "@/components/privacy";
import type { WealthDataPoint } from "@/hooks";
import type { EvolutionPeriod } from "@/types";
import { Skeleton, SkeletonChart } from "@/components/ui/skeleton";

const HIDDEN = "•••••";

// Helper function to map defaultPeriod to EvolutionPeriod
function mapDefaultPeriodToWealth(defaultPeriod: string): EvolutionPeriod {
  const periodMap: Record<string, EvolutionPeriod> = {
    week: "1w",
    month: "1m",
    quarter: "3m",
    year: "1y",
  };
  return periodMap[defaultPeriod] || "1y";
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

interface WealthEvolutionChartProps {
  refreshTrigger?: number;
}

export function WealthEvolutionChart({ refreshTrigger = 0 }: WealthEvolutionChartProps) {
  const { theme } = useTheme();
  const { general, privacy, toggleHideValues, setSessionUnlocked, updatePrivacy, refreshPinStatus } = usePreferences();
  const descriptionId = useId();
  const [period, setPeriod] = useState<EvolutionPeriod>(() =>
    mapDefaultPeriodToWealth(general.defaultPeriod)
  );
  const [showSetupPinModal, setShowSetupPinModal] = useState(false);
  const [showVerifyPinModal, setShowVerifyPinModal] = useState(false);

  const { data, isLoading, refresh } = useWealthEvolution(period, [refreshTrigger]);

  const handleToggleVisibility = () => {
    const result = toggleHideValues();
    if (result.needsSetupPin) {
      setShowSetupPinModal(true);
    } else if (result.needsPin) {
      setShowVerifyPinModal(true);
    }
  };

  const handlePinSetupSuccess = async () => {
    await refreshPinStatus();
    updatePrivacy({ hideValues: true });
    setShowSetupPinModal(false);
  };

  const handlePinVerified = () => {
    setSessionUnlocked(true);
    updatePrivacy({ hideValues: false });
    setShowVerifyPinModal(false);
  };

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
      className="backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-colors duration-300 h-full overflow-hidden"
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
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 sm:p-2 bg-primary-soft rounded-lg flex-shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-color" />
          </div>
          <h3 className="text-sm sm:text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            Evolução Patrimonial
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleToggleVisibility}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={privacy.hideValues ? "Mostrar valores" : "Ocultar valores"}
            aria-label={privacy.hideValues ? "Mostrar valores" : "Ocultar valores"}
          >
            {privacy.hideValues ? (
              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Atualizar"
            aria-label="Atualizar gráfico"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as EvolutionPeriod)}
              className="wealth-period-select appearance-none cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 pr-6 sm:pr-8 rounded-lg text-xs sm:text-sm font-medium transition-colors"
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
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        </div>
      </div>

      {}
      <div className="mb-3 sm:mb-4">
        <p className="text-lg sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
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
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {isPositiveChange ? (
              <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
            )}
            <span
              className={`text-[10px] sm:text-sm font-medium ${
                isPositiveChange ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositiveChange ? "+" : ""}
              {formatCurrency(summary.wealthChange)}
            </span>
            <span className="text-[10px] sm:text-xs hidden sm:inline" style={{ color: "var(--text-dimmed)" }}>
              vs mês anterior
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <p id={descriptionId} className="sr-only">
        Gráfico de evolução patrimonial mostrando patrimônio total, saldo, investimentos, metas e dívidas.
        {privacy.hideValues
          ? " Valores ocultos."
          : ` Patrimônio atual: ${formatCurrency(summary.currentWealth)}. Variação: ${summary.wealthChangePercent.toFixed(1)}% vs mês anterior.`
        }
      </p>
      <div className="h-48 sm:h-72" role="img" aria-describedby={descriptionId}>
        {isLoading ? (
          <div className="h-full flex flex-col justify-end">
            <div className="flex items-end justify-between gap-2 h-56">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
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
                tick={{ fill: axisTickColor, fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 10 }}
                tickFormatter={(value) =>
                  privacy.hideValues
                    ? "•••"
                    : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                }
                width={35}
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
      <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border-color)]">
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              Saldo
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.transactionBalance)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              Invest.
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.investmentValue)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              Metas
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.goalsSaved)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              Dívida
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium text-red-400 truncate">
            {privacy.hideValues ? HIDDEN : `-${formatCurrency(summary.cardDebt)}`}
          </p>
        </div>
      </div>

      {/* Modal de configuração de PIN */}
      <SetupPinModal
        open={showSetupPinModal}
        onClose={() => setShowSetupPinModal(false)}
        onSuccess={handlePinSetupSuccess}
      />

      {/* Modal de verificação de PIN */}
      <VerifyPinModal
        open={showVerifyPinModal}
        onClose={() => setShowVerifyPinModal(false)}
        onVerified={handlePinVerified}
      />
    </div>
  );
}
