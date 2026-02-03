import { create } from "zustand";
import { categoriesApi, ApiClientError } from "@/lib/api-client";

// ============================================
// Types
// ============================================

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  isDefault: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
}

interface CategoryState {
  // State
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  addCategory: (data: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;

  // Selectors (computed data)
  getExpenseCategories: () => Category[];
  getIncomeCategories: () => Category[];
  getCategoryByName: (name: string, type: "income" | "expense") => Category | undefined;
  getCategoryColor: (name: string) => string;
  getCategoryIcon: (name: string) => string;
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

export const useCategoryStore = create<CategoryState>((set, get) => ({
  // Initial state
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await categoriesApi.getAll<Category>();
      set({ categories: data, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  addCategory: async (data: CreateCategoryInput) => {
    set({ isLoading: true, error: null });

    try {
      const newCategory = await categoriesApi.create<Category, CreateCategoryInput>(data);
      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false,
      }));
      return newCategory;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateCategory: async (id: string, data: UpdateCategoryInput) => {
    set({ isLoading: true, error: null });

    try {
      const updatedCategory = await categoriesApi.update<Category, UpdateCategoryInput>(id, data);
      set((state) => ({
        categories: state.categories.map((cat) => (cat.id === id ? updatedCategory : cat)),
        isLoading: false,
      }));
      return updatedCategory;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await categoriesApi.delete(id);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        isLoading: false,
      }));
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

  getExpenseCategories: () => {
    return get().categories.filter((cat) => cat.type === "expense");
  },

  getIncomeCategories: () => {
    return get().categories.filter((cat) => cat.type === "income");
  },

  getCategoryByName: (name: string, type: "income" | "expense") => {
    return get().categories.find((cat) => cat.name === name && cat.type === type);
  },

  getCategoryColor: (name: string) => {
    const category = get().categories.find((cat) => cat.name === name);
    return category?.color || "#64748B";
  },

  getCategoryIcon: (name: string) => {
    const category = get().categories.find((cat) => cat.name === name);
    return category?.icon || "Tag";
  },
}));
