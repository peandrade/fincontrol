import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { Transaction, TransactionType } from "@/types";

/**
 * Filters for transaction queries.
 */
export interface TransactionFilters extends PaginationOptions {
  type?: TransactionType;
  category?: string;
  categories?: string[];
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
  searchTerm?: string;
}

/**
 * Transaction summary data.
 */
export interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
  count: number;
}

/**
 * Repository for transaction data access.
 * Centralizes all transaction-related database queries.
 */
export class TransactionRepository extends BaseRepository {
  /**
   * Find a transaction by ID with ownership check.
   */
  async findById(id: string, userId: string) {
    return this.db.transaction.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Find all transactions for a user with optional filters.
   */
  async findByUser(userId: string, filters: TransactionFilters = {}) {
    const where = this.buildWhereClause(userId, filters);

    return this.db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    });
  }

  /**
   * Find transactions with pagination.
   */
  async findByUserPaginated(
    userId: string,
    filters: TransactionFilters = {}
  ): Promise<PaginatedResult<Transaction>> {
    const { page = 1, pageSize = 50 } = filters;
    const where = this.buildWhereClause(userId, filters);

    const total = await this.db.transaction.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const transactions = await this.db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take,
    });

    return {
      data: transactions as Transaction[],
      pagination,
    };
  }

  /**
   * Create a new transaction.
   */
  async create(data: {
    userId: string;
    type: TransactionType;
    value: number;
    category: string;
    description?: string;
    date: Date;
  }) {
    return this.db.transaction.create({ data });
  }

  /**
   * Update a transaction by ID (with ownership check).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      type: TransactionType;
      value: number;
      category: string;
      description: string;
      date: Date;
    }>
  ) {
    return this.db.transaction.updateMany({
      where: { id, userId },
      data,
    });
  }

  /**
   * Delete a transaction by ID (with ownership check).
   */
  async delete(id: string, userId: string) {
    return this.db.transaction.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Get monthly summary for a user.
   */
  async getMonthlySummary(userId: string, year: number, month: number): Promise<TransactionSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await this.db.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      select: { type: true, value: true },
    });

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.value, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.value, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      count: transactions.length,
    };
  }

  /**
   * Get the current balance (all-time income - expenses).
   */
  async getBalance(userId: string): Promise<number> {
    const result = await this.db.$queryRaw<{ income: number; expenses: number }[]>`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN value ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE "userId" = ${userId}
    `;

    const { income = 0, expenses = 0 } = result[0] || {};
    return Number(income) - Number(expenses);
  }

  /**
   * Get category breakdown for a period.
   */
  async getCategoryBreakdown(
    userId: string,
    type: TransactionType,
    startDate: Date,
    endDate: Date
  ) {
    return this.db.transaction.groupBy({
      by: ["category"],
      where: {
        userId,
        type,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { value: true },
      _count: true,
      orderBy: { _sum: { value: "desc" } },
    });
  }

  /**
   * Build where clause from filters.
   */
  private buildWhereClause(userId: string, filters: TransactionFilters) {
    const {
      type,
      category,
      categories,
      startDate,
      endDate,
      minValue,
      maxValue,
      searchTerm,
    } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    // Support both single category and multiple categories
    if (categories && categories.length > 0) {
      where.category = { in: categories };
    } else if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {};
      if (minValue !== undefined) where.value.gte = minValue;
      if (maxValue !== undefined) where.value.lte = maxValue;
    }

    if (searchTerm) {
      where.OR = [
        { description: { contains: searchTerm, mode: "insensitive" } },
        { category: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    return where;
  }
}

// Singleton instance for convenience
export const transactionRepository = new TransactionRepository();
