"use client";

import { useId } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { getInvoiceStatusColor } from "@/lib/card-constants";
import { useTheme } from "@/contexts";
import type { InvoicePreview } from "@/types/credit-card";

interface InvoicePreviewChartProps {
  data: InvoicePreview[];
  cardColor?: string;
  title?: string;
}

const cardStyle = {
  backgroundColor: "var(--card-bg)",
  borderWidth: "1px",
  borderStyle: "solid" as const,
  borderColor: "var(--border-color)"
};

export function InvoicePreviewChart({ data, title = "Previsão de Faturas" }: InvoicePreviewChartProps) {
  const { theme } = useTheme();
  const descriptionId = useId();

  const axisTickColor = theme === "dark" ? "#9CA3AF" : "#4B5563";
  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
  const tooltipStyle = {
    backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    borderRadius: "12px",
    padding: "12px",
  };

  if (data.length === 0) {
    return (
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <div className="text-center py-8">
          <p style={{ color: "var(--text-dimmed)" }}>Nenhum dado para exibir</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>Adicione um cartão e faça uma compra</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300" style={cardStyle}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-dimmed)" }}>Próximos 6 meses</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500" />
            <span style={{ color: "var(--text-muted)" }}>Aberta</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500" />
            <span style={{ color: "var(--text-muted)" }}>Paga</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-500" />
            <span style={{ color: "var(--text-muted)" }}>Fechada</span>
          </div>
        </div>
      </div>

      <p id={descriptionId} className="sr-only">
        Gráfico de barras mostrando previsão de faturas dos próximos 6 meses.
        Total previsto: {formatCurrency(totalAmount)}.
        {data.slice(0, 3).map(d => `${d.label}: ${formatCurrency(d.amount)}`).join(", ")}.
      </p>

      <div className="h-48 sm:h-64" role="img" aria-describedby={descriptionId}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 10 }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 10 }}
              width={40}
              tickFormatter={(value: number) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return String(Math.round(value));
              }}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: theme === "dark" ? "#9CA3AF" : "#6B7280", marginBottom: "4px" }}
              itemStyle={{ color: theme === "dark" ? "#f3f4f6" : "#1f2937" }}
              formatter={(value) => [formatCurrency(Number(value)), "Valor"]}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.amount > 0 ? getInvoiceStatusColor(entry.status) : "rgba(255,255,255,0.1)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {data.map((item) => (
            <div key={`${item.month}-${item.year}`} className="text-center">
              <p className="text-[10px] sm:text-xs" style={{ color: "var(--text-dimmed)" }}>{item.label}</p>
              <p className="font-medium text-[11px] sm:text-sm truncate" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(item.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
