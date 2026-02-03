import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import type { Prisma } from "@prisma/client";
import type { OperationType } from "@/types";

/**
 * Filters for operation queries.
 */
export interface OperationFilters extends PaginationOptions {
  investmentId?: string;
  type?: OperationType | OperationType[];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Operation type from Prisma.
 */
type Operation = Prisma.OperationGetPayload<{ include: { investment: true } }>;

/**
 * Repository for investment operation data access.
 */
export class OperationRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "Operation";

  /**
   * Find an operation by ID.
   */
  async findById(id: string, includeInvestment = false) {
    const result = await this.db.operation.findUnique({
      where: { id },
      include: includeInvestment ? { investment: true } : undefined,
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all operations for an investment.
   */
  async findByInvestment(investmentId: string, filters: OperationFilters = {}) {
    const { type, startDate, endDate } = filters;

    const where: Prisma.OperationWhereInput = {
      investmentId,
      ...(type && { type: Array.isArray(type) ? { in: type } : type }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const results = await this.db.operation.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Find operations with pagination.
   */
  async findByInvestmentPaginated(
    investmentId: string,
    filters: OperationFilters = {}
  ): Promise<PaginatedResult<Operation>> {
    const { type, startDate, endDate, page = 1, pageSize = 50 } = filters;

    const where: Prisma.OperationWhereInput = {
      investmentId,
      ...(type && { type: Array.isArray(type) ? { in: type } : type }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const total = await this.db.operation.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const operations = await this.db.operation.findMany({
      where,
      include: { investment: true },
      orderBy: { date: "desc" },
      skip,
      take,
    });

    const decrypted = this.decryptMany(operations as unknown as Record<string, unknown>[]);

    return {
      data: decrypted as unknown as Operation[],
      pagination,
    };
  }

  /**
   * Find all operations for a user (across all investments).
   */
  async findByUser(userId: string, filters: OperationFilters = {}) {
    const { type, startDate, endDate } = filters;

    const where: Prisma.OperationWhereInput = {
      investment: { userId },
      ...(type && { type: Array.isArray(type) ? { in: type } : type }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const results = await this.db.operation.findMany({
      where,
      include: { investment: true },
      orderBy: { date: "desc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Create a new operation.
   */
  async create(data: {
    investmentId: string;
    type: string;
    quantity: number;
    price: number;
    total: number;
    date: Date;
    fees?: number;
    notes?: string;
  }) {
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.operation.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Update an operation.
   */
  async update(
    id: string,
    data: Partial<{
      type: string;
      quantity: number;
      price: number;
      total: number;
      date: Date;
      fees: number;
      notes: string;
    }>
  ) {
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    const result = await this.db.operation.update({
      where: { id },
      data: encryptedData,
    });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Delete an operation.
   */
  async delete(id: string) {
    return this.db.operation.delete({
      where: { id },
    });
  }

  /**
   * Get dividends for a user in a period.
   */
  async getDividends(userId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.OperationWhereInput = {
      investment: { userId },
      type: "dividend",
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const results = await this.db.operation.findMany({
      where,
      include: { investment: { select: { name: true, ticker: true, type: true } } },
      orderBy: { date: "desc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Get total invested value for a user in a period.
   */
  async getTotalInvested(userId: string, startDate?: Date, endDate?: Date) {
    const operations = await this.db.operation.findMany({
      where: {
        investment: { userId },
        type: { in: ["buy", "deposit"] },
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
    });

    // Decrypt and sum
    const decrypted = this.decryptMany(operations as unknown as Record<string, unknown>[]) as unknown as typeof operations;

    return decrypted.reduce((sum, op) => sum + (op.total as unknown as number), 0);
  }

  /**
   * Get total withdrawn value for a user in a period.
   */
  async getTotalWithdrawn(userId: string, startDate?: Date, endDate?: Date) {
    const operations = await this.db.operation.findMany({
      where: {
        investment: { userId },
        type: { in: ["sell", "withdraw"] },
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
    });

    // Decrypt and sum
    const decrypted = this.decryptMany(operations as unknown as Record<string, unknown>[]) as unknown as typeof operations;

    return decrypted.reduce((sum, op) => sum + (op.total as unknown as number), 0);
  }

  /**
   * Get monthly operation totals for a user.
   */
  async getMonthlyTotals(userId: string, startDate: Date, endDate: Date) {
    const operations = await this.db.operation.findMany({
      where: {
        investment: { userId },
        date: { gte: startDate, lte: endDate },
      },
    });

    // Decrypt values
    const decrypted = this.decryptMany(operations as unknown as Record<string, unknown>[]) as unknown as typeof operations;

    // Group by month
    const monthlyMap = new Map<string, { invested: number; withdrawn: number; dividends: number }>();

    for (const op of decrypted) {
      const date = new Date(op.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthlyMap.get(monthKey) || { invested: 0, withdrawn: 0, dividends: 0 };

      if (op.type === "buy" || op.type === "deposit") {
        existing.invested += op.total as unknown as number;
      } else if (op.type === "sell" || op.type === "withdraw") {
        existing.withdrawn += op.total as unknown as number;
      } else if (op.type === "dividend") {
        existing.dividends += op.total as unknown as number;
      }

      monthlyMap.set(monthKey, existing);
    }

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}

// Singleton instance
export const operationRepository = new OperationRepository();
