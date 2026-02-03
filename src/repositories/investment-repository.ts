import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { Investment, InvestmentType } from "@/types";
import type { Prisma } from "@prisma/client";
import type { EncryptedModel } from "@/lib/encryption";
import { decryptRecord, encryptRecord } from "@/lib/encryption";

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
  protected readonly modelName: EncryptedModel = "Investment";
  /**
   * Decrypt an investment and its operations if present.
   */
  private decryptInvestmentWithOperations<T extends Record<string, unknown>>(investment: T): T {
    const decrypted = this.decryptData(investment) as Record<string, unknown>;

    // Also decrypt operations if present
    if (decrypted.operations && Array.isArray(decrypted.operations)) {
      decrypted.operations = (decrypted.operations as Record<string, unknown>[]).map((op) =>
        decryptRecord(op, "Operation")
      );
    }

    return decrypted as T;
  }

  /**
   * Find an investment by ID with ownership check.
   * Returns null if not found or not owned by user.
   */
  async findById(id: string, userId: string, includeOperations = false) {
    const result = await this.db.investment.findFirst({
      where: { id, userId },
      include: includeOperations ? { operations: { orderBy: { date: "desc" } } } : undefined,
    });

    if (!result) return null;

    return this.decryptInvestmentWithOperations(result as unknown as Record<string, unknown>) as unknown as typeof result;
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

    const results = await this.db.investment.findMany({
      where,
      include: includeOperations ? { operations: { orderBy: { date: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return results.map((r) =>
      this.decryptInvestmentWithOperations(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
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

    const decrypted = investments.map((r) =>
      this.decryptInvestmentWithOperations(r as unknown as Record<string, unknown>)
    );

    return {
      data: decrypted as unknown as Investment[],
      pagination,
    };
  }

  /**
   * Create a new investment.
   */
  async create(data: {
    type: string;
    name: string;
    ticker?: string;
    institution?: string;
    notes?: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    totalInvested: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    interestRate?: number | null;
    indexer?: string | null;
    maturityDate?: Date | null;
    goalValue?: number | null;
    userId: string;
  }) {
    // Encrypt sensitive fields before saving
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.investment.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Add an operation to an investment.
   */
  async addOperation(
    investmentId: string,
    userId: string,
    data: {
      type: string;
      quantity: number;
      price: number;
      total: number;
      date: Date;
      fees: number;
      notes?: string;
    }
  ) {
    // Verify ownership
    const investment = await this.db.investment.findFirst({
      where: { id: investmentId, userId },
    });

    if (!investment) {
      throw new Error("Investment not found");
    }

    // Encrypt operation data
    const encryptedOpData = encryptRecord(
      { investmentId, ...data } as Record<string, unknown>,
      "Operation"
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const operation = await this.db.operation.create({
      data: encryptedOpData as any,
    });

    // Decrypt before returning
    const decryptedOperation = decryptRecord(
      operation as unknown as Record<string, unknown>,
      "Operation"
    );

    return decryptedOperation as unknown as typeof operation;
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
    // Encrypt sensitive fields in update data
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    return this.db.investment.updateMany({
      where: { id, userId },
      data: encryptedData,
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
   * Uses app-level aggregation to support encrypted values.
   */
  async getSummary(userId: string) {
    const investments = await this.db.investment.findMany({
      where: { userId },
    });

    // Decrypt values
    const decrypted = this.decryptMany(investments as unknown as Record<string, unknown>[]) as unknown as typeof investments;

    const totalInvested = decrypted.reduce((sum, inv) => sum + (inv.totalInvested as unknown as number), 0);
    const currentValue = decrypted.reduce((sum, inv) => sum + (inv.currentValue as unknown as number), 0);
    const profitLoss = decrypted.reduce((sum, inv) => sum + (inv.profitLoss as unknown as number), 0);

    return {
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercent: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
      totalAssets: investments.length,
    };
  }

  /**
   * Find investments by type with optional ticker filter.
   */
  async findByType(userId: string, types: string[], options: { withTicker?: boolean; includeOperations?: boolean } = {}) {
    const { withTicker = false, includeOperations = false } = options;

    const results = await this.db.investment.findMany({
      where: {
        userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: { in: types as any },
        ...(withTicker && { ticker: { not: null } }),
      },
      include: includeOperations ? { operations: { orderBy: { date: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return results.map((r) =>
      this.decryptInvestmentWithOperations(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
  }

  /**
   * Update investment by ID (without ownership check - use when already verified).
   */
  async updateById(
    id: string,
    data: Partial<{
      currentPrice: number;
      currentValue: number;
      profitLoss: number;
      profitLossPercent: number;
    }>
  ) {
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    const result = await this.db.investment.update({
      where: { id },
      data: encryptedData,
    });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
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
    // Encrypt operation data
    const encryptedOpData = encryptRecord(
      { investmentId, ...operationData } as Record<string, unknown>,
      "Operation"
    );

    // Encrypt investment update data
    const encryptedInvUpdate = this.encryptData(investmentUpdate as Record<string, unknown>);

    return this.transaction(async (tx) => {
      // Create the operation with encrypted data
      const operation = await tx.operation.create({
        data: encryptedOpData as typeof operationData & { investmentId: string },
      });

      // Update the investment metrics with encrypted data
      await tx.investment.update({
        where: { id: investmentId },
        data: encryptedInvUpdate as typeof investmentUpdate,
      });

      // Return updated investment with operations
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: { operations: { orderBy: { date: "desc" } } },
      });

      // Decrypt before returning
      const decryptedOperation = decryptRecord(operation as unknown as Record<string, unknown>, "Operation");
      const decryptedInvestment = investment
        ? this.decryptInvestmentWithOperations(investment as unknown as Record<string, unknown>)
        : null;

      return {
        operation: decryptedOperation as unknown as typeof operation,
        investment: decryptedInvestment as unknown as typeof investment,
      };
    });
  }
}

// Singleton instance for convenience
export const investmentRepository = new InvestmentRepository();
