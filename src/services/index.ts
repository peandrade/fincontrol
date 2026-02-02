/**
 * Service Layer
 *
 * Provides business logic abstraction between API routes and repositories.
 *
 * Benefits:
 * - Single responsibility: routes handle HTTP, services handle business logic
 * - Testable: services can be unit tested without HTTP layer
 * - Reusable: same logic can be used by different routes or scheduled jobs
 * - Maintainable: business rules in one place
 *
 * Pattern:
 * ```
 * API Route → Service → Repository → Database
 *     ↓           ↓          ↓
 *   HTTP     Business    Data Access
 *  handling    logic      patterns
 * ```
 *
 * Usage:
 * ```typescript
 * import { transactionService, investmentOperationService } from "@/services";
 *
 * // In a route handler
 * export async function POST(request: Request) {
 *   return withAuth(async (session, req) => {
 *     const body = await req.json();
 *     const result = await transactionService.createTransaction(
 *       session.user.id,
 *       body
 *     );
 *     return NextResponse.json(result, { status: 201 });
 *   });
 * }
 * ```
 *
 * Error Handling:
 * Services throw domain-specific errors (TransactionError, InvestmentOperationError)
 * that routes can catch and convert to appropriate HTTP responses.
 */

export { TransactionService, transactionService, TransactionError } from "./transaction-service";
export type { MonthlyComparison, CreateTransactionData, UpdateTransactionData } from "./transaction-service";

export {
  InvestmentOperationService,
  investmentOperationService,
  InvestmentOperationError,
} from "./investment-operation-service";

export {
  AnalyticsService,
  analyticsService,
} from "./analytics-service";
export type {
  PeriodTotals,
  CategoryTotal,
  MonthlyTrend,
  DashboardSummary,
  HealthScore,
} from "./analytics-service";
