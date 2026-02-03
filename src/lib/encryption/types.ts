/**
 * TypeScript types for encrypted/decrypted model fields.
 *
 * This module provides type utilities to properly type records after decryption,
 * eliminating the need for `as unknown as number` casts throughout the codebase.
 */

import type { EncryptedModel } from "./field-config";

// ============================================
// Decrypted Field Type Mappings
// ============================================

/**
 * Maps each encrypted model to its field types after decryption.
 * These represent the actual runtime types after decryption.
 */
export interface DecryptedFieldTypes {
  Transaction: {
    value: number;
    description: string | null;
  };

  TransactionTemplate: {
    value: number | null;
  };

  Investment: {
    quantity: number;
    averagePrice: number;
    currentPrice: number | null;
    totalInvested: number;
    currentValue: number | null;
    profitLoss: number | null;
    profitLossPercent: number | null;
    goalValue: number | null;
    interestRate: number | null;
  };

  Operation: {
    quantity: number;
    price: number;
    total: number;
    fees: number | null;
    notes: string | null;
  };

  CreditCard: {
    limit: number;
  };

  Invoice: {
    total: number;
    paidAmount: number | null;
  };

  Purchase: {
    value: number;
    totalValue: number;
    description: string | null;
    notes: string | null;
  };

  Budget: {
    limit: number;
  };

  RecurringExpense: {
    value: number;
    description: string | null;
    notes: string | null;
  };

  FinancialGoal: {
    targetValue: number;
    currentValue: number;
  };

  GoalContribution: {
    value: number;
    notes: string | null;
  };
}

// ============================================
// Type Utilities
// ============================================

/**
 * Transform a model type by replacing encrypted string fields with their decrypted types.
 *
 * @example
 * ```typescript
 * // If Transaction has { value: string; description: string | null; ... }
 * type DecryptedTransaction = Decrypted<Transaction, "Transaction">;
 * // Results in { value: number; description: string | null; ... }
 * ```
 */
export type Decrypted<T, M extends EncryptedModel> = M extends keyof DecryptedFieldTypes
  ? Omit<T, keyof DecryptedFieldTypes[M]> & DecryptedFieldTypes[M]
  : T;

/**
 * Transform an array of model types to their decrypted versions.
 */
export type DecryptedArray<T, M extends EncryptedModel> = Decrypted<T, M>[];

/**
 * Get the decrypted field types for a specific model.
 */
export type DecryptedFields<M extends EncryptedModel> = M extends keyof DecryptedFieldTypes
  ? DecryptedFieldTypes[M]
  : Record<string, never>;

/**
 * Check if a model has encrypted fields defined.
 */
export type HasEncryptedFields<M extends EncryptedModel> = M extends keyof DecryptedFieldTypes
  ? true
  : false;

// ============================================
// Helper Types for Repositories
// ============================================

/**
 * Type for card with decrypted invoices.
 */
export type CardWithDecryptedInvoices<TCard, TInvoice> = Decrypted<TCard, "CreditCard"> & {
  invoices?: Decrypted<TInvoice, "Invoice">[];
};

/**
 * Type for card with decrypted invoices and purchases.
 */
export type CardWithDecryptedInvoicesAndPurchases<TCard, TInvoice, TPurchase> = Decrypted<
  TCard,
  "CreditCard"
> & {
  invoices?: (Decrypted<TInvoice, "Invoice"> & {
    purchases?: Decrypted<TPurchase, "Purchase">[];
  })[];
};

/**
 * Type for invoice with decrypted purchases.
 */
export type InvoiceWithDecryptedPurchases<TInvoice, TPurchase> = Decrypted<TInvoice, "Invoice"> & {
  purchases?: Decrypted<TPurchase, "Purchase">[];
};

/**
 * Type for goal with decrypted contributions.
 */
export type GoalWithDecryptedContributions<TGoal, TContribution> = Decrypted<
  TGoal,
  "FinancialGoal"
> & {
  contributions?: Decrypted<TContribution, "GoalContribution">[];
};

/**
 * Type for investment with decrypted operations.
 */
export type InvestmentWithDecryptedOperations<TInvestment, TOperation> = Decrypted<
  TInvestment,
  "Investment"
> & {
  operations?: Decrypted<TOperation, "Operation">[];
};

// ============================================
// Type Guards
// ============================================

/**
 * Type guard to check if a value is a valid decrypted number.
 */
export function isDecryptedNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Type guard to check if a value is a valid decrypted string.
 */
export function isDecryptedString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Assert that a value is a decrypted number, throwing if not.
 */
export function assertDecryptedNumber(value: unknown, fieldName: string): asserts value is number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`Expected ${fieldName} to be a decrypted number, got ${typeof value}`);
  }
}

/**
 * Safely get a number from a potentially decrypted field.
 * Returns 0 if the value is null/undefined.
 */
export function getDecryptedNumber(value: number | null | undefined): number {
  return value ?? 0;
}

/**
 * Safely get a string from a potentially decrypted field.
 * Returns empty string if the value is null/undefined.
 */
export function getDecryptedString(value: string | null | undefined): string {
  return value ?? "";
}
