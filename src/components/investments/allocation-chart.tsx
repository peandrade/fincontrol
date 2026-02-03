"use client";

import { useMemo, useId } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "@/contexts";
import type { AllocationData } from "@/types";

interface AllocationChartProps {
  data: AllocationData[];
}

export function AllocationChart({ data }: AllocationChartProps) {
  const { theme } = useTheme();
  const descriptionId = useId();

  const chartData = useMemo(
    () => data.map((item) => ({ name: item.label, value: item.value })),
    [data]
  );

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const tooltipStyle = {
    backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    borderRadius: "8px",
    color: theme === "dark" ? "#f3f4f6" : "#1f2937",
  };

  return (
    <div
      className="backdrop-blur rounded-2xl p-6 transition-colors duration-300"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Alocação</h3>
      <p className="text-sm mb-4" style={{ color: "var(--text-dimmed)" }}>Distribuição por tipo de ativo</p>
      <p id={descriptionId} className="sr-only">
        Gráfico de pizza mostrando alocação de investimentos por tipo de ativo.
        Total: {formatCurrency(total)}.
        {data.slice(0, 3).map(d => `${d.label}: ${d.percentage.toFixed(0)}%`).join(", ")}.
      </p>

      <div className="h-48 flex items-center justify-center" role="img" aria-describedby={descriptionId}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Valor"]}
                contentStyle={tooltipStyle}
                labelStyle={{ color: theme === "dark" ? "#9CA3AF" : "#6B7280" }}
                itemStyle={{ color: theme === "dark" ? "#f3f4f6" : "#1f2937" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "var(--text-dimmed)" }}>Nenhum investimento registrado</p>
        )}
      </div>

      {}
      <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ color: "var(--text-dimmed)" }}>
                {formatCurrency(item.value)}
              </span>
              <span className="font-medium w-12 text-right" style={{ color: "var(--text-secondary)" }}>
                {total > 0 ? item.percentage.toFixed(1) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}