"use client";

import { useMemo, useId } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { useTheme, usePreferences } from "@/contexts";

const HIDDEN = "•••••";
import type { CategoryData } from "@/types";

interface CategoryChartProps {
  data: CategoryData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const t = useTranslations("dashboard");
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  const { privacy } = usePreferences();
  const descriptionId = useId();

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
      className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300 h-full overflow-hidden"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{t("analytics")}</h3>
      <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: "var(--text-dimmed)" }}>{t("expensesByCategory")}</p>
      <p id={descriptionId} className="sr-only">
        {t("categoryChartDesc")}
        {privacy.hideValues
          ? " Valores ocultos."
          : ` Total: ${formatCurrency(totalExpenses)}. ${data.slice(0, 3).map(d => `${d.name}: ${((d.value / totalExpenses) * 100).toFixed(0)}%`).join(", ")}.`
        }
      </p>

      <div className="h-40 sm:h-48 flex items-center justify-center" role="img" aria-describedby={descriptionId}>
        {pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [privacy.hideValues ? HIDDEN : formatCurrency(Number(value)), "Valor"]}
                contentStyle={tooltipStyle}
                labelStyle={{ color: theme === "dark" ? "#9CA3AF" : "#6B7280" }}
                itemStyle={{ color: theme === "dark" ? "#f3f4f6" : "#1f2937" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "var(--text-dimmed)" }}>{t("noExpensesRecorded")}</p>
        )}
      </div>

      {}
      <div className="space-y-1.5 sm:space-y-2 mt-3 sm:mt-4 max-h-28 sm:max-h-32 overflow-y-auto">
        {data.slice(0, 5).map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-xs sm:text-sm gap-2"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate" style={{ color: "var(--text-muted)" }}>{item.name}</span>
            </div>
            {/* Mobile: mostra valor / Desktop: mostra porcentagem */}
            <span className="font-medium flex-shrink-0 sm:hidden" style={{ color: "var(--text-secondary)" }}>
              {privacy.hideValues ? HIDDEN : formatCurrency(item.value)}
            </span>
            <span className="font-medium flex-shrink-0 hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
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