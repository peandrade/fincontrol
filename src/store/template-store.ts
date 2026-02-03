import { create } from "zustand";
import { templatesApi, ApiClientError } from "@/lib/api-client";
import type {
  TransactionTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "@/types";

// ============================================
// Types
// ============================================

interface TemplateState {
  // State
  templates: TransactionTemplate[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTemplates: () => Promise<void>;
  addTemplate: (data: CreateTemplateInput) => Promise<TransactionTemplate>;
  updateTemplate: (id: string, data: UpdateTemplateInput) => Promise<TransactionTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  useTemplate: (id: string) => Promise<TransactionTemplate>;
  clearError: () => void;

  // Selectors (computed data)
  getExpenseTemplates: () => TransactionTemplate[];
  getIncomeTemplates: () => TransactionTemplate[];
  getMostUsedTemplates: (limit?: number) => TransactionTemplate[];
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

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await templatesApi.getAll<TransactionTemplate>();
      set({ templates: data, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  addTemplate: async (data: CreateTemplateInput) => {
    set({ isLoading: true, error: null });

    try {
      const newTemplate = await templatesApi.create<TransactionTemplate, CreateTemplateInput>(data);
      set((state) => ({
        templates: [newTemplate, ...state.templates],
        isLoading: false,
      }));
      return newTemplate;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateTemplateInput) => {
    set({ isLoading: true, error: null });

    try {
      const updatedTemplate = await templatesApi.update<TransactionTemplate, UpdateTemplateInput>(id, data);
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updatedTemplate : t)),
        isLoading: false,
      }));
      return updatedTemplate;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await templatesApi.delete(id);
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  useTemplate: async (id: string) => {
    try {
      const updatedTemplate = await templatesApi.use<TransactionTemplate>(id);
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updatedTemplate : t)),
      }));
      return updatedTemplate;
    } catch (error) {
      console.error("Erro ao incrementar uso do template:", error);
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // ============================================
  // Selectors (computed data from local state)
  // ============================================

  getExpenseTemplates: () => {
    return get().templates.filter((t) => t.type === "expense");
  },

  getIncomeTemplates: () => {
    return get().templates.filter((t) => t.type === "income");
  },

  getMostUsedTemplates: (limit = 5) => {
    return [...get().templates].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
  },
}));
