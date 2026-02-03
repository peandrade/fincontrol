import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { Transaction, TransactionType } from "@/types";
import type { EncryptedModel } from "@/lib/encryption";

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
  protected readonly modelName: EncryptedModel = "Transaction";
  /**
   * Find a transaction by ID with ownership check.
   */
  async findById(id: string, userId: string) {
    const result = await this.db.transaction.findFirst({
      where: { id, userId },
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all transactions for a user with optional filters.
   */
  async findByUser(userId: string, filters: TransactionFilters = {}) {
    const where = this.buildWhereClause(userId, filters);

    const results = await this.db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
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

    const decrypted = this.decryptMany(transactions as unknown as Record<string, unknown>[]);

    return {
      data: decrypted as unknown as Transaction[],
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
    // Encrypt sensitive fields before saving
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.transaction.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
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
    // Encrypt sensitive fields in update data
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    return this.db.transaction.updateMany({
      where: { id, userId },
      data: encryptedData,
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
   * Uses app-level aggregation to support encrypted values.
   */
  async getMonthlySummary(userId: string, year: number, month: number): Promise<TransactionSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await this.db.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    // Decrypt values if encryption is enabled
    const decrypted = this.decryptMany(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

    const income = decrypted
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.value as unknown as number), 0);

    const expenses = decrypted
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.value as unknown as number), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      count: transactions.length,
    };
  }

  /**
   * Get the current balance (all-time income - expenses).
   * Uses app-level aggregation to support encrypted values.
   */
  async getBalance(userId: string): Promise<number> {
    // Fetch all transactions
    const transactions = await this.db.transaction.findMany({
      where: { userId },
    });

    // Decrypt and calculate
    const decrypted = this.decryptMany(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

    let income = 0;
    let expenses = 0;

    for (const t of decrypted) {
      if (t.type === "income") {
        income += t.value as unknown as number;
      } else if (t.type === "expense") {
        expenses += t.value as unknown as number;
      }
    }

    return income - expenses;
  }

  /**
   * Get category breakdown for a period.
   * Uses app-level aggregation to support encrypted values.
   */
  async getCategoryBreakdown(
    userId: string,
    type: TransactionType,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await this.db.transaction.findMany({
      where: {
        userId,
        type,
        date: { gte: startDate, lte: endDate },
      },
    });

    // Decrypt and aggregate by category
    const decrypted = this.decryptMany(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

    const categoryMap = new Map<string, { sum: number; count: number }>();

    for (const t of decrypted) {
      const existing = categoryMap.get(t.category) || { sum: 0, count: 0 };
      existing.sum += t.value as unknown as number;
      existing.count += 1;
      categoryMap.set(t.category, existing);
    }

    // Convert to array format similar to groupBy result
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        _sum: { value: data.sum },
        _count: data.count,
      }))
      .sort((a, b) => (b._sum.value || 0) - (a._sum.value || 0));
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
