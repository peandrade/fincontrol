import { prisma, type ExtendedPrismaClient } from "@/lib/prisma";
import {
  encryptRecord,
  decryptRecord,
  encryptFields,
  decryptFields,
  USE_ENCRYPTION,
  type EncryptedModel,
} from "@/lib/encryption";

/**
 * Base repository class providing common data access patterns.
 * All domain repositories should extend this class.
 *
 * Benefits:
 * - Centralized database access
 * - Easy to swap ORM or add caching
 * - Consistent query patterns
 * - Testable via dependency injection
 * - Automatic encryption/decryption of sensitive fields
 */
export abstract class BaseRepository {
  protected db: ExtendedPrismaClient;

  /** The model name for encryption field config lookup */
  protected abstract readonly modelName: EncryptedModel;

  constructor(db: ExtendedPrismaClient = prisma) {
    this.db = db;
  }

  /**
   * Execute operations within a database transaction.
   * Use for multi-step operations that must be atomic.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.$transaction(fn) as any;
  }

  /**
   * Check if encryption is enabled.
   */
  protected get encryptionEnabled(): boolean {
    return USE_ENCRYPTION;
  }

  /**
   * @deprecated Prisma extension handles encryption automatically.
   * This method now returns data unchanged to prevent double encryption.
   */
  protected encryptData<T extends Record<string, unknown>>(data: T): T {
    // Prisma extension handles encryption automatically - do nothing here
    return data;
  }

  /**
   * @deprecated Prisma extension handles decryption automatically.
   * This method now returns data unchanged to prevent double decryption.
   */
  protected decryptData<T extends Record<string, unknown>>(data: T): T {
    // Prisma extension handles decryption automatically - do nothing here
    return data;
  }

  /**
   * @deprecated Prisma extension handles encryption automatically.
   * This method now returns data unchanged to prevent double encryption.
   */
  protected encryptUpdateData<T extends Record<string, unknown>>(
    data: T,
    _fields?: string[]
  ): T {
    // Prisma extension handles encryption automatically - do nothing here
    return data;
  }

  /**
   * @deprecated Prisma extension handles decryption automatically.
   * This method now returns data unchanged to prevent double decryption.
   */
  protected decryptSpecificFields<T extends Record<string, unknown>>(
    data: T,
    _fields?: string[]
  ): T {
    // Prisma extension handles decryption automatically - do nothing here
    return data;
  }

  /**
   * @deprecated Prisma extension handles decryption automatically.
   * This method now returns data unchanged to prevent double decryption.
   */
  protected decryptMany<T extends Record<string, unknown>>(records: T[]): T[] {
    // Prisma extension handles decryption automatically - do nothing here
    return records;
  }
}

/**
 * Common filter options for list queries.
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Standard pagination result.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Helper to calculate pagination values.
 */
export function calculatePagination(
  page: number = 1,
  pageSize: number = 50,
  total: number
) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  return {
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize),
      hasMore: safePage * safePageSize < total,
    },
  };
}
