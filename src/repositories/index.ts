/**
 * Repository Layer
 *
 * Provides a thin abstraction over the database for:
 * - Centralized data access patterns
 * - Reusable query building
 * - Easy testing via dependency injection
 * - Future ORM/database switching
 * - Automatic encryption/decryption of sensitive fields
 *
 * Usage:
 * ```typescript
 * import { transactionRepository, investmentRepository } from "@/repositories";
 *
 * // In a service or route handler
 * const transactions = await transactionRepository.findByUser(userId, {
 *   type: "expense",
 *   startDate: new Date("2024-01-01"),
 * });
 * ```
 */

export { BaseRepository, calculatePagination } from "./base-repository";
export type { PaginationOptions, PaginatedResult } from "./base-repository";

export { TransactionRepository, transactionRepository } from "./transaction-repository";
export type { TransactionFilters, TransactionSummary } from "./transaction-repository";

export { InvestmentRepository, investmentRepository } from "./investment-repository";
export type { InvestmentFilters } from "./investment-repository";

export { CardRepository, cardRepository } from "./card-repository";
export type { CardFilters } from "./card-repository";

export { InvoiceRepository, invoiceRepository } from "./invoice-repository";
export type { InvoiceFilters } from "./invoice-repository";

export { PurchaseRepository, purchaseRepository } from "./purchase-repository";
export type { PurchaseFilters } from "./purchase-repository";

export { BudgetRepository, budgetRepository } from "./budget-repository";
export type { BudgetFilters } from "./budget-repository";

export { RecurringRepository, recurringRepository } from "./recurring-repository";
export type { RecurringFilters } from "./recurring-repository";

export { GoalRepository, goalRepository } from "./goal-repository";
export type { GoalFilters } from "./goal-repository";

export { OperationRepository, operationRepository } from "./operation-repository";
export type { OperationFilters } from "./operation-repository";

export { TemplateRepository, templateRepository } from "./template-repository";
export type { TemplateFilters } from "./template-repository";
