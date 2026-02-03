import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import type { Prisma } from "@prisma/client";

/**
 * Filters for recurring expense queries.
 */
export interface RecurringFilters extends PaginationOptions {
  category?: string;
  isActive?: boolean;
  /** Alias for isActive: true */
  activeOnly?: boolean;
}

/**
 * RecurringExpense type from Prisma.
 */
type RecurringExpense = Prisma.RecurringExpenseGetPayload<object>;

/**
 * Repository for recurring expense data access.
 */
export class RecurringRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "RecurringExpense";

  /**
   * Find a recurring expense by ID with ownership check.
   */
  async findById(id: string, userId: string) {
    const result = await this.db.recurringExpense.findFirst({
      where: { id, userId },
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all recurring expenses for a user.
   */
  async findByUser(userId: string, filters: RecurringFilters = {}) {
    const { category, isActive, activeOnly } = filters;
    // Support both isActive and activeOnly filters
    const activeFilter = activeOnly === true ? true : isActive;

    const where: Prisma.RecurringExpenseWhereInput = {
      userId,
      ...(category && { category }),
      ...(activeFilter !== undefined && { isActive: activeFilter }),
    };

    const results = await this.db.recurringExpense.findMany({
      where,
      orderBy: [{ dueDay: "asc" }, { description: "asc" }],
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Find recurring expenses with pagination.
   */
  async findByUserPaginated(
    userId: string,
    filters: RecurringFilters = {}
  ): Promise<PaginatedResult<RecurringExpense>> {
    const { category, isActive, page = 1, pageSize = 50 } = filters;

    const where: Prisma.RecurringExpenseWhereInput = {
      userId,
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
    };

    const total = await this.db.recurringExpense.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const expenses = await this.db.recurringExpense.findMany({
      where,
      orderBy: [{ dueDay: "asc" }, { description: "asc" }],
      skip,
      take,
    });

    const decrypted = this.decryptMany(expenses as unknown as Record<string, unknown>[]);

    return {
      data: decrypted as unknown as RecurringExpense[],
      pagination,
    };
  }

  /**
   * Get active recurring expenses for a user.
   */
  async getActive(userId: string) {
    const results = await this.db.recurringExpense.findMany({
      where: { userId, isActive: true },
      orderBy: { dueDay: "asc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Get recurring expenses that are due to be launched.
   */
  async getDueForLaunch(userId: string, currentDate: Date) {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get start of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    const results = await this.db.recurringExpense.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { lastLaunchedAt: null },
          { lastLaunchedAt: { lt: startOfMonth } },
        ],
      },
      orderBy: { dueDay: "asc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Create a new recurring expense.
   */
  async create(data: {
    userId: string;
    description: string;
    value: number;
    category: string;
    dueDay?: number;
    isActive?: boolean;
    notes?: string;
  }) {
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.recurringExpense.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Update a recurring expense by ID (with ownership check).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      description: string;
      value: number;
      category: string;
      dueDay: number;
      isActive: boolean;
      notes: string;
      lastLaunchedAt: Date;
    }>
  ) {
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    return this.db.recurringExpense.updateMany({
      where: { id, userId },
      data: encryptedData,
    });
  }

  /**
   * Mark a recurring expense as launched.
   */
  async markAsLaunched(id: string, userId: string) {
    return this.db.recurringExpense.updateMany({
      where: { id, userId },
      data: { lastLaunchedAt: new Date() },
    });
  }

  /**
   * Delete a recurring expense by ID (with ownership check).
   */
  async delete(id: string, userId: string) {
    return this.db.recurringExpense.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Get monthly total of active recurring expenses.
   */
  async getMonthlyTotal(userId: string) {
    const expenses = await this.db.recurringExpense.findMany({
      where: { userId, isActive: true },
    });

    // Decrypt and sum
    const decrypted = this.decryptMany(expenses as unknown as Record<string, unknown>[]) as unknown as typeof expenses;

    return decrypted.reduce((sum, e) => sum + (e.value as unknown as number), 0);
  }

  /**
   * Get category breakdown of recurring expenses.
   */
  async getCategoryBreakdown(userId: string) {
    const expenses = await this.db.recurringExpense.findMany({
      where: { userId, isActive: true },
    });

    // Decrypt and aggregate
    const decrypted = this.decryptMany(expenses as unknown as Record<string, unknown>[]) as unknown as typeof expenses;

    const categoryMap = new Map<string, number>();

    for (const e of decrypted) {
      const existing = categoryMap.get(e.category) || 0;
      categoryMap.set(e.category, existing + (e.value as unknown as number));
    }

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

    return Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }
}

// Singleton instance
export const recurringRepository = new RecurringRepository();
