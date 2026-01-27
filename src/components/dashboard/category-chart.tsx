"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "@/contexts";
import type { CategoryData } from "@/types";

interface CategoryChartProps {
  data: CategoryData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { theme } = useTheme();

  const pieChartData = useMemo(
    () => data.map((item) => ({ name: item.name, value: item.value })),
    [data]
  );

  const totalExpenses = useMemo(
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
      className="backdrop-blur rounded-2xl p-6 transition-colors duration-300 h-full"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Analytics</h3>
      <p className="text-sm mb-4" style={{ color: "var(--text-dimmed)" }}>Despesas por categoria</p>

      <div className="h-48 flex items-center justify-center">
        {pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
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
          <p style={{ color: "var(--text-dimmed)" }}>Nenhuma despesa registrada</p>
        )}
      </div>

      {}
      <div className="space-y-2 mt-4 max-h-32 overflow-y-auto">
        {data.slice(0, 5).map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span style={{ color: "var(--text-muted)" }}>{item.name}</span>
            </div>
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
              {totalExpenses > 0
                ? ((item.value / totalExpenses) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}