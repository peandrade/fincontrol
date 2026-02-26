"use client";

import { useState, useEffect, useRef } from "react";
import { FileBarChart, Calendar, Download, Filter, RefreshCw, Lightbulb, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransactionStore } from "@/store/transaction-store";
import { useCategoryStore } from "@/store/category-store";
import { useAnalytics } from "@/hooks";
import { CategoryReport, MonthlyComparison, AdvancedAnalytics, InsightsContent, SpendingVelocityContent } from "@/components/reports";
import { CashFlowForecastChart } from "@/components/dashboard";
import { generateReportPDF } from "@/lib/pdf-generator";
import { SkeletonReportsPage } from "@/components/ui/skeleton";

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
] as const;

export default function RelatoriosPage() {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const tm = useTranslations("months");
  const tt = useTranslations("transactions");

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [filterType, setFilterType] = useState<"expense" | "income" | "all">("expense");
  const [isExporting, setIsExporting] = useState(false);

  // Popup states
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isVelocityOpen, setIsVelocityOpen] = useState(false);
  const insightsRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef<HTMLDivElement>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  const { transactions, isLoading: isLoadingTransactions, fetchTransactions } = useTransactionStore();
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategoryStore();
  const { data: analyticsData } = useAnalytics();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  // Close popups on click outside
  useEffect(() => {
    if (!isInsightsOpen && !isVelocityOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (isInsightsOpen && insightsRef.current && !insightsRef.current.contains(e.target as Node)) {
        setIsInsightsOpen(false);
      }
      if (isVelocityOpen && velocityRef.current && !velocityRef.current.contains(e.target as Node)) {
        setIsVelocityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isInsightsOpen, isVelocityOpen]);

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
        className="min-h-screen"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <SkeletonReportsPage />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
              <FileBarChart className="w-8 h-8 text-primary-color" />
              {t("title")}
            </h1>
            <p className="mt-1" style={{ color: "var(--text-dimmed)" }}>
              {t("subtitle")}
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
                {t("exporting")}
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {t("exportPDF")}
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
                {MONTH_KEYS.map((monthKey, index) => (
                  <option key={index} value={index + 1} className="bg-[var(--bg-secondary)]">
                    {tm(monthKey)}
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
                  {tt("expenses")}
                </button>
                <button
                  onClick={() => setFilterType("income")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === "income"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                  }`}
                >
                  {tt("incomes")}
                </button>
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === "all"
                      ? "bg-primary-soft text-primary-color border border-[var(--color-primary)]/30"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                  }`}
                >
                  {tt("both")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {}
        <div ref={reportRef} className="space-y-6">
          {}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("categoryReport")} - {tm(MONTH_KEYS[selectedMonth - 1])} {selectedYear}
              </h2>
              {analyticsData && analyticsData.insights.length > 0 && (
                <div className="relative" ref={insightsRef}>
                  <button
                    onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                      isInsightsOpen
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                    }`}
                    title={t("smartInsights")}
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  </button>
                  {isInsightsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[380px] sm:w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] z-50 p-4 animate-[slideUp_0.3s_ease-out]">
                      <style>{`
                        @keyframes slideUp {
                          from { opacity: 0; transform: translateY(20px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <Lightbulb className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                          {t("smartInsights")}
                        </h3>
                      </div>
                      <InsightsContent insights={analyticsData.insights} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <CategoryReport
              transactions={filteredTransactions}
              categories={categories}
              type={filterType}
            />
          </div>

          {}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("monthlyComparison")}
              </h2>
              {analyticsData && (
                <div className="relative" ref={velocityRef}>
                  <button
                    onClick={() => setIsVelocityOpen(!isVelocityOpen)}
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                      isVelocityOpen
                        ? "border-primary-color/50 bg-primary-soft"
                        : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                    }`}
                    title={t("spendingVelocity")}
                  >
                    <TrendingUp className="w-4 h-4 text-primary-color" />
                  </button>
                  {isVelocityOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[240px] rounded-xl shadow-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] z-50 p-3 animate-[slideUp_0.3s_ease-out]">
                      <style>{`
                        @keyframes slideUp {
                          from { opacity: 0; transform: translateY(20px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-primary-soft rounded-lg">
                          <TrendingUp className="w-4 h-4 text-primary-color" />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {t("spendingVelocity")}
                        </h3>
                      </div>
                      <SpendingVelocityContent velocity={analyticsData.spendingVelocity} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <MonthlyComparison
              transactions={transactions}
              currentMonth={selectedMonth}
              currentYear={selectedYear}
            />
          </div>

          {/* Advanced Analytics */}
          <div className="mt-6">
            <AdvancedAnalytics />
          </div>

          {/* Cash Flow Forecast */}
          <div className="mt-6">
            <CashFlowForecastChart />
          </div>
        </div>
      </div>
    </div>
  );
}
