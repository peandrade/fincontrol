import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { Investment, InvestmentType } from "@/types";
import type { Prisma } from "@prisma/client";

/**
 * Filters for investment queries.
 */
export interface InvestmentFilters extends PaginationOptions {
  type?: InvestmentType;
  includeOperations?: boolean;
}

/**
 * Repository for investment data access.
 * Centralizes all investment-related database queries.
 */
export class InvestmentRepository extends BaseRepository {
  /**
   * Find an investment by ID with ownership check.
   * Returns null if not found or not owned by user.
   */
  async findById(id: string, userId: string, includeOperations = false) {
    return this.db.investment.findFirst({
      where: { id, userId },
      include: includeOperations ? { operations: { orderBy: { date: "desc" } } } : undefined,
    });
  }

  /**
   * Find all investments for a user with optional filters.
   */
  async findByUser(userId: string, filters: InvestmentFilters = {}) {
    const { type, includeOperations = false } = filters;

    const where: Prisma.InvestmentWhereInput = {
      userId,
      ...(type && { type }),
    };

    return this.db.investment.findMany({
      where,
      include: includeOperations ? { operations: { orderBy: { date: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find investments with pagination.
   */
  async findByUserPaginated(
    userId: string,
    filters: InvestmentFilters = {}
  ): Promise<PaginatedResult<Investment>> {
    const { type, page = 1, pageSize = 50, includeOperations = false } = filters;

    const where: Prisma.InvestmentWhereInput = {
      userId,
      ...(type && { type }),
    };

    const total = await this.db.investment.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const investments = await this.db.investment.findMany({
      where,
      include: includeOperations ? { operations: { orderBy: { date: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: investments as Investment[],
      pagination,
    };
  }

  /**
   * Create a new investment.
   */
  async create(data: Prisma.InvestmentUncheckedCreateInput) {
    return this.db.investment.create({ data });
  }

  /**
   * Update an investment by ID (with ownership check).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      ticker: string;
      institution: string;
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
      notes: string;
    }>
  ) {
    return this.db.investment.updateMany({
      where: { id, userId },
      data,
    });
  }

  /**
   * Delete an investment by ID (with ownership check).
   */
  async delete(id: string, userId: string) {
    return this.db.investment.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Get investment summary for a user.
   */
  async getSummary(userId: string) {
    const investments = await this.db.investment.findMany({
      where: { userId },
      select: {
        totalInvested: true,
        currentValue: true,
        profitLoss: true,
        type: true,
      },
    });

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

  /**
   * Add an operation to an investment and update its metrics.
   */
  async addOperationWithUpdate(
    investmentId: string,
    operationData: {
      type: string;
      quantity: number;
      price: number;
      total: number;
      date: Date;
      fees: number;
      notes?: string;
    },
    investmentUpdate: {
      quantity: number;
      averagePrice: number;
      currentPrice: number;
      totalInvested: number;
      currentValue: number;
      profitLoss: number;
      profitLossPercent: number;
    }
  ) {
    return this.transaction(async (tx) => {
      // Create the operation
      const operation = await tx.operation.create({
        data: {
          investmentId,
          ...operationData,
        },
      });

      // Update the investment metrics
      await tx.investment.update({
        where: { id: investmentId },
        data: investmentUpdate,
      });

      // Return updated investment with operations
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: { operations: { orderBy: { date: "desc" } } },
      });

      return { operation, investment };
    });
  }
}

// Singleton instance for convenience
export const investmentRepository = new InvestmentRepository();
