"use client";

import { useState, useEffect, useRef } from "react";
import { FileBarChart, Calendar, Download, Filter, RefreshCw } from "lucide-react";
import { useTransactionStore } from "@/store/transaction-store";
import { useCategoryStore } from "@/store/category-store";
import { CategoryReport, MonthlyComparison, AdvancedAnalytics } from "@/components/reports";
import { generateReportPDF } from "@/lib/pdf-generator";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function RelatoriosPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [filterType, setFilterType] = useState<"expense" | "income" | "all">("expense");
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const { transactions, isLoading: isLoadingTransactions, fetchTransactions } = useTransactionStore();
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
  });

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateReportPDF({
        transactions: filteredTransactions,
        categories,
        month: selectedMonth,
        year: selectedYear,
        filterType,
        reportRef,
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = isLoadingTransactions || isLoadingCategories;

  if (isLoading && transactions.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-color animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {}
      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
              <FileBarChart className="w-8 h-8 text-primary-color" />
              Relatórios
            </h1>
            <p className="mt-1" style={{ color: "var(--text-dimmed)" }}>
              Análise detalhada das suas finanças
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || filteredTransactions.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-gradient rounded-xl font-medium transition-all shadow-lg shadow-primary text-white disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Exportar PDF
              </>
            )}
          </button>
        </header>

        {}
        <div className="mb-8 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex flex-wrap items-center gap-4">
            {}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--text-dimmed)]" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:border-primary-color appearance-none cursor-pointer"
              >
                {MONTHS.map((month, index) => (
                  <option key={index} value={index + 1} className="bg-[var(--bg-secondary)]">
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:border-primary-color appearance-none cursor-pointer"
            >
              {years.map((year) => (
                <option key={year} value={year} className="bg-[var(--bg-secondary)]">
                  {year}
                </option>
              ))}
            </select>

            {}
            <div className="hidden sm:block w-px h-8 bg-[var(--border-color)]" />

            {}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[var(--text-dimmed)]" />
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterType("expense")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === "expense"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                  }`}
                >
                  Despesas
                </button>
                <button
                  onClick={() => setFilterType("income")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === "income"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                  }`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === "all"
                      ? "bg-primary-soft text-primary-color border border-[var(--color-primary)]/30"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                  }`}
                >
                  Ambos
                </button>
              </div>
            </div>
          </div>
        </div>

        {}
        <div ref={reportRef} className="space-y-6">
          {}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              Relatório por Categoria - {MONTHS[selectedMonth - 1]} {selectedYear}
            </h2>
            <CategoryReport
              transactions={filteredTransactions}
              categories={categories}
              type={filterType}
            />
          </div>

          {}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              Comparativo Mensal
            </h2>
            <MonthlyComparison
              transactions={transactions}
              currentMonth={selectedMonth}
              currentYear={selectedYear}
            />
          </div>

          {}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              Analytics Avançados
            </h2>
            <AdvancedAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
}
