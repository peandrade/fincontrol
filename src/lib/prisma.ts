import { PrismaClient } from "@prisma/client";
import {
  decryptRecord,
  encryptRecord,
  encryptFields,
  USE_ENCRYPTION,
  type EncryptedModel,
} from "./encryption";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

/**
 * Map Prisma model names to our EncryptedModel type.
 */
const MODEL_MAP: Record<string, EncryptedModel> = {
  transaction: "Transaction",
  investment: "Investment",
  operation: "Operation",
  creditCard: "CreditCard",
  invoice: "Invoice",
  purchase: "Purchase",
  budget: "Budget",
  recurringExpense: "RecurringExpense",
  financialGoal: "FinancialGoal",
  goalContribution: "GoalContribution",
  transactionTemplate: "TransactionTemplate",
};

/**
 * Map relation names to their model types for decryption.
 */
const RELATION_MODEL_MAP: Record<string, string> = {
  operations: "operation",
  contributions: "goalContribution",
  purchases: "purchase",
  invoices: "invoice",
  creditCard: "creditCard",
  invoice: "invoice",
  investment: "investment",
  goal: "financialGoal",
};

/**
 * Get the EncryptedModel type from a model name string.
 */
function getEncryptedModel(modelName: string): EncryptedModel | null {
  const normalizedModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return MODEL_MAP[normalizedModel] || null;
}

/**
 * Decrypt nested relations in a result.
 */
function decryptRelations(record: Record<string, unknown>): Record<string, unknown> {
  if (!USE_ENCRYPTION || !record) return record;

  const result = { ...record };

  for (const [key, value] of Object.entries(result)) {
    const relationModel = RELATION_MODEL_MAP[key];
    if (relationModel && value) {
      const encryptedModel = MODEL_MAP[relationModel];
      if (encryptedModel) {
        if (Array.isArray(value)) {
          result[key] = value.map((item) =>
            decryptRecord(item as Record<string, unknown>, encryptedModel)
          );
        } else if (typeof value === "object") {
          result[key] = decryptRecord(value as Record<string, unknown>, encryptedModel);
        }
      }
    }
  }

  return result;
}

/**
 * Decrypt a single result or array of results, including nested relations.
 */
function decryptResult<T>(result: T, modelName: string): T {
  if (!USE_ENCRYPTION || !result) return result;

  const encryptedModel = getEncryptedModel(modelName);
  if (!encryptedModel) return result;

  if (Array.isArray(result)) {
    return result.map((item) => {
      const decrypted = decryptRecord(item as Record<string, unknown>, encryptedModel);
      return decryptRelations(decrypted);
    }) as T;
  }

  const decrypted = decryptRecord(result as Record<string, unknown>, encryptedModel);
  return decryptRelations(decrypted) as T;
}

/**
 * Encrypt data before create/update.
 * Accepts number values and converts them to encrypted strings.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function encryptData(data: any, modelName: string, isUpdate = false): any {
  if (!USE_ENCRYPTION || !data) return data;

  const encryptedModel = getEncryptedModel(modelName);
  if (!encryptedModel) return data;

  if (isUpdate) {
    return encryptFields(
      data as Record<string, unknown>,
      encryptedModel,
      Object.keys(data as object)
    );
  }

  return encryptRecord(data as Record<string, unknown>, encryptedModel);
}

/**
 * Create Prisma client with automatic encryption/decryption.
 *
 * IMPORTANT: This extension automatically:
 * - Encrypts number/string values to encrypted strings on create/update
 * - Decrypts encrypted strings back to number/string on read
 *
 * The TypeScript types from Prisma show String for encrypted fields,
 * but at runtime the values are decrypted to their original types.
 * Use type assertions when needed: `result as unknown as DecryptedTransaction`
 */
function createPrismaClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async findFirst({ model, args, query }) {
          const result = await query(args);
          return decryptResult(result, model);
        },
        async findUnique({ model, args, query }) {
          const result = await query(args);
          return decryptResult(result, model);
        },
        async findMany({ model, args, query }) {
          const result = await query(args);
          return decryptResult(result, model);
        },
        async create({ model, args, query }) {
          if (args.data) {
            args.data = encryptData(args.data, model);
          }
          const result = await query(args);
          return decryptResult(result, model);
        },
        async update({ model, args, query }) {
          if (args.data) {
            args.data = encryptData(args.data, model, true);
          }
          const result = await query(args);
          return decryptResult(result, model);
        },
        async upsert({ model, args, query }) {
          if (args.create) {
            args.create = encryptData(args.create, model);
          }
          if (args.update) {
            args.update = encryptData(args.update, model, true);
          }
          const result = await query(args);
          return decryptResult(result, model);
        },
        async createMany({ model, args, query }) {
          if (args.data) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item) => encryptData(item, model));
            } else {
              args.data = encryptData(args.data, model);
            }
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (args.data) {
            args.data = encryptData(args.data, model, true);
          }
          return query(args);
        },
      },
    },
  });
}

// Create a single instance of PrismaClient with encryption extension
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle cleanup on process termination
const cleanup = async () => {
  await (prisma as unknown as PrismaClient).$disconnect();
};

// Register cleanup handlers
if (typeof window === "undefined") {
  process.on("beforeExit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}

export default prisma;

// Export type for use in repositories
export type ExtendedPrismaClient = typeof prisma;
