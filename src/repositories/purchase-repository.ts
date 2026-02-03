import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import type { Prisma } from "@prisma/client";

/**
 * Filters for purchase queries.
 */
export interface PurchaseFilters extends PaginationOptions {
  invoiceId?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  isRecurring?: boolean;
}

/**
 * Purchase type from Prisma.
 */
type Purchase = Prisma.PurchaseGetPayload<{ include: { invoice: true } }>;

/**
 * Repository for purchase data access.
 */
export class PurchaseRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "Purchase";

  /**
   * Find a purchase by ID.
   */
  async findById(id: string, includeInvoice = false) {
    const result = await this.db.purchase.findUnique({
      where: { id },
      include: includeInvoice ? { invoice: { include: { creditCard: true } } } : undefined,
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all purchases for an invoice.
   */
  async findByInvoice(invoiceId: string, filters: PurchaseFilters = {}) {
    const { category, startDate, endDate, isRecurring } = filters;

    const where: Prisma.PurchaseWhereInput = {
      invoiceId,
      ...(category && { category }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const results = await this.db.purchase.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Find purchases with pagination.
   */
  async findByInvoicePaginated(
    invoiceId: string,
    filters: PurchaseFilters = {}
  ): Promise<PaginatedResult<Purchase>> {
    const { category, startDate, endDate, isRecurring, page = 1, pageSize = 50 } = filters;

    const where: Prisma.PurchaseWhereInput = {
      invoiceId,
      ...(category && { category }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const total = await this.db.purchase.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const purchases = await this.db.purchase.findMany({
      where,
      include: { invoice: { include: { creditCard: true } } },
      orderBy: { date: "desc" },
      skip,
      take,
    });

    const decrypted = this.decryptMany(purchases as unknown as Record<string, unknown>[]);

    return {
      data: decrypted as unknown as Purchase[],
      pagination,
    };
  }

  /**
   * Create a new purchase.
   */
  async create(data: {
    invoiceId: string;
    description: string;
    value: number;
    totalValue: number;
    category: string;
    date: Date;
    installments?: number;
    currentInstallment?: number;
    isRecurring?: boolean;
    parentPurchaseId?: string;
    notes?: string;
  }) {
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.purchase.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Create multiple purchases (for installments).
   */
  async createMany(
    purchases: Array<{
      invoiceId: string;
      description: string;
      value: number;
      totalValue: number;
      category: string;
      date: Date;
      installments: number;
      currentInstallment: number;
      isRecurring?: boolean;
      parentPurchaseId?: string;
      notes?: string;
    }>
  ) {
    const encryptedPurchases = purchases.map((p) =>
      this.encryptData(p as unknown as Record<string, unknown>)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.purchase.createMany({
      data: encryptedPurchases as any,
    });
  }

  /**
   * Update a purchase.
   */
  async update(
    id: string,
    data: Partial<{
      description: string;
      value: number;
      totalValue: number;
      category: string;
      date: Date;
      notes: string;
    }>
  ) {
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    const result = await this.db.purchase.update({
      where: { id },
      data: encryptedData,
    });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Delete a purchase.
   */
  async delete(id: string) {
    return this.db.purchase.delete({
      where: { id },
    });
  }

  /**
   * Delete all installments of a purchase.
   */
  async deleteInstallments(parentPurchaseId: string) {
    return this.db.purchase.deleteMany({
      where: { parentPurchaseId },
    });
  }

  /**
   * Find all purchases for a user across all cards.
   */
  async findByUser(userId: string, filters: PurchaseFilters = {}) {
    const { category, startDate, endDate, isRecurring } = filters;

    const where: Prisma.PurchaseWhereInput = {
      invoice: {
        creditCard: { userId },
      },
      ...(category && { category }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const results = await this.db.purchase.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Find purchases with card info for analytics.
   */
  async findByUserWithCardInfo(userId: string, filters: PurchaseFilters = {}) {
    const { startDate, endDate } = filters;

    const results = await this.db.purchase.findMany({
      where: {
        invoice: {
          creditCard: { userId, isActive: true },
        },
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      include: {
        invoice: {
          include: {
            creditCard: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Get category breakdown for a user across all cards.
   */
  async getCategoryBreakdownByUser(userId: string, startDate: Date, endDate: Date) {
    const purchases = await this.db.purchase.findMany({
      where: {
        invoice: {
          creditCard: { userId },
        },
        date: { gte: startDate, lte: endDate },
      },
    });

    // Decrypt and aggregate by category
    const decrypted = this.decryptMany(purchases as unknown as Record<string, unknown>[]) as unknown as typeof purchases;

    const categoryMap = new Map<string, { sum: number; count: number }>();

    for (const p of decrypted) {
      const existing = categoryMap.get(p.category) || { sum: 0, count: 0 };
      existing.sum += p.value as unknown as number;
      existing.count += 1;
      categoryMap.set(p.category, existing);
    }

    const totalSum = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.sum, 0);

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.sum,
        count: data.count,
        percentage: totalSum > 0 ? (data.sum / totalSum) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }
}

// Singleton instance
export const purchaseRepository = new PurchaseRepository();
