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
   * Encrypt sensitive fields in data before saving.
   * Writes to encrypted columns while preserving original values.
   */
  protected encryptData<T extends Record<string, unknown>>(data: T): T {
    return encryptRecord(data, this.modelName);
  }

  /**
   * Decrypt sensitive fields after reading from database.
   * Reads from encrypted columns and populates original fields.
   */
  protected decryptData<T extends Record<string, unknown>>(data: T): T {
    return decryptRecord(data, this.modelName);
  }

  /**
   * Encrypt specific fields in update data.
   */
  protected encryptUpdateData<T extends Record<string, unknown>>(
    data: T,
    fields?: string[]
  ): T {
    return encryptFields(data, this.modelName, fields);
  }

  /**
   * Decrypt specific fields from a record.
   */
  protected decryptSpecificFields<T extends Record<string, unknown>>(
    data: T,
    fields?: string[]
  ): T {
    return decryptFields(data, this.modelName, fields);
  }

  /**
   * Decrypt an array of records.
   */
  protected decryptMany<T extends Record<string, unknown>>(records: T[]): T[] {
    if (!USE_ENCRYPTION) {
      return records;
    }
    return records.map((record) => this.decryptData(record));
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
