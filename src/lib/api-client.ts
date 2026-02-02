/**
 * API Client
 *
 * Centralized HTTP client for frontend API calls.
 * Separates fetch logic from state management in stores.
 *
 * Benefits:
 * - Single place for request/response handling
 * - Consistent error handling
 * - Easy to add interceptors, caching, retry logic
 * - Testable in isolation
 */

// ============================================
// Types
// ============================================

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

// ============================================
// Base Client
// ============================================

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: `HTTP ${response.status}`,
        code: "HTTP_ERROR",
      };
    }

    throw new ApiClientError(
      errorData.error,
      response.status,
      errorData.code,
      errorData.details
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================
// Transaction API
// ============================================

export interface TransactionFiltersQuery {
  search?: string;
  type?: "income" | "expense";
  categories?: string[];
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
}

function buildTransactionQuery(filters?: TransactionFiltersQuery): string {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  if (filters.categories?.length) params.set("categories", filters.categories.join(","));
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.minValue !== undefined) params.set("minValue", filters.minValue.toString());
  if (filters.maxValue !== undefined) params.set("maxValue", filters.maxValue.toString());

  const query = params.toString();
  return query ? `&${query}` : "";
}

export const transactionApi = {
  getAll: <T>(filters?: TransactionFiltersQuery): Promise<T[]> => {
    const query = buildTransactionQuery(filters);
    return request<T[]>(`/api/transactions?all=true${query}`);
  },

  getPaginated: <T>(
    page = 1,
    pageSize = 50,
    filters?: TransactionFiltersQuery
  ): Promise<PaginatedResponse<T>> => {
    const query = buildTransactionQuery(filters);
    return request<PaginatedResponse<T>>(
      `/api/transactions?page=${page}&pageSize=${pageSize}${query}`
    );
  },

  getById: <T>(id: string): Promise<T> => {
    return request<T>(`/api/transactions/${id}`);
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/transactions/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// Investment API
// ============================================

export const investmentApi = {
  getAll: <T>(): Promise<T[]> => {
    return request<T[]>("/api/investments");
  },

  getById: <T>(id: string): Promise<T> => {
    return request<T>(`/api/investments/${id}`);
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/investments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/investments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/investments/${id}`, {
      method: "DELETE",
    });
  },

  addOperation: <T, D>(investmentId: string, data: D): Promise<T> => {
    return request<T>(`/api/investments/${investmentId}/operations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  refreshQuotes: <T>(): Promise<T> => {
    return request<T>("/api/investments/quotes", {
      method: "POST",
    });
  },

  getYields: <T>(): Promise<T> => {
    return request<T>("/api/investments/yields");
  },

  getAnalytics: <T>(): Promise<T> => {
    return request<T>("/api/investments/analytics");
  },
};

// ============================================
// Card API
// ============================================

export const cardApi = {
  getAll: <T>(): Promise<T[]> => {
    return request<T[]>("/api/cards");
  },

  getById: <T>(id: string): Promise<T> => {
    return request<T>(`/api/cards/${id}`);
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/cards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/cards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/cards/${id}`, {
      method: "DELETE",
    });
  },

  addPurchase: <T, D>(cardId: string, data: D): Promise<T> => {
    return request<T>(`/api/cards/${cardId}/purchases`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAnalytics: <T>(): Promise<T> => {
    return request<T>("/api/cards/analytics");
  },

  updateInvoice: <T, D>(cardId: string, invoiceId: string, data: D): Promise<T> => {
    return request<T>(`/api/cards/${cardId}/invoices/${invoiceId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deletePurchase: (purchaseId: string): Promise<void> => {
    return request<void>(`/api/purchases/${purchaseId}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// Dashboard API
// ============================================

export const dashboardApi = {
  getSummary: <T>(): Promise<T> => {
    return request<T>("/api/dashboard/summary");
  },

  getFinancialHealth: <T>(): Promise<T> => {
    return request<T>("/api/financial-health");
  },

  getWealthEvolution: <T>(period: string): Promise<T> => {
    return request<T>(`/api/wealth-evolution?period=${period}`);
  },

  getAnalytics: <T>(): Promise<T> => {
    return request<T>("/api/analytics");
  },

  getBalance: <T>(): Promise<T> => {
    return request<T>("/api/balance");
  },
};

// ============================================
// Goals API
// ============================================

export const goalsApi = {
  getAll: <T>(): Promise<T[]> => {
    return request<T[]>("/api/goals");
  },

  getById: <T>(id: string): Promise<T> => {
    return request<T>(`/api/goals/${id}`);
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/goals/${id}`, {
      method: "DELETE",
    });
  },

  contribute: <T, D>(goalId: string, data: D): Promise<T> => {
    return request<T>(`/api/goals/${goalId}/contribute`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAnalytics: <T>(): Promise<T> => {
    return request<T>("/api/goals/analytics");
  },
};

// ============================================
// Categories API
// ============================================

export const categoriesApi = {
  getAll: <T>(): Promise<T[]> => {
    return request<T[]>("/api/categories");
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// Templates API
// ============================================

export const templatesApi = {
  getAll: <T>(): Promise<T[]> => {
    return request<T[]>("/api/templates");
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/templates/${id}`, {
      method: "DELETE",
    });
  },

  use: <T>(id: string): Promise<T> => {
    return request<T>(`/api/templates/${id}`, {
      method: "POST",
    });
  },
};

// ============================================
// Budgets API
// ============================================

export const budgetsApi = {
  getAll: <T>(): Promise<T[]> => {
    return request<T[]>("/api/budgets");
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/budgets/${id}`, {
      method: "DELETE",
    });
  },

  getAlerts: <T>(): Promise<T> => {
    return request<T>("/api/budget-alerts");
  },
};

// ============================================
// Recurring Expenses API
// ============================================

export const recurringExpensesApi = {
  getAll: <T>(): Promise<T[]> => {
    return request<T[]>("/api/recurring-expenses");
  },

  create: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/recurring-expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: <T, D>(id: string, data: D): Promise<T> => {
    return request<T>(`/api/recurring-expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<void> => {
    return request<void>(`/api/recurring-expenses/${id}`, {
      method: "DELETE",
    });
  },

  launch: <T, D>(data: D): Promise<T> => {
    return request<T>("/api/recurring-expenses/launch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
