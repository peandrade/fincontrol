import { create } from "zustand";
import type {
  Investment,
  CreateInvestmentInput,
  UpdateInvestmentInput,
  CreateOperationInput,
  InvestmentSummary,
  AllocationData,
  InvestmentType,
} from "@/types";
import {
  getInvestmentTypeLabel,
  getInvestmentTypeColor,
} from "@/lib/constants";
import { investmentApi, ApiClientError } from "@/lib/api-client";

// ============================================
// Types
// ============================================

interface QuotesRefreshResult {
  success: boolean;
  updated: number;
  errors: Array<{ ticker: string; error: string }>;
}

interface YieldsRefreshResult {
  success: boolean;
  updated: number;
  lastUpdate: string | null;
}

interface QuotesApiResponse {
  success: boolean;
  updated: number;
  errors?: Array<{ ticker: string; error: string }>;
}

interface YieldsApiResponse {
  yields?: Array<{ calculation: unknown }>;
  lastUpdate: string | null;
}

interface OperationResponse {
  investment: Investment;
}

interface InvestmentStore {
  // State
  investments: Investment[];
  isLoading: boolean;
  isRefreshingQuotes: boolean;
  isRefreshingYields: boolean;
  error: string | null;
  lastQuotesUpdate: Date | null;
  lastYieldsUpdate: Date | null;

  // Actions
  fetchInvestments: () => Promise<void>;
  addInvestment: (data: CreateInvestmentInput) => Promise<void>;
  updateInvestment: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addOperation: (data: CreateOperationInput) => Promise<void>;
  refreshQuotes: () => Promise<QuotesRefreshResult>;
  refreshYields: () => Promise<YieldsRefreshResult>;
  clearError: () => void;

  // Selectors (computed data)
  getSummary: () => InvestmentSummary;
  getAllocationByType: () => AllocationData[];
  getInvestmentsByType: (type: InvestmentType) => Investment[];
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

export const useInvestmentStore = create<InvestmentStore>((set, get) => ({
  // Initial state
  investments: [],
  isLoading: false,
  isRefreshingQuotes: false,
  isRefreshingYields: false,
  error: null,
  lastQuotesUpdate: null,
  lastYieldsUpdate: null,

  fetchInvestments: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await investmentApi.getAll<Investment>();
      set({ investments: data, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  addInvestment: async (data: CreateInvestmentInput) => {
    set({ isLoading: true, error: null });

    try {
      const newInvestment = await investmentApi.create<Investment, CreateInvestmentInput>(data);
      set((state) => ({
        investments: [newInvestment, ...state.investments],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateInvestment: async (id: string, data: UpdateInvestmentInput) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await investmentApi.update<Investment, UpdateInvestmentInput>(id, data);
      set((state) => ({
        investments: state.investments.map((inv) => (inv.id === id ? updated : inv)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteInvestment: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await investmentApi.delete(id);
      set((state) => ({
        investments: state.investments.filter((inv) => inv.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  addOperation: async (data: CreateOperationInput) => {
    set({ isLoading: true, error: null });

    try {
      const { investment: updated } = await investmentApi.addOperation<OperationResponse, CreateOperationInput>(
        data.investmentId,
        data
      );
      set((state) => ({
        investments: state.investments.map((inv) => (inv.id === data.investmentId ? updated : inv)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  refreshQuotes: async (): Promise<QuotesRefreshResult> => {
    set({ isRefreshingQuotes: true, error: null });

    try {
      const result = await investmentApi.refreshQuotes<QuotesApiResponse>();

      // Refetch investments if any were updated
      if (result.updated > 0) {
        const investments = await investmentApi.getAll<Investment>();
        set({ investments });
      }

      set({
        isRefreshingQuotes: false,
        lastQuotesUpdate: new Date(),
      });

      return {
        success: result.success,
        updated: result.updated,
        errors: result.errors || [],
      };
    } catch (error) {
      set({ error: getErrorMessage(error), isRefreshingQuotes: false });
      return {
        success: false,
        updated: 0,
        errors: [{ ticker: "all", error: getErrorMessage(error) }],
      };
    }
  },

  refreshYields: async (): Promise<YieldsRefreshResult> => {
    set({ isRefreshingYields: true, error: null });

    try {
      const result = await investmentApi.getYields<YieldsApiResponse>();

      // Refetch investments to get updated values
      const investments = await investmentApi.getAll<Investment>();
      set({ investments });

      set({
        isRefreshingYields: false,
        lastYieldsUpdate: new Date(),
      });

      return {
        success: true,
        updated: result.yields?.filter((y) => y.calculation).length || 0,
        lastUpdate: result.lastUpdate,
      };
    } catch (error) {
      set({ error: getErrorMessage(error), isRefreshingYields: false });
      return {
        success: false,
        updated: 0,
        lastUpdate: null,
      };
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // ============================================
  // Selectors (computed data from local state)
  // ============================================

  getSummary: (): InvestmentSummary => {
    const { investments } = get();
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercent,
      totalAssets: investments.length,
    };
  },

  getAllocationByType: (): AllocationData[] => {
    const { investments } = get();
    const byType = investments.reduce((acc, inv) => {
      if (!acc[inv.type]) acc[inv.type] = 0;
      acc[inv.type] += inv.currentValue;
      return acc;
    }, {} as Record<InvestmentType, number>);

    const total = Object.values(byType).reduce((sum, val) => sum + val, 0);

    return Object.entries(byType)
      .map(([type, value]) => ({
        type: type as InvestmentType,
        label: getInvestmentTypeLabel(type as InvestmentType),
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: getInvestmentTypeColor(type as InvestmentType),
      }))
      .sort((a, b) => b.value - a.value);
  },

  getInvestmentsByType: (type: InvestmentType): Investment[] => {
    return get().investments.filter((inv) => inv.type === type);
  },
}));