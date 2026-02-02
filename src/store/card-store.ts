import { create } from "zustand";
import { getShortMonthName } from "@/lib/card-constants";
import { cardApi, ApiClientError } from "@/lib/api-client";
import type {
  CreditCard,
  Invoice,
  CreateCardInput,
  CreatePurchaseInput,
  CardSummary,
  InvoicePreview,
  InvoiceStatus,
} from "@/types/credit-card";

// ============================================
// Types
// ============================================

interface PurchaseResponse {
  card: CreditCard;
}

interface CardStore {
  // State
  cards: CreditCard[];
  selectedCard: CreditCard | null;
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCards: () => Promise<void>;
  addCard: (data: CreateCardInput) => Promise<void>;
  updateCard: (id: string, data: Partial<CreditCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  selectCard: (card: CreditCard | null) => void;
  selectInvoice: (invoice: Invoice | null) => void;
  addPurchase: (data: CreatePurchaseInput) => Promise<void>;
  deletePurchase: (purchaseId: string) => Promise<void>;
  updateInvoiceStatus: (cardId: string, invoiceId: string, status: InvoiceStatus) => Promise<void>;
  clearError: () => void;

  // Selectors (computed data)
  getCardSummary: (cardId?: string) => CardSummary;
  getInvoicePreview: (cardId: string, months?: number) => InvoicePreview[];
  getAllCardsInvoicePreview: (months?: number) => InvoicePreview[];
  getCurrentInvoice: (cardId: string) => Invoice | null;
  getCardInvoices: (cardId: string) => Invoice[];
}

// ============================================
// Helpers
// ============================================

/**
 * Extract error message from various error types.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro desconhecido";
}

// ============================================
// Store
// ============================================

export const useCardStore = create<CardStore>((set, get) => ({
  // Initial state
  cards: [],
  selectedCard: null,
  selectedInvoice: null,
  isLoading: false,
  error: null,

  fetchCards: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await cardApi.getAll<CreditCard>();

      const { selectedCard } = get();
      const updatedSelectedCard = selectedCard
        ? data.find((c) => c.id === selectedCard.id) || null
        : null;

      set({
        cards: data,
        selectedCard: updatedSelectedCard,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  addCard: async (data: CreateCardInput) => {
    set({ isLoading: true, error: null });

    try {
      const newCard = await cardApi.create<CreditCard, CreateCardInput>(data);
      set((state) => ({
        cards: [newCard, ...state.cards],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateCard: async (id: string, data: Partial<CreditCard>) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await cardApi.update<CreditCard, Partial<CreditCard>>(id, data);
      set((state) => ({
        cards: state.cards.map((c) => (c.id === id ? updated : c)),
        selectedCard: state.selectedCard?.id === id ? updated : state.selectedCard,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteCard: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await cardApi.delete(id);
      set((state) => ({
        cards: state.cards.filter((c) => c.id !== id),
        selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  selectCard: (card) => {
    const { cards } = get();
    const updatedCard = card ? cards.find((c) => c.id === card.id) || card : null;
    set({ selectedCard: updatedCard });
  },

  selectInvoice: (invoice) => set({ selectedInvoice: invoice }),

  addPurchase: async (data: CreatePurchaseInput) => {
    set({ isLoading: true, error: null });

    try {
      const { card: updatedCard } = await cardApi.addPurchase<PurchaseResponse, CreatePurchaseInput>(
        data.creditCardId,
        data
      );
      set((state) => ({
        cards: state.cards.map((c) => (c.id === data.creditCardId ? updatedCard : c)),
        selectedCard: state.selectedCard?.id === data.creditCardId ? updatedCard : state.selectedCard,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deletePurchase: async (purchaseId: string) => {
    set({ isLoading: true, error: null });

    try {
      await cardApi.deletePurchase(purchaseId);
      // Refetch cards to get updated state
      await get().fetchCards();
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateInvoiceStatus: async (cardId, invoiceId, status) => {
    set({ isLoading: true, error: null });

    try {
      await cardApi.updateInvoice<unknown, { status: InvoiceStatus }>(cardId, invoiceId, { status });
      // Refetch cards to get updated state
      await get().fetchCards();
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // ============================================
  // Selectors (computed data from local state)
  // ============================================

  getCardSummary: (cardId?: string): CardSummary => {
    const { cards } = get();
    const targetCards = cardId ? cards.filter((c) => c.id === cardId) : cards;

    const totalLimit = targetCards.reduce((sum, c) => sum + c.limit, 0);

    const now = new Date();
    const currentDay = now.getDate();

    let usedLimit = 0;
    let currentInvoice = 0;
    let nextInvoice = 0;

    targetCards.forEach((card) => {

      let closingMonth = now.getMonth() + 1;
      let closingYear = now.getFullYear();

      if (currentDay > card.closingDay) {
        closingMonth += 1;
        if (closingMonth > 12) {
          closingMonth = 1;
          closingYear += 1;
        }
      }

      let currentMonth = closingMonth;
      let currentYear = closingYear;
      if (card.dueDay <= card.closingDay) {
        currentMonth += 1;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear += 1;
        }
      }

      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }

      card.invoices?.forEach((invoice) => {
        if (invoice.status !== "paid") {
          usedLimit += invoice.total - (invoice.paidAmount || 0);

          if (invoice.month === currentMonth && invoice.year === currentYear) {
            currentInvoice += invoice.total;
          } else if (invoice.month === nextMonth && invoice.year === nextYear) {
            nextInvoice += invoice.total;
          }
        }
      });
    });

    return {
      totalLimit,
      usedLimit,
      availableLimit: totalLimit - usedLimit,
      currentInvoice,
      nextInvoice,
    };
  },

  getInvoicePreview: (cardId: string, months: number = 6): InvoicePreview[] => {
    const { cards } = get();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return [];

    const previews: InvoicePreview[] = [];
    const now = new Date();
    const currentDay = now.getDate();

    let closingMonth = now.getMonth();
    let closingYear = now.getFullYear();

    if (currentDay > card.closingDay) {
      closingMonth += 1;
      if (closingMonth > 11) {
        closingMonth = 0;
        closingYear += 1;
      }
    }

    let startMonth = closingMonth;
    let startYear = closingYear;
    if (card.dueDay <= card.closingDay) {
      startMonth += 1;
      if (startMonth > 11) {
        startMonth = 0;
        startYear += 1;
      }
    }

    for (let i = 0; i < months; i++) {
      const date = new Date(startYear, startMonth + i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const invoice = card.invoices?.find(
        (inv) => inv.month === month && inv.year === year
      );

      const pendingAmount = invoice ? invoice.total - (invoice.paidAmount || 0) : 0;

      previews.push({
        month,
        year,
        label: `${getShortMonthName(month)}/${String(year).slice(2)}`,
        amount: pendingAmount,
        status: invoice?.status || "open",
        dueDate: invoice?.dueDate || new Date(year, month - 1, card.dueDay),
      });
    }

    return previews;
  },

  getAllCardsInvoicePreview: (months: number = 6): InvoicePreview[] => {
    const { cards } = get();
    if (cards.length === 0) return [];

    const previews: InvoicePreview[] = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startMonth = currentMonth;
    const startYear = currentYear;

    for (let i = 0; i < months; i++) {
      let month = startMonth + i;
      let year = startYear;
      while (month > 12) {
        month -= 12;
        year += 1;
      }

      let totalAmount = 0;
      let hasAnyInvoice = false;

      cards.forEach((card) => {
        const invoice = card.invoices?.find(
          (inv) => inv.month === month && inv.year === year
        );
        if (invoice) {

          const pendingAmount = invoice.total - (invoice.paidAmount || 0);
          if (pendingAmount > 0) {
            totalAmount += pendingAmount;
            hasAnyInvoice = true;
          }
        }
      });

      previews.push({
        month,
        year,
        label: `${getShortMonthName(month)}/${String(year).slice(2)}`,
        amount: totalAmount,
        status: hasAnyInvoice ? "open" : "open",
        dueDate: new Date(year, month - 1, 10),
      });
    }

    return previews;
  },

  getCurrentInvoice: (cardId: string): Invoice | null => {
    const { cards } = get();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return null;

    const now = new Date();
    const currentDay = now.getDate();

    let closingMonth = now.getMonth() + 1;
    let closingYear = now.getFullYear();

    if (currentDay > card.closingDay) {
      closingMonth += 1;
      if (closingMonth > 12) {
        closingMonth = 1;
        closingYear += 1;
      }
    }

    let month = closingMonth;
    let year = closingYear;
    if (card.dueDay <= card.closingDay) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    const targetInvoice = card.invoices?.find(
      (inv) => inv.month === month && inv.year === year
    );

    if (!targetInvoice) {
      const openInvoice = card.invoices?.find((inv) => inv.status === "open");
      if (openInvoice) return openInvoice;

      return card.invoices?.[0] || null;
    }

    return targetInvoice;
  },

  getCardInvoices: (cardId: string): Invoice[] => {
    const { cards } = get();
    const card = cards.find((c) => c.id === cardId);
    if (!card || !card.invoices) return [];

    return [...card.invoices].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  },
}));