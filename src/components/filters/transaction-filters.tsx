"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useTransactionStore } from "@/store/transaction-store";
import { useCategoryStore } from "@/store/category-store";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { TransactionType } from "@/types";

interface TransactionFiltersProps {
  className?: string;
}

export function TransactionFilters({ className }: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const { filters, setFilters, clearFilters, hasActiveFilters } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: localSearch });
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, setFilters]);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleTypeChange = useCallback((type: TransactionType | "all") => {
    setFilters({ type });
  }, [setFilters]);

  const handleCategoryToggle = useCallback((categoryName: string) => {
    const currentCategories = filters.categories;
    const newCategories = currentCategories.includes(categoryName)
      ? currentCategories.filter((c) => c !== categoryName)
      : [...currentCategories, categoryName];
    setFilters({ categories: newCategories });
  }, [filters.categories, setFilters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setLocalSearch("");
  }, [clearFilters]);

  const activeFiltersCount = [
    filters.search !== "",
    filters.startDate !== null,
    filters.endDate !== null,
    filters.categories.length > 0,
    filters.type !== "all",
    filters.minValue !== null,
    filters.maxValue !== null,
  ].filter(Boolean).length;

  const uniqueCategories = [...new Set(categories.map((c) => c.name))];

  return (
    <div className={className}>
      {}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar transações..."
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-dimmed)]" />
            </button>
          )}
        </div>

        {}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
            isExpanded || hasActiveFilters()
              ? "bg-primary-soft text-primary-color border border-[var(--color-primary)]/30"
              : "bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-color-strong)] hover:bg-[var(--bg-hover-strong)]"
          }`}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {}
      {isExpanded && (
        <div className="mt-4 p-4 bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl space-y-4 animate-slideUp">
          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Tipo
            </label>
            <div className="flex gap-2">
              {[
                { value: "all" as const, label: "Todos" },
                { value: "income" as const, label: "Receitas" },
                { value: "expense" as const, label: "Despesas" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleTypeChange(value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    filters.type === value
                      ? value === "income"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : value === "expense"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-primary-soft text-primary-color border border-[var(--color-primary)]/30"
                      : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent hover:bg-[var(--bg-hover-strong)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Data inicial
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => setFilters({ startDate: e.target.value || null })}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-xl py-2.5 px-3 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Data final
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => setFilters({ endDate: e.target.value || null })}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-xl py-2.5 px-3 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
              />
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Valor mínimo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] text-sm">
                  R$
                </span>
                <CurrencyInput
                  value={filters.minValue?.toString() || ""}
                  onChange={(value) => setFilters({ minValue: value ? parseFloat(value) : null })}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-xl py-2.5 pl-10 pr-3 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Valor máximo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] text-sm">
                  R$
                </span>
                <CurrencyInput
                  value={filters.maxValue?.toString() || ""}
                  onChange={(value) => setFilters({ maxValue: value ? parseFloat(value) : null })}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-xl py-2.5 pl-10 pr-3 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {}
          {uniqueCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Categorias
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueCategories.map((categoryName) => (
                  <button
                    key={categoryName}
                    onClick={() => handleCategoryToggle(categoryName)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.categories.includes(categoryName)
                        ? "bg-primary-soft text-primary-color border border-[var(--color-primary)]/30"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent hover:bg-[var(--bg-hover-strong)]"
                    }`}
                  >
                    {categoryName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {}
          {hasActiveFilters() && (
            <div className="pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
