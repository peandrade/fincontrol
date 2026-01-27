"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, TrendingUp, Check, AlertCircle, Percent } from "lucide-react";
import {
  InvestmentSummaryCards,
  AllocationChart,
  InvestmentList,
  InvestmentModal,
  OperationModal,
  EditInvestmentModal,
} from "@/components/investments";
import { InvestmentAnalytics } from "@/components/investments/investment-analytics";
import { GoalSection, GoalsAnalytics } from "@/components/goals";
import type { Investment, CreateInvestmentInput, CreateOperationInput, UpdateInvestmentInput } from "@/types";
import { useInvestmentStore } from "@/store/investments-store";

export default function InvestmentsPage() {
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quotesMessage, setQuotesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleRefreshQuotes = async () => {
    const result = await refreshQuotes();
    if (result.updated > 0) {
      setQuotesMessage({
        type: "success",
        text: `${result.updated} cotações atualizadas`,
      });
    } else if (result.errors.length > 0 && result.updated === 0) {
      setQuotesMessage({
        type: "error",
        text: "Nenhuma cotação atualizada",
      });
    } else {
      setQuotesMessage({
        type: "success",
        text: "Cotações já estão atualizadas",
      });
    }
    setTimeout(() => setQuotesMessage(null), 4000);
  };

  const handleRefreshYields = async () => {
    const result = await refreshYields();
    if (result.success && result.updated > 0) {
      setQuotesMessage({
        type: "success",
        text: `${result.updated} rendimentos calculados`,
      });
    } else if (!result.success) {
      setQuotesMessage({
        type: "error",
        text: "Erro ao calcular rendimentos",
      });
    } else {
      setQuotesMessage({
        type: "success",
        text: "Rendimentos atualizados",
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
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-color border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>Carregando investimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>

      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {}
      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Investimentos
            </h1>
            <p className="mt-1" style={{ color: "var(--text-dimmed)" }}>Acompanhe sua carteira</p>
          </div>
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
              onClick={handleRefreshYields}
              disabled={isRefreshingYields}
              className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl font-medium transition-all disabled:opacity-50"
              title={lastYieldsUpdate ? `Última atualização: ${lastYieldsUpdate.toLocaleTimeString("pt-BR")}` : "Calcular rendimentos de renda fixa"}
            >
              <Percent className={`w-5 h-5 ${isRefreshingYields ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">
                {isRefreshingYields ? "Calculando..." : "Renda Fixa"}
              </span>
            </button>

            {}
            <button
              onClick={handleRefreshQuotes}
              disabled={isRefreshingQuotes}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium transition-all disabled:opacity-50"
              title={lastQuotesUpdate ? `Última atualização: ${lastQuotesUpdate.toLocaleTimeString("pt-BR")}` : "Atualizar cotações"}
            >
              <TrendingUp className={`w-5 h-5 ${isRefreshingQuotes ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">
                {isRefreshingQuotes ? "Atualizando..." : "Cotações"}
              </span>
            </button>

            {}
            <button
              onClick={() => fetchInvestments()}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
              title="Recarregar lista"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setIsInvestmentModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-gradient rounded-xl font-medium transition-all shadow-lg shadow-primary text-white"
            >
              <Plus className="w-5 h-5" />
              Novo Investimento
            </button>
          </div>
        </header>

        {}
        <InvestmentSummaryCards summary={summary} />

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <AllocationChart data={allocation} />
            <GoalSection />
            <GoalsAnalytics />
          </div>
          <div className="lg:col-span-2">
            <InvestmentList
              investments={investments}
              onDelete={handleDeleteInvestment}
              onAddOperation={openOperationModal}
              onEdit={openEditModal}
              deletingId={deletingId}
            />
          </div>
        </div>

        {}
        <div className="mt-6">
          <InvestmentAnalytics />
        </div>
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