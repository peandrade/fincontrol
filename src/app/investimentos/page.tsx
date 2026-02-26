"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Plus, RefreshCw, TrendingUp, Check, AlertCircle, Percent, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  InvestmentSummaryCards,
  AllocationChart,
  InvestmentList,
  InvestmentModal,
  OperationModal,
  EditInvestmentModal,
} from "@/components/investments";
import {
  PortfolioInsights,
  PerformanceCards,
} from "@/components/investments/investment-analytics";
import { TaxCalculatorCard } from "@/components/investments";
import type { InvestmentAnalyticsData } from "@/components/investments/investment-analytics";
import { GoalSection } from "@/components/goals";
import { GoalInsights } from "@/components/goals/goals-analytics";
import type { GoalsAnalyticsData } from "@/components/goals/goals-analytics";
import type { Investment, CreateInvestmentInput, CreateOperationInput, UpdateInvestmentInput } from "@/types";
import { useInvestmentStore } from "@/store/investments-store";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SkeletonInvestmentsPage } from "@/components/ui/skeleton";

export default function InvestmentsPage() {
  const t = useTranslations("investments");
  const tc = useTranslations("common");
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quotesMessage, setQuotesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [taxRefreshKey, setTaxRefreshKey] = useState(0);

  // Analytics data (fetched at page level)
  const [analyticsData, setAnalyticsData] = useState<InvestmentAnalyticsData | null>(null);
  const [goalAnalyticsData, setGoalAnalyticsData] = useState<GoalsAnalyticsData | null>(null);

  // Popup states
  const [isPortfolioInsightsOpen, setIsPortfolioInsightsOpen] = useState(false);
  const [isGoalInsightsOpen, setIsGoalInsightsOpen] = useState(false);
  const portfolioInsightsRef = useRef<HTMLDivElement>(null);
  const goalInsightsRef = useRef<HTMLDivElement>(null);

  const {
    investments,
    isLoading,
    isRefreshingQuotes,
    isRefreshingYields,
    lastQuotesUpdate,
    lastYieldsUpdate,
    fetchInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addOperation,
    refreshQuotes,
    refreshYields,
    getSummary,
    getAllocationByType,
  } = useInvestmentStore();

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  useEffect(() => {
    if (investments.length > 0 && !lastYieldsUpdate) {
      refreshYields();
    }
  }, [investments.length, lastYieldsUpdate, refreshYields]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const [investRes, goalRes] = await Promise.all([
        fetch("/api/investments/analytics"),
        fetch("/api/goals/analytics"),
      ]);
      if (investRes.ok) {
        const result = await investRes.json();
        setAnalyticsData(result);
      }
      if (goalRes.ok) {
        const result = await goalRes.json();
        setGoalAnalyticsData(result);
      }
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Close popups on click outside
  useEffect(() => {
    if (!isPortfolioInsightsOpen && !isGoalInsightsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        isPortfolioInsightsOpen &&
        portfolioInsightsRef.current &&
        !portfolioInsightsRef.current.contains(e.target as Node)
      ) {
        setIsPortfolioInsightsOpen(false);
      }
      if (
        isGoalInsightsOpen &&
        goalInsightsRef.current &&
        !goalInsightsRef.current.contains(e.target as Node)
      ) {
        setIsGoalInsightsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPortfolioInsightsOpen, isGoalInsightsOpen]);

  const handleRefreshQuotes = async () => {
    const result = await refreshQuotes();
    if (result.updated > 0) {
      setQuotesMessage({
        type: "success",
        text: t("quotesUpdated", { count: result.updated }),
      });
    } else if (result.errors.length > 0 && result.updated === 0) {
      setQuotesMessage({
        type: "error",
        text: t("noQuotesUpdated"),
      });
    } else {
      setQuotesMessage({
        type: "success",
        text: t("quotesUpToDate"),
      });
    }
    setTimeout(() => setQuotesMessage(null), 4000);
  };

  const handleRefreshYields = async () => {
    const result = await refreshYields();
    if (result.success && result.updated > 0) {
      setQuotesMessage({
        type: "success",
        text: t("yieldsCalculated", { count: result.updated }),
      });
    } else if (!result.success) {
      setQuotesMessage({
        type: "error",
        text: t("yieldsError"),
      });
    } else {
      setQuotesMessage({
        type: "success",
        text: t("yieldsUpdated"),
      });
    }
    setTimeout(() => setQuotesMessage(null), 4000);
  };

  const summary = getSummary();
  const allocation = getAllocationByType();

  const handleAddInvestment = async (data: CreateInvestmentInput) => {
    setIsSubmitting(true);
    try {
      await addInvestment(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInvestment = async (id: string, data: UpdateInvestmentInput) => {
    setIsSubmitting(true);
    try {
      await updateInvestment(id, data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOperation = async (data: CreateOperationInput) => {
    setIsSubmitting(true);
    try {
      await addOperation(data);
      setTaxRefreshKey((k) => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteInvestment(id);
    } finally {
      setDeletingId(null);
    }
  };

  const openOperationModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsOperationModalOpen(true);
  };

  const openEditModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsEditModalOpen(true);
  };

  if (isLoading && investments.length === 0) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <SkeletonInvestmentsPage />
        </div>
      </div>
    );
  }

  const hasAnalytics = analyticsData && analyticsData.summary.investmentCount > 0;
  const hasPortfolioInsights = hasAnalytics && analyticsData.insights.length > 0;
  const hasGoalInsights =
    goalAnalyticsData &&
    goalAnalyticsData.summary.totalGoals > 0 &&
    goalAnalyticsData.insights.length > 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              {t("title")}
            </h1>
            <p className="mt-1" style={{ color: "var(--text-dimmed)" }}>{t("trackPortfolio")}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {}
              {quotesMessage && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium animate-slideUp ${
                    quotesMessage.type === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {quotesMessage.type === "success" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {quotesMessage.text}
                </div>
              )}

              {}
              <button
                onClick={() => { fetchInvestments(); setTaxRefreshKey((k) => k + 1); }}
                className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                title={tc("refresh")}
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setIsInvestmentModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-gradient rounded-xl font-medium transition-all shadow-lg shadow-primary text-white"
              >
                <Plus className="w-5 h-5" />
                {t("newInvestment")}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {}
              <button
                onClick={handleRefreshYields}
                disabled={isRefreshingYields}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
                title={lastYieldsUpdate ? t("lastUpdate", { time: lastYieldsUpdate.toLocaleTimeString() }) : t("calculateYields")}
              >
                <Percent className={`w-4 h-4 ${isRefreshingYields ? "animate-pulse" : ""}`} />
                <span className="hidden sm:inline">
                  {isRefreshingYields ? tc("calculating") : t("fixedIncome")}
                </span>
              </button>

              {}
              <button
                onClick={handleRefreshQuotes}
                disabled={isRefreshingQuotes}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
                title={lastQuotesUpdate ? t("lastUpdate", { time: lastQuotesUpdate.toLocaleTimeString() }) : t("updateQuotes")}
              >
                <TrendingUp className={`w-4 h-4 ${isRefreshingQuotes ? "animate-pulse" : ""}`} />
                <span className="hidden sm:inline">
                  {isRefreshingQuotes ? tc("updating") : t("quotes")}
                </span>
              </button>
            </div>
          </div>
        </header>

        <ErrorBoundary>
          <InvestmentSummaryCards summary={summary} />
        </ErrorBoundary>

        {/* Row 1: Alocação + Investimentos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <ErrorBoundary>
              <AllocationChart data={allocation} />
            </ErrorBoundary>
          </div>
          <div className="lg:col-span-2 lg:relative">
            <div className="lg:absolute lg:inset-0">
              <InvestmentList
                investments={investments}
                onDelete={handleDeleteInvestment}
                onAddOperation={openOperationModal}
                onEdit={openEditModal}
                deletingId={deletingId}
                headerExtra={
                  hasPortfolioInsights ? (
                    <div className="relative" ref={portfolioInsightsRef}>
                      <button
                        onClick={() => {
                          setIsPortfolioInsightsOpen(!isPortfolioInsightsOpen);
                          setIsGoalInsightsOpen(false);
                        }}
                        className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                          isPortfolioInsightsOpen
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                        }`}
                        title={t("portfolioInsights")}
                      >
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                      </button>
                      {isPortfolioInsightsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-[380px] sm:w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] z-50 animate-slideUp p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Lightbulb className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">
                              {t("portfolioInsights")}
                            </h3>
                          </div>
                          <PortfolioInsights insights={analyticsData.insights} />
                        </div>
                      )}
                    </div>
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Row 2: Metas + Calculadora IR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ErrorBoundary>
            <GoalSection
              headerExtra={
                hasGoalInsights ? (
                  <div className="relative" ref={goalInsightsRef}>
                    <button
                      onClick={() => {
                        setIsGoalInsightsOpen(!isGoalInsightsOpen);
                        setIsPortfolioInsightsOpen(false);
                      }}
                      className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                        isGoalInsightsOpen
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                      }`}
                      title={t("goalInsights")}
                    >
                      <Lightbulb className="w-4 h-4 text-blue-400" />
                    </button>
                    {isGoalInsightsOpen && (
                      <div className="absolute right-0 top-full mt-2 w-[380px] sm:w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] z-50 animate-slideUp p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-blue-400" />
                          </div>
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            {t("goalInsights")}
                          </h3>
                        </div>
                        <GoalInsights insights={goalAnalyticsData.insights} />
                      </div>
                    )}
                  </div>
                ) : undefined
              }
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <TaxCalculatorCard refreshKey={taxRefreshKey} />
          </ErrorBoundary>
        </div>

        {/* Row 3: Performance (Melhores Desempenhos + Atenção Necessária) */}
        {hasAnalytics && (
          <div className="mb-6">
            <PerformanceCards performance={analyticsData.performance} />
          </div>
        )}
      </div>

      {}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        onSave={handleAddInvestment}
        isSubmitting={isSubmitting}
      />

      <OperationModal
        isOpen={isOperationModalOpen}
        onClose={() => {
          setIsOperationModalOpen(false);
          setSelectedInvestment(null);
        }}
        investment={selectedInvestment}
        onSave={handleAddOperation}
        isSubmitting={isSubmitting}
      />

      <EditInvestmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInvestment(null);
        }}
        investment={selectedInvestment}
        onSave={handleUpdateInvestment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
