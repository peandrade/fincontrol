import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import type { Prisma, TransactionType } from "@prisma/client";

/**
 * Filters for template queries.
 */
export interface TemplateFilters extends PaginationOptions {
  type?: TransactionType;
  category?: string;
  searchTerm?: string;
}

/**
 * TransactionTemplate type from Prisma.
 */
type TransactionTemplate = Prisma.TransactionTemplateGetPayload<object>;

/**
 * Repository for transaction template data access.
 */
export class TemplateRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "TransactionTemplate";

  /**
   * Find a template by ID with ownership check.
   */
  async findById(id: string, userId: string) {
    const result = await this.db.transactionTemplate.findFirst({
      where: { id, userId },
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all templates for a user.
   */
  async findByUser(userId: string, filters: TemplateFilters = {}) {
    const { type, category, searchTerm } = filters;

    const where: Prisma.TransactionTemplateWhereInput = {
      userId,
      ...(type && { type }),
      ...(category && { category }),
      ...(searchTerm && {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          { description: { contains: searchTerm, mode: "insensitive" as const } },
        ],
      }),
    };

    const results = await this.db.transactionTemplate.findMany({
      where,
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }

  /**
   * Find templates with pagination.
   */
  async findByUserPaginated(
    userId: string,
    filters: TemplateFilters = {}
  ): Promise<PaginatedResult<TransactionTemplate>> {
    const { type, category, searchTerm, page = 1, pageSize = 50 } = filters;

    const where: Prisma.TransactionTemplateWhereInput = {
      userId,
      ...(type && { type }),
      ...(category && { category }),
      ...(searchTerm && {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          { description: { contains: searchTerm, mode: "insensitive" as const } },
        ],
      }),
    };

    const total = await this.db.transactionTemplate.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const templates = await this.db.transactionTemplate.findMany({
      where,
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
      skip,
      take,
    });

    const decrypted = this.decryptMany(templates as unknown as Record<string, unknown>[]);

    return {
      data: decrypted as unknown as TransactionTemplate[],
      pagination,
    };
  }

  /**
   * Create a new template.
   */
  async create(data: {
    userId: string;
    name: string;
    type: TransactionType;
    category: string;
    description?: string | null;
    value?: number | null;
  }) {
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.transactionTemplate.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Update a template by ID (with ownership check).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      type: TransactionType;
      category: string;
      description: string | null;
      value: number | null;
    }>
  ) {
    // Verify ownership first
    const existing = await this.db.transactionTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    const result = await this.db.transactionTemplate.update({
      where: { id },
      data: encryptedData,
    });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Delete a template by ID (with ownership check).
   */
  async delete(id: string, userId: string) {
    return this.db.transactionTemplate.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Increment usage count for a template.
   */
  async incrementUsage(id: string, userId: string) {
    // Verify ownership first
    const existing = await this.db.transactionTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const result = await this.db.transactionTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Get most used templates for a user.
   */
  async getMostUsed(userId: string, limit = 5) {
    const results = await this.db.transactionTemplate.findMany({
      where: { userId },
      orderBy: { usageCount: "desc" },
      take: limit,
    });

    return this.decryptMany(results as unknown as Record<string, unknown>[]) as unknown as typeof results;
  }
}

// Singleton instance
export const templateRepository = new TemplateRepository();
