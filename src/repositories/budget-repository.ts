import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import type { Prisma } from "@prisma/client";

/**
 * Filters for budget queries.
 */
export interface BudgetFilters extends PaginationOptions {
  category?: string;
  month?: number;
  year?: number;
  includeFixed?: boolean; // Include fixed budgets (month=0, year=0)
}

/**
 * Budget type from Prisma.
 */
type Budget = Prisma.BudgetGetPayload<object>;

/**
 * Repository for budget data access.
 */
export class BudgetRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "Budget";

  /**
   * Find a budget by ID with ownership check.
   */
  async findById(id: string, userId: string) {
    const result = await this.db.budget.findFirst({
      where: { id, userId },
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find a budget by category and period.
   */
  async findByCategoryAndPeriod(userId: string, category: string, month: number, year: number) {
    const result = await this.db.budget.findUnique({
      where: {
        category_month_year_userId: { category, month, year, userId },
      },
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all budgets for a user.
   */
  async findByUser(userId: string, filters: BudgetFilters = {}) {
    const { category, month, year, includeFixed = true } = filters;

    const where: Prisma.BudgetWhereInput = {
      userId,
      ...(category && { category }),
    };

    // Handle period filtering
    if (month !== undefined && year !== undefined) {
      if (includeFixed) {
        // Include both specific month/year AND fixed budgets
        where.OR = [
          { month, year },
          { month: 0, year: 0 },
        ];
      } else {
        where.month = month;
        where.year = year;
      }
    }

    const results = await this.db.budget.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }],
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Find budgets with pagination.
   */
  async findByUserPaginated(
    userId: string,
    filters: BudgetFilters = {}
  ): Promise<PaginatedResult<Budget>> {
    const { category, month, year, includeFixed = true, page = 1, pageSize = 50 } = filters;

    const where: Prisma.BudgetWhereInput = {
      userId,
      ...(category && { category }),
    };

    if (month !== undefined && year !== undefined) {
      if (includeFixed) {
        where.OR = [
          { month, year },
          { month: 0, year: 0 },
        ];
      } else {
        where.month = month;
        where.year = year;
      }
    }

    const total = await this.db.budget.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const budgets = await this.db.budget.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }],
      skip,
      take,
    });

    const decrypted = this.decryptMany(budgets as unknown as Record<string, unknown>[]);

    return {
      data: decrypted as unknown as Budget[],
      pagination,
    };
  }

  /**
   * Get active budgets for a user (fixed + current month).
   */
  async getActiveBudgets(userId: string, month: number, year: number) {
    const results = await this.db.budget.findMany({
      where: {
        userId,
        OR: [
          { month, year },
          { month: 0, year: 0 }, // Fixed budgets
        ],
      },
      orderBy: { category: "asc" },
    });

    // Decrypt all budgets
    const decrypted = this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;

    // If there's both a fixed and specific budget for a category, use the specific one
    const budgetMap = new Map<string, typeof results[0]>();

    for (const budget of decrypted) {
      const existing = budgetMap.get(budget.category);

      // Prefer specific month/year budget over fixed
      if (!existing || (budget.month !== 0 && budget.year !== 0)) {
        budgetMap.set(budget.category, budget);
      }
    }

    return Array.from(budgetMap.values());
  }

  /**
   * Create a new budget.
   */
  async create(data: {
    userId: string;
    category: string;
    limit: number;
    month?: number;
    year?: number;
  }) {
    const encryptedData = this.encryptData({
      ...data,
      month: data.month ?? 0,
      year: data.year ?? 0,
    } as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.budget.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Update a budget by ID (with ownership check).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      category: string;
      limit: number;
      month: number;
      year: number;
    }>
  ) {
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    return this.db.budget.updateMany({
      where: { id, userId },
      data: encryptedData,
    });
  }

  /**
   * Delete a budget by ID (with ownership check).
   */
  async delete(id: string, userId: string) {
    return this.db.budget.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Get total budget limit for a user in a period.
   */
  async getTotalLimit(userId: string, month: number, year: number) {
    const budgets = await this.getActiveBudgets(userId, month, year);
    return budgets.reduce((sum, b) => sum + (b.limit as unknown as number), 0);
  }
}

// Singleton instance
export const budgetRepository = new BudgetRepository();
