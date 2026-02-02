import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

/**
 * Base repository class providing common data access patterns.
 * All domain repositories should extend this class.
 *
 * Benefits:
 * - Centralized database access
 * - Easy to swap ORM or add caching
 * - Consistent query patterns
 * - Testable via dependency injection
 */
export abstract class BaseRepository {
  protected db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  /**
   * Execute operations within a database transaction.
   * Use for multi-step operations that must be atomic.
   */
  protected async transaction<T>(
    fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
  ): Promise<T> {
    return this.db.$transaction(fn);
  }
}

/**
 * Common filter options for list queries.
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Standard pagination result.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Helper to calculate pagination values.
 */
export function calculatePagination(
  page: number = 1,
  pageSize: number = 50,
  total: number
) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  return {
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize),
      hasMore: safePage * safePageSize < total,
    },
  };
}
