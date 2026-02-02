/**
 * Investment DTOs
 *
 * Data Transfer Objects for investment-related API operations.
 */

import type { InvestmentType, OperationType, IndexerType } from "@/types";

// ============================================
// Request DTOs
// ============================================

/**
 * Request body for creating an investment.
 */
export interface CreateInvestmentRequest {
  type: InvestmentType;
  name: string;
  ticker?: string;
  institution?: string;
  goalValue?: number;
  notes?: string;
  interestRate?: number;
  indexer?: IndexerType;
  maturityDate?: string;
  initialDeposit?: number;
  depositDate?: string;
  skipBalanceCheck?: boolean;
}

/**
 * Request body for updating an investment.
 */
export interface UpdateInvestmentRequest {
  name?: string;
  ticker?: string;
  institution?: string;
  currentPrice?: number;
  currentValue?: number;
  totalInvested?: number;
  goalValue?: number | null;
  notes?: string;
  interestRate?: number | null;
  indexer?: IndexerType | null;
  maturityDate?: string | null;
  noMaturity?: boolean;
}

/**
 * Request body for adding an operation.
 */
export interface CreateOperationRequest {
  type: OperationType;
  quantity?: number;
  price?: number;
  total?: number;
  date: string;
  fees?: number;
  notes?: string;
  skipBalanceCheck?: boolean;
}

/**
 * Query parameters for listing investments.
 */
export interface ListInvestmentsQuery {
  type?: InvestmentType;
  includeOperations?: boolean;
}

// ============================================
// Response DTOs
// ============================================

/**
 * Operation in API response.
 */
export interface OperationResponse {
  id: string;
  investmentId: string;
  type: OperationType;
  quantity: number;
  price: number;
  total: number;
  date: string;
  fees: number;
  notes: string | null;
  createdAt: string;
}

/**
 * Single investment in API response.
 */
export interface InvestmentResponse {
  id: string;
  type: InvestmentType;
  name: string;
  ticker: string | null;
  institution: string | null;

  quantity: number;
  averagePrice: number;
  currentPrice: number;

  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;

  interestRate: number | null;
  indexer: IndexerType | null;
  maturityDate: string | null;

  goalValue: number | null;
  notes: string | null;

  createdAt: string;
  updatedAt: string;

  operations?: OperationResponse[];
}

/**
 * Investment summary totals.
 */
export interface InvestmentSummaryResponse {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  totalAssets: number;
}

/**
 * Investment list with summary.
 */
export interface InvestmentListResponse {
  data: InvestmentResponse[];
  summary: InvestmentSummaryResponse;
}

/**
 * Allocation breakdown by type.
 */
export interface AllocationItem {
  type: InvestmentType;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

/**
 * Investment analytics response.
 */
export interface InvestmentAnalyticsResponse {
  summary: InvestmentSummaryResponse;
  allocation: AllocationItem[];
  monthlyEvolution: {
    month: string;
    value: number;
    invested: number;
    profitLoss: number;
  }[];
}

/**
 * Dividend summary.
 */
export interface DividendSummaryResponse {
  total: number;
  count: number;
  byInvestment: {
    investmentId: string;
    investmentName: string;
    ticker: string | null;
    total: number;
    count: number;
  }[];
  byMonth: {
    month: string;
    total: number;
  }[];
}

/**
 * Response after adding an operation.
 */
export interface AddOperationResponse {
  operation: OperationResponse;
  investment: InvestmentResponse;
}

// ============================================
// Transformers
// ============================================

/**
 * Transform a database operation to API response format.
 */
export function toOperationResponse(operation: {
  id: string;
  investmentId: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  date: Date;
  fees: number;
  notes: string | null;
  createdAt: Date;
}): OperationResponse {
  return {
    id: operation.id,
    investmentId: operation.investmentId,
    type: operation.type as OperationType,
    quantity: operation.quantity,
    price: operation.price,
    total: operation.total,
    date: operation.date.toISOString(),
    fees: operation.fees,
    notes: operation.notes,
    createdAt: operation.createdAt.toISOString(),
  };
}

/**
 * Transform a database investment to API response format.
 */
export function toInvestmentResponse(investment: {
  id: string;
  type: string;
  name: string;
  ticker: string | null;
  institution: string | null;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  interestRate: number | null;
  indexer: string | null;
  maturityDate: Date | null;
  goalValue: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  operations?: Parameters<typeof toOperationResponse>[0][];
}): InvestmentResponse {
  return {
    id: investment.id,
    type: investment.type as InvestmentType,
    name: investment.name,
    ticker: investment.ticker,
    institution: investment.institution,
    quantity: investment.quantity,
    averagePrice: investment.averagePrice,
    currentPrice: investment.currentPrice,
    totalInvested: investment.totalInvested,
    currentValue: investment.currentValue,
    profitLoss: investment.profitLoss,
    profitLossPercent: investment.profitLossPercent,
    interestRate: investment.interestRate,
    indexer: investment.indexer as IndexerType | null,
    maturityDate: investment.maturityDate?.toISOString() ?? null,
    goalValue: investment.goalValue,
    notes: investment.notes,
    createdAt: investment.createdAt.toISOString(),
    updatedAt: investment.updatedAt.toISOString(),
    operations: investment.operations?.map(toOperationResponse),
  };
}

/**
 * Calculate investment summary from array.
 */
export function calculateInvestmentSummary(
  investments: { totalInvested: number; currentValue: number; profitLoss: number }[]
): InvestmentSummaryResponse {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
  const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const profitLoss = investments.reduce((sum, inv) => sum + inv.profitLoss, 0);

  return {
    totalInvested,
    currentValue,
    profitLoss,
    profitLossPercent: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
    totalAssets: investments.length,
  };
}
