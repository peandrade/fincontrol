import { NextRequest, NextResponse } from "next/server";
import { createTransactionSchema, validateBody } from "@/lib/schemas";
import {
  withAuth,
  getPaginationParams,
  paginatedResponse,
  errorResponse,
  invalidateTransactionCache,
} from "@/lib/api-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { transactionService } from "@/services";
import type { TransactionFilters } from "@/repositories";
import type { TransactionType } from "@/types";

/**
 * Parse query parameters into TransactionFilters.
 */
function parseFilters(searchParams: URLSearchParams): TransactionFilters {
  const filters: TransactionFilters = {};

  // Type filter (income/expense)
  const type = searchParams.get("type");
  if (type === "income" || type === "expense") {
    filters.type = type as TransactionType;
  }

  // Category filter (comma-separated list)
  const categories = searchParams.get("categories");
  if (categories) {
    const categoryList = categories.split(",").filter(Boolean);
    if (categoryList.length > 0) {
      filters.categories = categoryList;
    }
  }

  // Date range filter
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate) {
    filters.startDate = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filters.endDate = end;
  }

  // Value range filter
  const minValue = searchParams.get("minValue");
  const maxValue = searchParams.get("maxValue");
  if (minValue) {
    filters.minValue = parseFloat(minValue);
  }
  if (maxValue) {
    filters.maxValue = parseFloat(maxValue);
  }

  // Search filter
  const search = searchParams.get("search");
  if (search) {
    filters.searchTerm = search;
  }

  return filters;
}

/**
 * GET /api/transactions
 *
 * List transactions with optional filters and pagination.
 * Use ?all=true for backward compatibility (returns all without pagination).
 */
export async function GET(request: NextRequest) {
  return withAuth(async (session) => {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const userId = session.user.id;

    // Parse filters from query parameters
    const filters = parseFilters(searchParams);

    // If all=true, return all matching transactions (backward compatibility)
    if (all) {
      const transactions = await transactionService.getTransactions(userId, filters);
      return NextResponse.json(transactions);
    }

    // Paginated response
    const { page, pageSize } = getPaginationParams(request.url);
    const result = await transactionService.getTransactionsPaginated(userId, {
      ...filters,
      page,
      pageSize,
    });

    return paginatedResponse(
      result.data,
      result.pagination.page,
      result.pagination.pageSize,
      result.pagination.total
    );
  });
}

/**
 * POST /api/transactions
 *
 * Create a new transaction.
 * Rate limited to 30 mutations per minute.
 */
export async function POST(request: Request) {
  // Rate limiting - 30 mutations per minute
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.mutation,
    identifier: "transactions",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createTransactionSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400, "VALIDATION_ERROR", validation.details);
    }

    const { type, value, category, description, date } = validation.data;

    // Delegate to service (handles date parsing internally)
    const transaction = await transactionService.createTransaction(
      session.user.id,
      {
        type,
        value,
        category,
        description: description || undefined,
        date,
      }
    );

    // Invalidate related caches
    invalidateTransactionCache(session.user.id);

    return NextResponse.json(transaction, { status: 201 });
  }, request);
}
