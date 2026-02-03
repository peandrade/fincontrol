import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import type { Prisma } from "@prisma/client";

/**
 * Filters for credit card queries.
 */
export interface CardFilters extends PaginationOptions {
  isActive?: boolean;
  includeInvoices?: boolean;
}

/**
 * Credit card type from Prisma.
 */
type CreditCard = Prisma.CreditCardGetPayload<{ include: { invoices: true } }>;

/**
 * Repository for credit card data access.
 * Note: Prisma extension handles encryption/decryption automatically.
 */
export class CardRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "CreditCard";

  /**
   * Find a credit card by ID with ownership check.
   */
  async findById(id: string, userId: string, includeInvoices = false) {
    return this.db.creditCard.findFirst({
      where: { id, userId },
      include: includeInvoices ? { invoices: { orderBy: [{ year: "desc" }, { month: "desc" }] } } : undefined,
    });
  }

  /**
   * Find all credit cards for a user.
   */
  async findByUser(userId: string, filters: CardFilters = {}) {
    const { isActive, includeInvoices = false } = filters;

    const where: Prisma.CreditCardWhereInput = {
      userId,
      ...(isActive !== undefined && { isActive }),
    };

    return this.db.creditCard.findMany({
      where,
      include: includeInvoices ? { invoices: { orderBy: [{ year: "desc" }, { month: "desc" }] } } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find credit cards with pagination.
   */
  async findByUserPaginated(
    userId: string,
    filters: CardFilters = {}
  ): Promise<PaginatedResult<CreditCard>> {
    const { isActive, page = 1, pageSize = 50, includeInvoices = false } = filters;

    const where: Prisma.CreditCardWhereInput = {
      userId,
      ...(isActive !== undefined && { isActive }),
    };

    const total = await this.db.creditCard.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const cards = await this.db.creditCard.findMany({
      where,
      include: includeInvoices ? { invoices: { orderBy: [{ year: "desc" }, { month: "desc" }] } } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    // Prisma extension handles decryption automatically
    return {
      data: cards as CreditCard[],
      pagination,
    };
  }

  /**
   * Create a new credit card.
   */
  async create(data: {
    userId: string;
    name: string;
    lastDigits?: string;
    limit: number;
    closingDay?: number;
    dueDay?: number;
    color?: string;
  }) {
    // Prisma extension handles encryption on create and decryption on return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.creditCard.create({ data: data as any });
  }

  /**
   * Update a credit card by ID (with ownership check).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      lastDigits: string;
      limit: number;
      closingDay: number;
      dueDay: number;
      color: string;
      isActive: boolean;
    }>
  ) {
    // Prisma extension handles encryption on update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.creditCard.updateMany({
      where: { id, userId },
      data: data as any,
    });
  }

  /**
   * Delete a credit card by ID (with ownership check).
   */
  async delete(id: string, userId: string) {
    return this.db.creditCard.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Get summary of all cards for a user.
   * Prisma extension handles decryption automatically.
   */
  async getSummary(userId: string) {
    const cards = await this.db.creditCard.findMany({
      where: { userId, isActive: true },
      include: {
        invoices: {
          where: { status: { in: ["open", "closed"] } },
        },
      },
    });

    // Prisma extension already decrypted the values
    // TypeScript thinks fields are strings (from schema), but they're numbers after decryption
    let totalLimit = 0;
    let totalUsed = 0;

    for (const card of cards) {
      totalLimit += card.limit as unknown as number;

      for (const invoice of card.invoices) {
        totalUsed += invoice.total as unknown as number;
      }
    }

    return {
      totalCards: cards.length,
      totalLimit,
      totalUsed,
      totalAvailable: totalLimit - totalUsed,
      usagePercentage: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
    };
  }

  /**
   * Find a card by ID with invoices and purchases.
   */
  async findByIdWithPurchases(id: string, userId: string) {
    return this.db.creditCard.findFirst({
      where: { id, userId },
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          include: { purchases: true },
        },
      },
    });
  }
}

// Singleton instance
export const cardRepository = new CardRepository();
