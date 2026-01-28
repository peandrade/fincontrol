"use client";

import { useEffect, useState, useRef } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import { useTransactionStore } from "@/store/transaction-store";
import { useFeedback } from "@/hooks/use-feedback";
import { useTemplateStore } from "@/store/template-store";
import { usePreferences } from "@/contexts";
import { getMonthYearLabel } from "@/lib/constants";
import { SummaryCards, MonthlyChart, CategoryChart, TransactionList, WealthEvolutionChart, QuickStats } from "@/components/dashboard";
import { FinancialHealthScore } from "@/components/dashboard/financial-health-score";
import { BillsCalendar } from "@/components/dashboard/bills-calendar";
import { TransactionModal } from "@/components/forms/transaction-modal";
import { BudgetOverviewCard } from "@/components/budget/budget-overview-card";
import { RecurringSection } from "@/components/recurring";
import { QuickActionButtons } from "@/components/quick-transaction";
import type { CreateTransactionInput, EvolutionPeriod, Transaction, TransactionType, TransactionTemplate } from "@/types";

// Helper function to map defaultPeriod to EvolutionPeriod
function mapDefaultPeriodToEvolution(defaultPeriod: string): EvolutionPeriod {
  const periodMap: Record<string, EvolutionPeriod> = {
    week: "1w",
    month: "1m",
    quarter: "3m",
    year: "1y",
  };
  return periodMap[defaultPeriod] || "6m";
}

export default function DashboardPage() {
  const { general } = usePreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [evolutionPeriod, setEvolutionPeriod] = useState<EvolutionPeriod>(() =>
    mapDefaultPeriodToEvolution(general.defaultPeriod)
  );
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const {
    transactions,
    isLoading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    getSummary,
    getCategoryData,
    getMonthlyEvolution,
  } = useTransactionStore();

  const { addTemplate } = useTemplateStore();
  const feedback = useFeedback();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Close calendar popup on click outside
  useEffect(() => {
    if (!isCalendarOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  // Update evolution period when defaultPeriod preference changes
  useEffect(() => {
    setEvolutionPeriod(mapDefaultPeriodToEvolution(general.defaultPeriod));
  }, [general.defaultPeriod]);

  const summary = getSummary();
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyEvolution(evolutionPeriod);

  const handleAddTransaction = async (
    data: CreateTransactionInput,
    saveAsTemplate?: { name: string }
  ) => {
    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await deleteTransaction(editingTransaction.id);
      }

      await addTransaction(data);
      feedback.success();

      setBudgetRefreshTrigger((prev) => prev + 1);

      if (saveAsTemplate) {
        await addTemplate({
          name: saveAsTemplate.name,
          description: data.description,
          category: data.category,
          type: data.type,
          value: data.value,
        });
      }

      setSelectedTemplate(null);
      setInitialTransactionType(undefined);
      setEditingTransaction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (type: TransactionType) => {
    setInitialTransactionType(type);
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleUseTemplate = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    setInitialTransactionType(undefined);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSelectedTemplate(null);
    setInitialTransactionType(undefined);
    setIsModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
    setInitialTransactionType(undefined);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);

      setBudgetRefreshTrigger((prev) => prev + 1);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-color border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>Carregando transações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
        }
      `}</style>

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
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Dashboard
            </h1>
            <p className="mt-1 flex items-center gap-2" style={{ color: "var(--text-dimmed)" }}>
              <Calendar className="w-4 h-4" />
              {getMonthYearLabel()}
            </p>
          </div>
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex items-center justify-center p-3 rounded-xl border transition-all ${
                isCalendarOpen
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
              }`}
              title="Calendário de Contas"
            >
              <CalendarDays className="w-5 h-5 text-blue-400" />
            </button>
            {isCalendarOpen && (
              <div className="absolute right-0 top-full mt-2 w-[380px] sm:w-[420px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)] z-50 animate-slideUp">
                <BillsCalendar />
              </div>
            )}
          </div>
        </header>

        {/* Quick Stats - Always visible */}
        <QuickStats />

        {/* Summary Cards - Always visible */}
        <SummaryCards summary={summary} />

        {/* Charts - Below summary cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <MonthlyChart
              data={monthlyData}
              period={evolutionPeriod}
              onPeriodChange={setEvolutionPeriod}
            />
          </div>
          <div className="h-full">
            <CategoryChart data={categoryData} />
          </div>
          <div className="lg:col-span-2">
            <WealthEvolutionChart />
          </div>
          <div className="h-full">
            <FinancialHealthScore />
          </div>
        </div>

        {/* Orçamento + Despesas Fixas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BudgetOverviewCard refreshTrigger={budgetRefreshTrigger} />
          <RecurringSection
            onExpenseLaunched={() => {
              fetchTransactions();
              setBudgetRefreshTrigger((prev) => prev + 1);
            }}
          />
        </div>

        {/* Transações Recentes */}
        <TransactionList
          transactions={transactions}
          onDelete={handleDeleteTransaction}
          onEdit={handleEditTransaction}
          deletingId={deletingId}
        />
      </div>

      {}
      <QuickActionButtons onQuickAdd={handleQuickAdd} onUseTemplate={handleUseTemplate} />

      {}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseTransactionModal}
        onSave={handleAddTransaction}
        isSubmitting={isSubmitting}
        initialType={initialTransactionType}
        template={selectedTemplate}
        editTransaction={editingTransaction}
      />
    </div>
  );
}
