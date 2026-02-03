import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel, Decrypted, CardWithDecryptedInvoicesAndPurchases } from "@/lib/encryption";
import { decryptNested, NESTED_CONFIGS } from "@/lib/encryption";
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
 */
export class CardRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "CreditCard";

  /**
   * Decrypt a card and its nested relations (invoices and purchases).
   * Uses the nested decryption helper for proper recursive decryption.
   */
  private decryptCardWithRelations<T extends Record<string, unknown>>(
    card: T,
    includesPurchases = false
  ): T {
    const config = includesPurchases
      ? NESTED_CONFIGS.CardWithInvoicesAndPurchases
      : NESTED_CONFIGS.CardWithInvoices;

    return decryptNested(card, config);
  }

  /**
   * Decrypt a card and its invoices if present.
   * @deprecated Use decryptCardWithRelations instead for proper nested decryption
   */
  private decryptCardWithInvoices<T extends Record<string, unknown>>(card: T): T {
    return this.decryptCardWithRelations(card, false);
  }

  /**
   * Find a credit card by ID with ownership check.
   */
  async findById(id: string, userId: string, includeInvoices = false) {
    const result = await this.db.creditCard.findFirst({
      where: { id, userId },
      include: includeInvoices ? { invoices: { orderBy: { year: "desc", month: "desc" } } } : undefined,
    });

    if (!result) return null;

    return this.decryptCardWithInvoices(result as unknown as Record<string, unknown>) as unknown as typeof result;
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

    const results = await this.db.creditCard.findMany({
      where,
      include: includeInvoices ? { invoices: { orderBy: { year: "desc", month: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return results.map((r) =>
      this.decryptCardWithInvoices(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
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
      include: includeInvoices ? { invoices: { orderBy: { year: "desc", month: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    const decrypted = cards.map((r) =>
      this.decryptCardWithInvoices(r as unknown as Record<string, unknown>)
    );

    return {
      data: decrypted as unknown as CreditCard[],
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
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.creditCard.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
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
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    return this.db.creditCard.updateMany({
      where: { id, userId },
      data: encryptedData,
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

    // Decrypt values using nested decryption
    const decrypted = cards.map((card) =>
      this.decryptCardWithRelations(card as unknown as Record<string, unknown>, false)
    );

    let totalLimit = 0;
    let totalUsed = 0;

    for (const card of decrypted) {
      // After decryption, limit is a number
      const cardLimit = card.limit as number;
      totalLimit += cardLimit;

      const invoices = card.invoices as Array<Record<string, unknown>>;
      for (const invoice of invoices) {
        // After nested decryption, total is a number
        const invoiceTotal = invoice.total as number;
        totalUsed += invoiceTotal;
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
   * Find a card by ID with full nested decryption (including purchases).
   */
  async findByIdWithPurchases(id: string, userId: string) {
    const result = await this.db.creditCard.findFirst({
      where: { id, userId },
      include: {
        invoices: {
          orderBy: { year: "desc", month: "desc" },
          include: { purchases: true },
        },
      },
    });

    if (!result) return null;

    // Use nested decryption that includes purchases
    return this.decryptCardWithRelations(
      result as unknown as Record<string, unknown>,
      true
    ) as unknown as typeof result;
  }
}

// Singleton instance
export const cardRepository = new CardRepository();
