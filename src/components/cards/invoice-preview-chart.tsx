"use client";

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

  // Cores baseadas no tema
  const axisTickColor = theme === "dark" ? "#9CA3AF" : "#4B5563";
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
    <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>Próximos 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span style={{ color: "var(--text-muted)" }}>Aberta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span style={{ color: "var(--text-muted)" }}>Paga</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span style={{ color: "var(--text-muted)" }}>Fechada</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 12 }}
              width={50}
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
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
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

      {/* Lista com valores */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {data.map((item) => (
            <div key={`${item.month}-${item.year}`} className="text-center">
              <p className="text-xs" style={{ color: "var(--text-dimmed)" }}>{item.label}</p>
              <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(item.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
