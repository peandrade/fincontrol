/**
 * Transaction DTOs
 *
 * Data Transfer Objects for transaction-related API operations.
 * These define the shape of data flowing in and out of API endpoints.
 */

import type { TransactionType } from "@/types";

// ============================================
// Request DTOs
// ============================================

/**
 * Request body for creating a transaction.
 * Validated by createTransactionSchema.
 */
export interface CreateTransactionRequest {
  type: TransactionType;
  value: number;
  category: string;
  description?: string;
  date: string; // ISO date string
}

/**
 * Request body for updating a transaction.
 * All fields are optional.
 */
export interface UpdateTransactionRequest {
  type?: TransactionType;
  value?: number;
  category?: string;
  description?: string | null;
  date?: string;
}

/**
 * Query parameters for listing transactions.
 */
export interface ListTransactionsQuery {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  categories?: string; // Comma-separated
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
  search?: string;
  all?: boolean; // Return all without pagination
}

// ============================================
// Response DTOs
// ============================================

/**
 * Single transaction in API response.
 */
export interface TransactionResponse {
  id: string;
  type: TransactionType;
  value: number;
  category: string;
  description: string | null;
  date: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

/**
 * Response for GET /api/transactions (paginated).
 */
export interface TransactionListResponse {
  data: TransactionResponse[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Monthly summary data.
 */
export interface MonthlySummaryResponse {
  income: number;
  expenses: number;
  balance: number;
}

/**
 * Monthly comparison with previous month.
 */
export interface MonthlyComparisonResponse {
  current: MonthlySummaryResponse;
  previous: MonthlySummaryResponse;
  change: {
    income: number;
    expenses: number;
    balance: number;
    incomePercent: number;
    expensePercent: number;
  };
}

/**
 * Category breakdown item.
 */
export interface CategoryBreakdownItem {
  category: string;
  value: number;
  count: number;
  percentage: number;
}

/**
 * Savings rate calculation.
 */
export interface SavingsRateResponse {
  income: number;
  expenses: number;
  savings: number;
  rate: number; // Percentage
}

// ============================================
// Transformers
// ============================================

/**
 * Transform a database transaction to API response format.
 */
export function toTransactionResponse(transaction: {
  id: string;
  type: string;
  value: number;
  category: string;
  description: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}): TransactionResponse {
  return {
    id: transaction.id,
    type: transaction.type as TransactionType,
    value: transaction.value,
    category: transaction.category,
    description: transaction.description,
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

/**
 * Transform an array of transactions to API response format.
 */
export function toTransactionListResponse(
  transactions: Parameters<typeof toTransactionResponse>[0][],
  pagination: TransactionListResponse["pagination"]
): TransactionListResponse {
  return {
    data: transactions.map(toTransactionResponse),
    pagination,
  };
}
