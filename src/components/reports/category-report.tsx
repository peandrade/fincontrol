"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import { DynamicIcon } from "@/components/categories/icon-picker";

const HIDDEN = "•••••";
import type { Transaction } from "@/types";
import type { Category } from "@/store/category-store";

interface CategoryReportProps {
  transactions: Transaction[];
  categories: Category[];
  type: "expense" | "income" | "all";
}

interface CategoryData {
  name: string;
  value: number;
  count: number;
  color: string;
  icon: string;
  percentage: number;
}

export function CategoryReport({ transactions, categories, type }: CategoryReportProps) {
  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));
  const categoryData = useMemo(() => {

    const filtered = transactions.filter((t) => {
      if (type === "all") return true;
      return t.type === type;
    });

    const grouped = filtered.reduce((acc, t) => {
      const key = t.category;
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 };
      }
      acc[key].total += t.value;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const total = Object.values(grouped).reduce((sum, { total }) => sum + total, 0);

    const data: CategoryData[] = Object.entries(grouped)
      .map(([name, { total: value, count }]) => {
        const category = categories.find((c) => c.name === name);
        return {
          name,
          value,
          count,
          color: category?.color || "#64748B",
          icon: category?.icon || "Tag",
          percentage: total > 0 ? (value / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value);

    return { data, total };
  }, [transactions, categories, type]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="rounded-lg p-3 shadow-xl"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium text-[var(--text-primary)]">{data.name}</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {fmt(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-xs text-[var(--text-dimmed)]">
            {data.count} {data.count === 1 ? "transação" : "transações"}
          </p>
        </div>
      );
    }
    return null;
  };

  if (categoryData.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-dimmed)]">Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {}
      <div className="flex flex-col items-center">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData.data as unknown as Array<Record<string, unknown>>}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-[var(--text-dimmed)]">Total</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {fmt(categoryData.total)}
          </p>
        </div>
      </div>

      {}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {categoryData.data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-hover)]"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-dimmed)] w-6">{index + 1}.</span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <DynamicIcon name={item.icon} className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                <p className="text-xs text-[var(--text-dimmed)]">
                  {item.count} {item.count === 1 ? "transação" : "transações"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[var(--text-primary)]">
                {fmt(item.value)}
              </p>
              <p className="text-xs text-[var(--text-dimmed)]">
                {item.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
