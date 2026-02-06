"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCw, ShoppingCart, CreditCard, Layers, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCardStore } from "@/store/card-store";
import { useFeedback } from "@/hooks";
import {
  SummaryCards,
  CardList,
  InvoicePreviewChart,
  InvoiceDetail,
  CardModal,
  PurchaseModal,
} from "@/components/cards";
import { CardAnalytics, CardAlertsContent } from "@/components/cards/card-analytics";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import type {
  CreditCard as CardType,
  CreateCardInput,
  CreatePurchaseInput,
  Invoice,
} from "@/types/credit-card";

function CartoesContent() {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const cardIdFromUrl = searchParams.get("card");

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "single">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Alerts popup state
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  // Get analytics from store (updates automatically)
  const getAnalytics = useCardStore((state) => state.getAnalytics);
  const analyticsData = getAnalytics();

  const {
    cards,
    selectedCard,
    isLoading,
    fetchCards,
    addCard,
    deleteCard,
    selectCard,
    addPurchase,
    deletePurchase,
    updateInvoiceStatus,
    getCardSummary,
    getInvoicePreview,
    getAllCardsInvoicePreview,
    getCardInvoices,
  } = useCardStore();

  const feedback = useFeedback();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Close alerts popup on click outside
  useEffect(() => {
    if (!isAlertsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAlertsOpen]);

  useEffect(() => {
    if (cardIdFromUrl && cards.length > 0) {
      const cardFromUrl = cards.find((c) => c.id === cardIdFromUrl);
      if (cardFromUrl) {
        selectCard(cardFromUrl);
        setViewMode("single");
      }
    }
  }, [cardIdFromUrl, cards, selectCard]);

  useEffect(() => {
    if (selectedCard) {
      const invoices = getCardInvoices(selectedCard.id);

      const invoiceWithValue = invoices.find((inv) => inv.total > 0);
      if (invoiceWithValue) {
        setSelectedInvoice(invoiceWithValue);
      } else if (invoices.length > 0) {
        setSelectedInvoice(invoices[invoices.length - 1]);
      } else {
        setSelectedInvoice(null);
      }
    } else {
      setSelectedInvoice(null);
    }
  }, [selectedCard, getCardInvoices]);

  const summary = getCardSummary();

  const invoicePreview = viewMode === "all"
    ? getAllCardsInvoicePreview()
    : selectedCard
      ? getInvoicePreview(selectedCard.id)
      : [];

  const cardInvoices = selectedCard ? getCardInvoices(selectedCard.id) : [];

  const handleAddCard = async (data: CreateCardInput) => {
    setIsSubmitting(true);
    try {
      await addCard(data);
      feedback.success();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPurchase = async (data: CreatePurchaseInput) => {
    setIsSubmitting(true);
    try {
      await addPurchase(data);
      feedback.success();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCard(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    if (!selectedCard) return;
    await updateInvoiceStatus(selectedCard.id, invoiceId, "paid");
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    await deletePurchase(purchaseId);
  };

  const handleSelectCard = (card: CardType) => {
    selectCard(card);
    setViewMode("single");
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  if (isLoading && cards.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-color border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>{tc("loading")}</p>
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      {}
      <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              {t("title")}
            </h1>
            <p className="mt-1" style={{ color: "var(--text-dimmed)" }}>{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Alerts Button */}
            {analyticsData && analyticsData.alerts.length > 0 && (
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                  className={`relative flex items-center justify-center p-3 rounded-xl border transition-all ${
                    isAlertsOpen
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                  }`}
                  title={t("cardAlerts")}
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {analyticsData.alerts.length}
                  </span>
                </button>
                {isAlertsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[380px] sm:w-[420px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] z-50 animate-slideUp p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {t("cardAlerts")}
                      </h3>
                    </div>
                    <CardAlertsContent alerts={analyticsData.alerts} />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => fetchCards()}
              className="p-3 hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
              title={tc("refresh")}
            >
              <RefreshCw className={`w-5 h-5 text-[var(--text-muted)] ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {selectedCard && viewMode === "single" && (
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover-strong)] rounded-xl font-medium transition-all text-[var(--text-primary)] border border-[var(--border-color-strong)]"
              >
                <ShoppingCart className="w-5 h-5" />
                {t("newPurchase")}
              </button>
            )}
            <button
              onClick={() => setIsCardModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-gradient rounded-xl font-medium transition-all shadow-lg shadow-primary text-white"
            >
              <Plus className="w-5 h-5" />
              {t("newCard")}
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === "all"
                ? "bg-primary-gradient text-white"
                : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
            }`}
          >
            <Layers className="w-4 h-4" />
            {t("allCards")}
          </button>
          <button
            onClick={() => setViewMode("single")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === "single"
                ? "bg-primary-gradient text-white"
                : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {t("byCard")}
          </button>
          {viewMode === "single" && selectedCard && (
            <span className="ml-2 px-3 py-1 bg-[var(--bg-hover)] rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-color-strong)]">
              {selectedCard.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ErrorBoundary>
            <CardList
              cards={cards}
              selectedCardId={viewMode === "single" ? selectedCard?.id : null}
              onSelectCard={handleSelectCard}
              onDeleteCard={handleDeleteCard}
              deletingId={deletingId}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <InvoicePreviewChart
              data={invoicePreview}
              cardColor={viewMode === "single" ? selectedCard?.color : "#8B5CF6"}
              title={viewMode === "all" ? t("totalForecast") : t("invoiceForecast")}
            />
          </ErrorBoundary>
        </div>

        {viewMode === "single" && (
          <ErrorBoundary>
            <InvoiceDetail
              invoices={cardInvoices}
              selectedInvoice={selectedInvoice}
              cardName={selectedCard?.name || ""}
              cardColor={selectedCard?.color || "#8B5CF6"}
              onSelectInvoice={handleSelectInvoice}
              onPayInvoice={handlePayInvoice}
              onDeletePurchase={handleDeletePurchase}
              isLoading={isLoading}
            />
          </ErrorBoundary>
        )}

        <div className="mt-6">
          <ErrorBoundary>
            <CardAnalytics />
          </ErrorBoundary>
        </div>
      </div>

      {}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSave={handleAddCard}
        isSubmitting={isSubmitting}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        card={selectedCard}
        onSave={handleAddPurchase}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function LoadingFallback() {
  const tc = useTranslations("common");
  return (
    <div
      className="min-h-screen flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-color border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: "var(--text-muted)" }}>{tc("loading")}</p>
      </div>
    </div>
  );
}

export default function CartoesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CartoesContent />
    </Suspense>
  );
}
