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
   * Note: Prisma extension handles decryption automatically.
   */
  async findById(id: string, userId: string) {
    return this.db.transactionTemplate.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Find all templates for a user.
   * Note: Prisma extension handles decryption automatically.
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

    return this.db.transactionTemplate.findMany({
      where,
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
    });
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

    // Prisma extension handles decryption automatically
    return {
      data: templates,
      pagination,
    };
  }

  /**
   * Create a new template.
   * Note: Prisma extension handles encryption/decryption automatically.
   */
  async create(data: {
    userId: string;
    name: string;
    type: TransactionType;
    category: string;
    description?: string | null;
    value?: number | null;
  }) {
    // Prisma extension handles encryption on create and decryption on return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.transactionTemplate.create({ data: data as any });
  }

  /**
   * Update a template by ID (with ownership check).
   * Note: Prisma extension handles encryption/decryption automatically.
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

    // Prisma extension handles encryption on update and decryption on return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.transactionTemplate.update({
      where: { id },
      data: data as any,
    });
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
   * Note: Prisma extension handles decryption automatically.
   */
  async incrementUsage(id: string, userId: string) {
    // Verify ownership first
    const existing = await this.db.transactionTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    // Prisma extension handles decryption on return
    return this.db.transactionTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }

  /**
   * Get most used templates for a user.
   * Note: Prisma extension handles decryption automatically.
   */
  async getMostUsed(userId: string, limit = 5) {
    // Prisma extension handles decryption automatically
    return this.db.transactionTemplate.findMany({
      where: { userId },
      orderBy: { usageCount: "desc" },
      take: limit,
    });
  }
}

// Singleton instance
export const templateRepository = new TemplateRepository();
