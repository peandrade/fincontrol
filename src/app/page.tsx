"use client";

import { useEffect, useState } from "react";
import { Calendar, CalendarDays, Target, LayoutList, X } from "lucide-react";
import { useTransactionStore } from "@/store/transaction-store";
import { useFeedback } from "@/hooks/use-feedback";
import { useTemplateStore } from "@/store/template-store";
import { getMonthYearLabel } from "@/lib/constants";
import { SummaryCards, MonthlyChart, CategoryChart, TransactionList, WealthEvolutionChart, QuickStats } from "@/components/dashboard";
import { FinancialHealthScore } from "@/components/dashboard/financial-health-score";
import { BillsCalendar } from "@/components/dashboard/bills-calendar";
import { TransactionModal } from "@/components/forms/transaction-modal";
import { BudgetSection } from "@/components/budget/budget-section";
import { RecurringSection } from "@/components/recurring";
import { QuickActionButtons, TemplateSection, TemplateModal } from "@/components/quick-transaction";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { CreateTransactionInput, EvolutionPeriod, TransactionType, TransactionTemplate } from "@/types";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [evolutionPeriod, setEvolutionPeriod] = useState<EvolutionPeriod>("6m");
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TransactionTemplate | null>(null);
  const [isTemplateSubmitting, setIsTemplateSubmitting] = useState(false);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);

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

  const { addTemplate, updateTemplate } = useTemplateStore();
  const feedback = useFeedback();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const summary = getSummary();
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyEvolution(evolutionPeriod);

  const handleAddTransaction = async (
    data: CreateTransactionInput,
    saveAsTemplate?: { name: string }
  ) => {
    setIsSubmitting(true);
    try {
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

  const handleEditTemplate = (template: TransactionTemplate) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (data: {
    name: string;
    description?: string;
    category: string;
    type: TransactionType;
    value?: number;
  }) => {
    setIsTemplateSubmitting(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
      } else {
        await addTemplate(data);
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  const handleCloseTransactionModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
    setInitialTransactionType(undefined);
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
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center justify-center p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all"
            title="Calendário de Contas"
          >
            <CalendarDays className="w-5 h-5 text-blue-400" />
          </button>
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

        {/* Section: Planejamento */}
        <CollapsibleSection
          id="planning"
          title="Planejamento"
          icon={<Target className="w-5 h-5 text-primary-color" />}
          defaultExpanded={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetSection refreshTrigger={budgetRefreshTrigger} />
            <RecurringSection
              onExpenseLaunched={() => {
                fetchTransactions();
                setBudgetRefreshTrigger((prev) => prev + 1);
              }}
            />
          </div>
        </CollapsibleSection>

        {/* Section: Transações */}
        <CollapsibleSection
          id="transactions"
          title="Transações Recentes"
          icon={<LayoutList className="w-5 h-5 text-primary-color" />}
          badge={transactions.length}
          badgeColor="violet"
          defaultExpanded={true}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <TemplateSection
                onUseTemplate={handleUseTemplate}
                onEditTemplate={handleEditTemplate}
                onCreateTemplate={handleCreateTemplate}
              />
            </div>
            <div className="lg:w-2/3">
              <TransactionList
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                deletingId={deletingId}
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {}
      <QuickActionButtons onQuickAdd={handleQuickAdd} />

      {}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseTransactionModal}
        onSave={handleAddTransaction}
        isSubmitting={isSubmitting}
        initialType={initialTransactionType}
        template={selectedTemplate}
      />

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCalendarOpen(false)}
          />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
            <BillsCalendar />
          </div>
        </div>
      )}

      {}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
        isSubmitting={isTemplateSubmitting}
      />
    </div>
  );
}
