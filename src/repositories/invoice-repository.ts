import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import { decryptRecord } from "@/lib/encryption";
import type { Prisma, InvoiceStatus } from "@prisma/client";

/**
 * Filters for invoice queries.
 */
export interface InvoiceFilters extends PaginationOptions {
  status?: InvoiceStatus | InvoiceStatus[];
  creditCardId?: string;
  year?: number;
  month?: number;
  includePurchases?: boolean;
}

/**
 * Invoice type from Prisma.
 */
type Invoice = Prisma.InvoiceGetPayload<{ include: { purchases: true; creditCard: true } }>;

/**
 * Repository for invoice data access.
 */
export class InvoiceRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "Invoice";

  /**
   * Decrypt an invoice and its purchases if present.
   */
  private decryptInvoiceWithPurchases<T extends Record<string, unknown>>(invoice: T): T {
    const decrypted = this.decryptData(invoice) as Record<string, unknown>;

    // Also decrypt purchases if present
    if (decrypted.purchases && Array.isArray(decrypted.purchases)) {
      decrypted.purchases = (decrypted.purchases as Record<string, unknown>[]).map((purchase) =>
        decryptRecord(purchase, "Purchase")
      );
    }

    return decrypted as T;
  }

  /**
   * Find an invoice by ID.
   */
  async findById(id: string, includePurchases = false) {
    const result = await this.db.invoice.findUnique({
      where: { id },
      include: includePurchases ? { purchases: { orderBy: { date: "desc" } }, creditCard: true } : { creditCard: true },
    });

    if (!result) return null;

    return this.decryptInvoiceWithPurchases(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find invoice by card, month and year.
   */
  async findByCardAndPeriod(creditCardId: string, month: number, year: number, includePurchases = false) {
    const result = await this.db.invoice.findUnique({
      where: {
        creditCardId_month_year: { creditCardId, month, year },
      },
      include: includePurchases ? { purchases: { orderBy: { date: "desc" } } } : undefined,
    });

    if (!result) return null;

    return this.decryptInvoiceWithPurchases(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all invoices for a credit card.
   */
  async findByCard(creditCardId: string, filters: InvoiceFilters = {}) {
    const { status, year, month, includePurchases = false } = filters;

    const where: Prisma.InvoiceWhereInput = {
      creditCardId,
      ...(status && { status: Array.isArray(status) ? { in: status } : status }),
      ...(year && { year }),
      ...(month && { month }),
    };

    const results = await this.db.invoice.findMany({
      where,
      include: includePurchases ? { purchases: { orderBy: { date: "desc" } } } : undefined,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return results.map((r) =>
      this.decryptInvoiceWithPurchases(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
  }

  /**
   * Find invoices with pagination.
   */
  async findByCardPaginated(
    creditCardId: string,
    filters: InvoiceFilters = {}
  ): Promise<PaginatedResult<Invoice>> {
    const { status, year, month, page = 1, pageSize = 12, includePurchases = false } = filters;

    const where: Prisma.InvoiceWhereInput = {
      creditCardId,
      ...(status && { status: Array.isArray(status) ? { in: status } : status }),
      ...(year && { year }),
      ...(month && { month }),
    };

    const total = await this.db.invoice.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const invoices = await this.db.invoice.findMany({
      where,
      include: includePurchases ? { purchases: { orderBy: { date: "desc" } }, creditCard: true } : { creditCard: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip,
      take,
    });

    const decrypted = invoices.map((r) =>
      this.decryptInvoiceWithPurchases(r as unknown as Record<string, unknown>)
    );

    return {
      data: decrypted as unknown as Invoice[],
      pagination,
    };
  }

  /**
   * Create or get an invoice for a card and period.
   */
  async findOrCreate(creditCardId: string, month: number, year: number, closingDate: Date, dueDate: Date) {
    let invoice = await this.db.invoice.findUnique({
      where: {
        creditCardId_month_year: { creditCardId, month, year },
      },
    });

    if (!invoice) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoice = await this.db.invoice.create({
        data: {
          creditCardId,
          month,
          year,
          closingDate,
          dueDate,
          status: "open",
          total: 0,
          paidAmount: 0,
        } as any,
      });
    }

    return this.decryptData(invoice as unknown as Record<string, unknown>) as unknown as typeof invoice;
  }

  /**
   * Update an invoice.
   */
  async update(
    id: string,
    data: Partial<{
      status: InvoiceStatus;
      total: number;
      paidAmount: number;
      closingDate: Date;
      dueDate: Date;
    }>
  ) {
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    const result = await this.db.invoice.update({
      where: { id },
      data: encryptedData,
    });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Update invoice total by recalculating from purchases.
   */
  async recalculateTotal(invoiceId: string) {
    const purchases = await this.db.purchase.findMany({
      where: { invoiceId },
    });

    // Decrypt and sum
    const decryptedPurchases = purchases.map((p) =>
      decryptRecord(p as unknown as Record<string, unknown>, "Purchase")
    ) as unknown as typeof purchases;

    const total = decryptedPurchases.reduce((sum, p) => sum + (p.value as unknown as number), 0);

    return this.update(invoiceId, { total });
  }

  /**
   * Delete an invoice.
   */
  async delete(id: string) {
    return this.db.invoice.delete({
      where: { id },
    });
  }

  /**
   * Get unpaid invoices for a user (across all cards).
   */
  async getUnpaidByUser(userId: string) {
    const results = await this.db.invoice.findMany({
      where: {
        creditCard: { userId },
        status: { in: ["open", "closed", "overdue"] },
      },
      include: { creditCard: true },
      orderBy: { dueDate: "asc" },
    });

    return results.map((r) =>
      this.decryptData(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
  }

  /**
   * Get future invoices for a user.
   */
  async getFutureByUser(userId: string, currentMonth: number, currentYear: number, limit = 50) {
    const results = await this.db.invoice.findMany({
      where: {
        creditCard: { userId, isActive: true },
        OR: [
          { year: currentYear, month: { gt: currentMonth } },
          { year: { gt: currentYear } },
        ],
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
      take: limit,
    });

    return results.map((r) =>
      this.decryptData(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
  }

  /**
   * Get invoices for a specific month across all cards.
   */
  async getByMonthForUser(userId: string, month: number, year: number) {
    const results = await this.db.invoice.findMany({
      where: {
        creditCard: { userId, isActive: true },
        month,
        year,
      },
      include: { creditCard: true },
    });

    return results.map((r) =>
      this.decryptData(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
  }
}

// Singleton instance
export const invoiceRepository = new InvoiceRepository();
