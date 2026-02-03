/**
 * Nested decryption helpers for records with relations.
 *
 * Provides configurable recursive decryption for records that include
 * nested relations (e.g., Card with Invoices with Purchases).
 */

import type { EncryptedModel } from "./field-config";
import { decryptRecord } from "./record-helpers";
import { USE_ENCRYPTION } from "../encryption-core";

// ============================================
// Configuration Types
// ============================================

/**
 * Configuration for nested decryption.
 * Defines which model to use for decryption and any nested children.
 */
export interface NestedDecryptConfig {
  /** The model name for field configuration lookup */
  model: EncryptedModel;
  /** Child relations to decrypt recursively */
  children?: Record<string, NestedDecryptConfig>;
}

// ============================================
// Pre-defined Configurations
// ============================================

/**
 * Pre-defined configurations for common nested structures.
 */
export const NESTED_CONFIGS = {
  /**
   * Card with invoices (no purchases).
   */
  CardWithInvoices: {
    model: "CreditCard" as EncryptedModel,
    children: {
      invoices: { model: "Invoice" as EncryptedModel },
    },
  },

  /**
   * Card with invoices and their purchases.
   */
  CardWithInvoicesAndPurchases: {
    model: "CreditCard" as EncryptedModel,
    children: {
      invoices: {
        model: "Invoice" as EncryptedModel,
        children: {
          purchases: { model: "Purchase" as EncryptedModel },
        },
      },
    },
  },

  /**
   * Invoice with purchases.
   */
  InvoiceWithPurchases: {
    model: "Invoice" as EncryptedModel,
    children: {
      purchases: { model: "Purchase" as EncryptedModel },
    },
  },

  /**
   * Goal with contributions.
   */
  GoalWithContributions: {
    model: "FinancialGoal" as EncryptedModel,
    children: {
      contributions: { model: "GoalContribution" as EncryptedModel },
    },
  },

  /**
   * Investment with operations.
   */
  InvestmentWithOperations: {
    model: "Investment" as EncryptedModel,
    children: {
      operations: { model: "Operation" as EncryptedModel },
    },
  },
} as const;

/**
 * Type for nested config keys.
 */
export type NestedConfigKey = keyof typeof NESTED_CONFIGS;

// ============================================
// Decryption Functions
// ============================================

/**
 * Decrypt a record and its nested relations recursively.
 *
 * @param record - The record to decrypt
 * @param config - Configuration specifying which model and children to decrypt
 * @returns Decrypted record with all nested relations also decrypted
 *
 * @example
 * ```typescript
 * const card = await prisma.creditCard.findFirst({
 *   include: { invoices: { include: { purchases: true } } }
 * });
 *
 * const decrypted = decryptNested(card, NESTED_CONFIGS.CardWithInvoicesAndPurchases);
 * // card.limit is now number
 * // card.invoices[0].total is now number
 * // card.invoices[0].purchases[0].value is now number
 * ```
 */
export function decryptNested<T extends Record<string, unknown>>(
  record: T,
  config: NestedDecryptConfig
): T {
  if (!USE_ENCRYPTION) {
    return record;
  }

  // Decrypt the main record
  const decrypted = decryptRecord(record, config.model);

  // Process children if any
  if (config.children) {
    for (const [key, childConfig] of Object.entries(config.children)) {
      const childData = decrypted[key];

      if (childData === undefined || childData === null) {
        continue;
      }

      if (Array.isArray(childData)) {
        // Decrypt array of child records
        (decrypted as Record<string, unknown>)[key] = childData.map((child) =>
          decryptNested(child as Record<string, unknown>, childConfig)
        );
      } else if (typeof childData === "object") {
        // Decrypt single child record
        (decrypted as Record<string, unknown>)[key] = decryptNested(
          childData as Record<string, unknown>,
          childConfig
        );
      }
    }
  }

  return decrypted;
}

/**
 * Decrypt an array of records with nested relations.
 *
 * @param records - Array of records to decrypt
 * @param config - Configuration for decryption
 * @returns Array of decrypted records
 */
export function decryptNestedArray<T extends Record<string, unknown>>(
  records: T[],
  config: NestedDecryptConfig
): T[] {
  if (!USE_ENCRYPTION) {
    return records;
  }

  return records.map((record) => decryptNested(record, config));
}

/**
 * Decrypt a record using a pre-defined configuration key.
 *
 * @param record - The record to decrypt
 * @param configKey - Key from NESTED_CONFIGS
 * @returns Decrypted record
 *
 * @example
 * ```typescript
 * const card = await prisma.creditCard.findFirst({
 *   include: { invoices: { include: { purchases: true } } }
 * });
 *
 * const decrypted = decryptWithConfig(card, "CardWithInvoicesAndPurchases");
 * ```
 */
export function decryptWithConfig<T extends Record<string, unknown>>(
  record: T,
  configKey: NestedConfigKey
): T {
  return decryptNested(record, NESTED_CONFIGS[configKey]);
}

/**
 * Decrypt an array of records using a pre-defined configuration key.
 */
export function decryptArrayWithConfig<T extends Record<string, unknown>>(
  records: T[],
  configKey: NestedConfigKey
): T[] {
  return decryptNestedArray(records, NESTED_CONFIGS[configKey]);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create a custom nested config at runtime.
 *
 * @param model - The main model name
 * @param children - Optional child configurations
 * @returns NestedDecryptConfig
 *
 * @example
 * ```typescript
 * const customConfig = createNestedConfig("CreditCard", {
 *   invoices: createNestedConfig("Invoice")
 * });
 * ```
 */
export function createNestedConfig(
  model: EncryptedModel,
  children?: Record<string, NestedDecryptConfig>
): NestedDecryptConfig {
  return { model, children };
}

/**
 * Merge two nested configs, useful for extending base configurations.
 *
 * @param base - Base configuration
 * @param extension - Extension to merge
 * @returns Merged configuration
 */
export function mergeNestedConfigs(
  base: NestedDecryptConfig,
  extension: Partial<NestedDecryptConfig>
): NestedDecryptConfig {
  return {
    model: extension.model ?? base.model,
    children: extension.children
      ? { ...base.children, ...extension.children }
      : base.children,
  };
}

/**
 * Check if a configuration has children at a specific path.
 */
export function hasNestedChildren(
  config: NestedDecryptConfig,
  path: string[]
): boolean {
  let current: NestedDecryptConfig | undefined = config;

  for (const key of path) {
    if (!current?.children?.[key]) {
      return false;
    }
    current = current.children[key];
  }

  return current?.children !== undefined && Object.keys(current.children).length > 0;
}
