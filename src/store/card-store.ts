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

// Analytics types (calculated locally)
export interface CardSpendingByCategory {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface CardMonthlySpending {
  month: string;
  monthLabel: string;
  total: number;
  cardBreakdown: {
    cardId: string;
    cardName: string;
    cardColor: string;
    total: number;
  }[];
}

export interface CardAlert {
  type: "payment_due" | "high_usage" | "closing_soon";
  cardId: string;
  cardName: string;
  cardColor: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  value?: number;
  daysUntil?: number;
}

export interface CardAnalyticsData {
  spendingByCategory: CardSpendingByCategory[];
  monthlySpending: CardMonthlySpending[];
  alerts: CardAlert[];
  summary: {
    totalCards: number;
    totalLimit: number;
    totalUsed: number;
    usagePercentage: number;
    averageMonthlySpending: number;
    totalSpendingLast6Months: number;
  };
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
  getAnalytics: () => CardAnalyticsData;
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

  getAnalytics: (): CardAnalyticsData => {
    const { cards } = get();
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Collect all purchases from all invoices
    const allPurchases: { category: string; value: number; date: Date; cardId: string; cardName: string; cardColor: string }[] = [];
    const unpaidByCard: Record<string, number> = {};

    cards.forEach((card) => {
      card.invoices?.forEach((invoice) => {
        // Track unpaid amounts
        if (invoice.status !== "paid") {
          const debt = invoice.total - (invoice.paidAmount || 0);
          unpaidByCard[card.id] = (unpaidByCard[card.id] || 0) + debt;
        }

        // Collect purchases
        invoice.purchases?.forEach((purchase) => {
          allPurchases.push({
            category: purchase.category,
            value: purchase.value,
            date: new Date(purchase.date),
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
          });
        });
      });
    });

    // === SPENDING BY CATEGORY (last 6 months) ===
    const sixMonthsAgo = new Date(currentYear, currentMonth - 7, 1);
    const recentPurchases = allPurchases.filter((p) => p.date >= sixMonthsAgo);

    const categoryAggregates: Record<string, { total: number; count: number }> = {};
    recentPurchases.forEach((p) => {
      if (!categoryAggregates[p.category]) {
        categoryAggregates[p.category] = { total: 0, count: 0 };
      }
      categoryAggregates[p.category].total += p.value;
      categoryAggregates[p.category].count += 1;
    });

    const totalCategorySpending = Object.values(categoryAggregates).reduce((sum, cat) => sum + cat.total, 0);

    const spendingByCategory: CardSpendingByCategory[] = Object.entries(categoryAggregates)
      .map(([category, data]) => ({
        category,
        total: data.total,
        percentage: totalCategorySpending > 0 ? (data.total / totalCategorySpending) * 100 : 0,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.total - a.total);

    // === MONTHLY SPENDING (2 months back + current + 3 future) ===
    const monthlySpending: CardMonthlySpending[] = [];
    const monthNames = ["", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    for (let i = -2; i <= 3; i++) {
      let month = currentMonth + i;
      let year = currentYear;

      while (month <= 0) {
        month += 12;
        year -= 1;
      }
      while (month > 12) {
        month -= 12;
        year += 1;
      }

      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      const monthLabel = monthNames[month];

      const cardBreakdown: CardMonthlySpending["cardBreakdown"] = [];

      cards.forEach((card) => {
        let cardTotal = 0;

        if (i <= 0) {
          // Past and current: sum purchases in this month
          card.invoices?.forEach((invoice) => {
            invoice.purchases?.forEach((purchase) => {
              const purchaseDate = new Date(purchase.date);
              if (purchaseDate.getMonth() + 1 === month && purchaseDate.getFullYear() === year) {
                cardTotal += purchase.value;
              }
            });
          });
        } else {
          // Future: use invoice total
          const invoice = card.invoices?.find((inv) => inv.month === month && inv.year === year);
          if (invoice) {
            cardTotal = invoice.total;
          }
        }

        if (cardTotal > 0) {
          cardBreakdown.push({
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
            total: cardTotal,
          });
        }
      });

      monthlySpending.push({
        month: monthKey,
        monthLabel,
        total: cardBreakdown.reduce((sum, c) => sum + c.total, 0),
        cardBreakdown,
      });
    }

    // === ALERTS ===
    const alerts: CardAlert[] = [];

    cards.forEach((card) => {
      // Find current month invoice
      const currentInvoice = card.invoices?.find(
        (inv) => inv.month === currentMonth && inv.year === currentYear
      );

      // Payment due alert
      if (currentInvoice && currentInvoice.status !== "paid") {
        const dueDate = new Date(currentInvoice.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue >= 0 && daysUntilDue <= 5 && currentInvoice.total > (currentInvoice.paidAmount || 0)) {
          alerts.push({
            type: "payment_due",
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
            messageKey: daysUntilDue === 0 ? "alertInvoiceDueToday" : "alertInvoiceDueIn",
            messageParams: { days: daysUntilDue },
            value: currentInvoice.total - (currentInvoice.paidAmount || 0),
            daysUntil: daysUntilDue,
          });
        }
      }

      // Closing soon alert
      const daysUntilClosing = card.closingDay >= currentDay
        ? card.closingDay - currentDay
        : 30 - currentDay + card.closingDay;

      if (daysUntilClosing <= 3) {
        alerts.push({
          type: "closing_soon",
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color,
          messageKey: daysUntilClosing === 0 ? "alertInvoiceClosesToday" : "alertInvoiceClosesIn",
          messageParams: { days: daysUntilClosing },
          daysUntil: daysUntilClosing,
        });
      }

      // High usage alert
      const usedLimit = unpaidByCard[card.id] || 0;
      const usagePercent = card.limit > 0 ? (usedLimit / card.limit) * 100 : 0;

      if (usagePercent >= 80) {
        alerts.push({
          type: "high_usage",
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color,
          messageKey: "alertHighUsage",
          messageParams: { percent: Math.round(usagePercent) },
          value: usedLimit,
        });
      }
    });

    // Sort alerts by priority
    alerts.sort((a, b) => {
      const priority = { payment_due: 0, closing_soon: 1, high_usage: 2 };
      return priority[a.type] - priority[b.type];
    });

    // === SUMMARY ===
    const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
    const totalUsed = Object.values(unpaidByCard).reduce((sum, debt) => sum + debt, 0);
    const averageMonthlySpending = monthlySpending.reduce((sum, m) => sum + m.total, 0) / monthlySpending.length;

    return {
      spendingByCategory,
      monthlySpending,
      alerts,
      summary: {
        totalCards: cards.length,
        totalLimit,
        totalUsed,
        usagePercentage: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
        averageMonthlySpending,
        totalSpendingLast6Months: totalCategorySpending,
      },
    };
  },
}));