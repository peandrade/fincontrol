/**
 * Data Transfer Objects (DTOs)
 *
 * DTOs define the shape of data flowing between API layers:
 * - Request DTOs: Input validation and typing
 * - Response DTOs: Output formatting and typing
 * - Transformers: Convert between database entities and DTOs
 *
 * Usage:
 * ```typescript
 * import {
 *   CreateTransactionRequest,
 *   TransactionResponse,
 *   toTransactionResponse
 * } from "@/dtos";
 * ```
 *
 * Benefits:
 * - Type-safe API contracts
 * - Clear separation between internal and external data shapes
 * - Centralized response formatting
 * - Easy to version and evolve
 */

// Transaction DTOs
export {
  // Request types
  type CreateTransactionRequest,
  type UpdateTransactionRequest,
  type ListTransactionsQuery,
  // Response types
  type TransactionResponse,
  type TransactionListResponse,
  type MonthlySummaryResponse,
  type MonthlyComparisonResponse,
  type CategoryBreakdownItem,
  type SavingsRateResponse,
  // Transformers
  toTransactionResponse,
  toTransactionListResponse,
} from "./transaction.dto";

// Investment DTOs
export {
  // Request types
  type CreateInvestmentRequest,
  type UpdateInvestmentRequest,
  type CreateOperationRequest,
  type ListInvestmentsQuery,
  // Response types
  type OperationResponse,
  type InvestmentResponse,
  type InvestmentSummaryResponse,
  type InvestmentListResponse,
  type AllocationItem,
  type InvestmentAnalyticsResponse,
  type DividendSummaryResponse,
  type AddOperationResponse,
  // Transformers
  toOperationResponse,
  toInvestmentResponse,
  calculateInvestmentSummary,
} from "./investment.dto";

// Card DTOs
export {
  // Request types
  type CreateCardRequest,
  type UpdateCardRequest,
  type CreatePurchaseRequest,
  type UpdateInvoiceRequest,
  // Response types
  type InvoiceStatus,
  type PurchaseResponse,
  type InvoiceResponse,
  type CardResponse,
  type CardSummaryResponse,
  type CardListResponse,
  type InvoicePreviewItem,
  // Transformers
  toPurchaseResponse,
  toInvoiceResponse,
  toCardResponse,
} from "./card.dto";

// Analytics DTOs
export {
  // Query types
  type AnalyticsQuery,
  type WealthEvolutionQuery,
  // Response types
  type DashboardSummaryResponse,
  type EvolutionDataPoint,
  type MonthlyEvolutionResponse,
  type WealthDataPoint,
  type WealthEvolutionResponse,
  type FinancialHealthResponse,
  type CategoryAnalysisItem,
  type TransactionAnalyticsResponse,
  type CardSpendingByCategory,
  type CardMonthlySpending,
  type CardAlert,
  type CardAnalyticsResponse,
  type GoalProgressItem,
  type GoalsAnalyticsResponse,
  type QuickStatsResponse,
} from "./analytics.dto";

// Common DTOs
export {
  // Pagination
  type PaginationQuery,
  type PaginationMeta,
  type PaginatedResponse,
  // Query types
  type DateRangeQuery,
  type PeriodQuery,
  // Entity responses
  type CategoryResponse,
  type TemplateResponse,
  type BudgetResponse,
  type RecurringExpenseResponse,
  type GoalResponse,
  type GoalContributionResponse,
  // User types
  type UserProfileResponse,
  type UserPreferencesResponse,
  // Standard responses
  type SuccessResponse,
  type ErrorResponse,
  // Bills
  type BillItem,
  type BillsCalendarResponse,
} from "./common.dto";
