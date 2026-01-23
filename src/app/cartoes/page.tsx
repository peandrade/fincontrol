"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCw, ShoppingCart, CreditCard, Layers } from "lucide-react";
import { useCardStore } from "@/store/card-store";
import {
  SummaryCards,
  CardList,
  InvoicePreviewChart,
  InvoiceDetail,
  CardModal,
  PurchaseModal,
} from "@/components/cards";
import { formatCurrency } from "@/lib/utils";
import type {
  CreditCard as CardType,
  CreateCardInput,
  CreatePurchaseInput,
  Invoice,
} from "@/types/credit-card";

function CartoesContent() {
  const searchParams = useSearchParams();
  const cardIdFromUrl = searchParams.get("card");

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "single">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Seleciona cartão da URL quando carrega
  useEffect(() => {
    if (cardIdFromUrl && cards.length > 0) {
      const cardFromUrl = cards.find((c) => c.id === cardIdFromUrl);
      if (cardFromUrl) {
        selectCard(cardFromUrl);
        setViewMode("single");
      }
    }
  }, [cardIdFromUrl, cards, selectCard]);

  // Quando muda o cartão selecionado, seleciona a fatura com valor ou a mais recente
  useEffect(() => {
    if (selectedCard) {
      const invoices = getCardInvoices(selectedCard.id);
      // Prioriza faturas com valor
      const invoiceWithValue = invoices.find((inv) => inv.total > 0);
      if (invoiceWithValue) {
        setSelectedInvoice(invoiceWithValue);
      } else if (invoices.length > 0) {
        setSelectedInvoice(invoices[invoices.length - 1]); // Mais recente
      } else {
        setSelectedInvoice(null);
      }
    } else {
      setSelectedInvoice(null);
    }
  }, [selectedCard, getCardInvoices]);

  const summary = getCardSummary();

  // Previsão: todos os cartões ou cartão individual
  const invoicePreview = viewMode === "all"
    ? getAllCardsInvoicePreview()
    : selectedCard
      ? getInvoicePreview(selectedCard.id)
      : [];

  // Faturas do cartão selecionado
  const cardInvoices = selectedCard ? getCardInvoices(selectedCard.id) : [];

  const handleAddCard = async (data: CreateCardInput) => {
    setIsSubmitting(true);
    try {
      await addCard(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPurchase = async (data: CreatePurchaseInput) => {
    setIsSubmitting(true);
    try {
      await addPurchase(data);
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

  // Calcula a próxima fatura com valor para cada cartão
  const getNextInvoiceWithValue = (card: CardType) => {
    const invoices = card.invoices || [];
    // Ordena por data e pega a primeira com valor
    const sorted = [...invoices].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    return sorted.find((inv) => inv.total > 0 && inv.status !== "paid");
  };

  if (isLoading && cards.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>Carregando cartões...</p>
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

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      {/* Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Cartões de Crédito
            </h1>
            <p className="mt-1" style={{ color: "var(--text-dimmed)" }}>Gerencie suas faturas</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCards()}
              className="p-3 hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 text-[var(--text-muted)] ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {selectedCard && viewMode === "single" && (
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover-strong)] rounded-xl font-medium transition-all text-[var(--text-primary)] border border-[var(--border-color-strong)]"
              >
                <ShoppingCart className="w-5 h-5" />
                Nova Compra
              </button>
            )}
            <button
              onClick={() => setIsCardModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25 text-white"
            >
              <Plus className="w-5 h-5" />
              Novo Cartão
            </button>
          </div>
        </header>

        {/* Cards de Resumo */}
        <SummaryCards summary={summary} />

        {/* Toggle: Todos vs Individual */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === "all"
                ? "bg-violet-600 text-white"
                : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
            }`}
          >
            <Layers className="w-4 h-4" />
            Todos os Cartões
          </button>
          <button
            onClick={() => setViewMode("single")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === "single"
                ? "bg-violet-600 text-white"
                : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Por Cartão
          </button>
          {viewMode === "single" && selectedCard && (
            <span className="ml-2 px-3 py-1 bg-[var(--bg-hover)] rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-color-strong)]">
              {selectedCard.name}
            </span>
          )}
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Lista de Cartões */}
          <CardList
            cards={cards}
            selectedCardId={viewMode === "single" ? selectedCard?.id : null}
            onSelectCard={handleSelectCard}
            onDeleteCard={handleDeleteCard}
            deletingId={deletingId}
          />

          {/* Previsão de Faturas */}
          <InvoicePreviewChart
            data={invoicePreview}
            cardColor={viewMode === "single" ? selectedCard?.color : "#8B5CF6"}
            title={viewMode === "all" ? "Previsão Total (Todos os Cartões)" : "Previsão de Faturas"}
          />
        </div>

        {/* Detalhes da Fatura - modo individual */}
        {viewMode === "single" && (
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
        )}

        {/* Resumo consolidado quando "Todos" */}
        {viewMode === "all" && (
          <div
            className="backdrop-blur rounded-2xl p-6 transition-colors duration-300"
            style={{
              backgroundColor: "var(--card-bg)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border-color)"
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Resumo de Todos os Cartões
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => {
                // Pega a próxima fatura com valor
                const nextInvoice = getNextInvoiceWithValue(card);
                const invoiceTotal = nextInvoice?.total || 0;
                const usagePercent = card.limit > 0 ? (invoiceTotal / card.limit) * 100 : 0;

                return (
                  <div
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className="p-4 rounded-xl cursor-pointer transition-all"
                    style={{ backgroundColor: "var(--bg-hover)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-7 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: card.color }}
                      >
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{card.name}</p>
                        {card.lastDigits && (
                          <p className="text-xs" style={{ color: "var(--text-dimmed)" }}>•••• {card.lastDigits}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {nextInvoice
                            ? `Fatura ${nextInvoice.month}/${nextInvoice.year}`
                            : "Próxima Fatura"}
                        </p>
                        <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                          {formatCurrency(invoiceTotal)}
                        </p>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-dimmed)" }}>
                        Vence dia {card.dueDay}
                      </p>
                    </div>

                    {/* Barra de uso do limite */}
                    {card.limit > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-dimmed)" }}>
                          <span>Limite: {formatCurrency(card.limit)}</span>
                          <span>{usagePercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: "var(--bg-hover)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(usagePercent, 100)}%`,
                              backgroundColor: usagePercent > 80
                                ? "#EF4444"
                                : usagePercent > 50
                                  ? "#F59E0B"
                                  : card.color,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
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

export default function CartoesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center transition-colors duration-300"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p style={{ color: "var(--text-muted)" }}>Carregando cartões...</p>
          </div>
        </div>
      }
    >
      <CartoesContent />
    </Suspense>
  );
}
