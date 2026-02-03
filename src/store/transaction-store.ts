import { create } from "zustand";
import { getCategoryColor, MONTH_NAMES_SHORT, DAY_NAMES_SHORT } from "@/lib/constants";
import { calculatePercentage } from "@/lib/utils";
import { transactionApi, ApiClientError } from "@/lib/api-client";
import type {
  Transaction,
  CreateTransactionInput,
  MonthlySummary,
  CategoryData,
  MonthlyEvolution,
  EvolutionPeriod,
  TransactionType,
} from "@/types";

// ============================================
// Types
// ============================================

export interface TransactionFilters {
  search: string;
  startDate: string | null;
  endDate: string | null;
  categories: string[];
  type: TransactionType | "all";
  minValue: number | null;
  maxValue: number | null;
}

export const defaultFilters: TransactionFilters = {
  search: "",
  startDate: null,
  endDate: null,
  categories: [],
  type: "all",
  minValue: null,
  maxValue: null,
};

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface TransactionState {
  // State
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: TransactionFilters;
  pagination: Pagination | null;

  // Actions
  fetchTransactions: (useFilters?: boolean) => Promise<void>;
  fetchTransactionsPaginated: (page?: number, pageSize?: number, useFilters?: boolean) => Promise<void>;
  fetchMoreTransactions: () => Promise<void>;
  fetchWithCurrentFilters: () => Promise<void>;
  addTransaction: (data: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: string, data: Partial<CreateTransactionInput>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;

  // Selectors (computed data)
  getSummary: () => MonthlySummary;
  getCategoryData: () => CategoryData[];
  getMonthlyEvolution: (period?: EvolutionPeriod) => MonthlyEvolution[];
  getFilteredTransactions: () => Transaction[];
  hasActiveFilters: () => boolean;
}

// ============================================
// Helpers
// ============================================

/**
 * Convert store filters to API query format.
 */
function filtersToApiQuery(filters: TransactionFilters) {
  return {
    search: filters.search || undefined,
    type: filters.type !== "all" ? filters.type : undefined,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    minValue: filters.minValue ?? undefined,
    maxValue: filters.maxValue ?? undefined,
  };
}

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

export const useTransactionStore = create<TransactionState>((set, get) => ({
  // Initial state
  transactions: [],
  isLoading: false,
  error: null,
  filters: { ...defaultFilters },
  pagination: null,

  // Fetch all transactions (backwards compatibility)
  fetchTransactions: async (useFilters = false) => {
    set({ isLoading: true, error: null });

    try {
      const { filters } = get();
      const query = useFilters ? filtersToApiQuery(filters) : undefined;
      const data = await transactionApi.getAll<Transaction>(query);
      set({ transactions: data, isLoading: false, pagination: null });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  // Fetch transactions with pagination
  fetchTransactionsPaginated: async (page = 1, pageSize = 50, useFilters = false) => {
    set({ isLoading: true, error: null });

    try {
      const { filters } = get();
      const query = useFilters ? filtersToApiQuery(filters) : undefined;
      const { data, pagination } = await transactionApi.getPaginated<Transaction>(
        page,
        pageSize,
        query
      );

      if (page === 1) {
        set({ transactions: data, pagination, isLoading: false });
      } else {
        set((state) => ({
          transactions: [...state.transactions, ...data],
          pagination,
          isLoading: false,
        }));
      }
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  // Fetch with current filters applied (server-side filtering)
  fetchWithCurrentFilters: async () => {
    await get().fetchTransactionsPaginated(1, 50, true);
  },

  // Load more transactions (infinite scroll)
  fetchMoreTransactions: async () => {
    const { pagination, isLoading } = get();

    if (isLoading || !pagination?.hasMore) return;

    await get().fetchTransactionsPaginated(pagination.page + 1, pagination.pageSize);
  },

  addTransaction: async (data: CreateTransactionInput) => {
    set({ isLoading: true, error: null });

    try {
      const newTransaction = await transactionApi.create<Transaction, CreateTransactionInput>(data);
      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateTransaction: async (id: string, data: Partial<CreateTransactionInput>) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await transactionApi.update<Transaction, Partial<CreateTransactionInput>>(id, data);
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      await transactionApi.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  setFilters: (newFilters: Partial<TransactionFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({ filters: { ...defaultFilters } });
  },

  clearError: () => {
    set({ error: null });
  },

  // ============================================
  // Selectors (computed data from local state)
  // ============================================

  getSummary: (): MonthlySummary => {
    const { transactions } = get();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const income = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.value, 0);

    const expense = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.value, 0);

    // Previous month comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const lastIncome = lastMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.value, 0);

    const lastExpense = lastMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.value, 0);

    return {
      income,
      expense,
      balance: income - expense,
      incomeChange: lastIncome > 0 ? ((income - lastIncome) / lastIncome) * 100 : 0,
      expenseChange: lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : 0,
    };
  },

  getCategoryData: (): CategoryData[] => {
    const { transactions } = get();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenses = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        t.type === "expense" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });

    const categoryMap = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.value;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
        percentage: calculatePercentage(value, total),
      }))
      .sort((a, b) => b.value - a.value);
  },

  getMonthlyEvolution: (period: EvolutionPeriod = "6m"): MonthlyEvolution[] => {
    const { transactions } = get();
    const result: MonthlyEvolution[] = [];

    const periodConfig: Record<EvolutionPeriod, { days?: number; months?: number; groupBy: "day" | "month" }> = {
      "1w": { days: 7, groupBy: "day" },
      "1m": { days: 30, groupBy: "day" },
      "3m": { months: 3, groupBy: "month" },
      "6m": { months: 6, groupBy: "month" },
      "1y": { months: 12, groupBy: "month" },
    };

    const config = periodConfig[period];

    if (config.groupBy === "day" && config.days) {
      for (let i = config.days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayTransactions = transactions.filter((t) => {
          const tDate = new Date(t.date);
          return tDate >= date && tDate < nextDate;
        });

        const income = dayTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.value, 0);

        const expense = dayTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.value, 0);

        const label = config.days <= 7
          ? `${DAY_NAMES_SHORT[date.getDay()]} ${date.getDate()}`
          : `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;

        result.push({ month: label, income, expense });
      }
    } else if (config.groupBy === "month" && config.months) {
      for (let i = config.months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const month = date.getMonth();
        const year = date.getFullYear();

        const monthTransactions = transactions.filter((t) => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === month && tDate.getFullYear() === year;
        });

        const income = monthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.value, 0);

        const expense = monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.value, 0);

        const label = config.months > 6
          ? `${MONTH_NAMES_SHORT[month]}/${String(year).slice(2)}`
          : MONTH_NAMES_SHORT[month];

        result.push({ month: label, income, expense });
      }
    }

    return result;
  },

  /**
   * Get filtered transactions (client-side).
   * For better performance with large datasets, use fetchWithCurrentFilters()
   * for server-side filtering.
   */
  getFilteredTransactions: (): Transaction[] => {
    const { transactions, filters } = get();

    if (!get().hasActiveFilters()) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesDescription = transaction.description?.toLowerCase().includes(searchLower);
        const matchesCategory = transaction.category.toLowerCase().includes(searchLower);
        if (!matchesDescription && !matchesCategory) return false;
      }

      if (filters.type !== "all" && transaction.type !== filters.type) return false;

      if (filters.categories.length > 0 && !filters.categories.includes(transaction.category)) {
        return false;
      }

      if (filters.startDate) {
        const transactionDate = new Date(transaction.date);
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (transactionDate < startDate) return false;
      }

      if (filters.endDate) {
        const transactionDate = new Date(transaction.date);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (transactionDate > endDate) return false;
      }

      if (filters.minValue !== null && transaction.value < filters.minValue) return false;
      if (filters.maxValue !== null && transaction.value > filters.maxValue) return false;

      return true;
    });
  },

  hasActiveFilters: (): boolean => {
    const { filters } = get();
    return (
      filters.search !== "" ||
      filters.startDate !== null ||
      filters.endDate !== null ||
      filters.categories.length > 0 ||
      filters.type !== "all" ||
      filters.minValue !== null ||
      filters.maxValue !== null
    );
  },
}));
