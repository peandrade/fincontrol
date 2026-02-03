/**
 * Configuration of sensitive fields that require encryption per model.
 * Single-column mode: encrypted values are stored directly in the field.
 */

/**
 * Model names that have sensitive fields.
 */
export type EncryptedModel =
  | "Transaction"
  | "Investment"
  | "Operation"
  | "CreditCard"
  | "Invoice"
  | "Purchase"
  | "Budget"
  | "RecurringExpense"
  | "FinancialGoal"
  | "GoalContribution"
  | "TransactionTemplate";

/**
 * Field type for encryption - determines how to decrypt the value.
 */
export type FieldType = "number" | "string";

/**
 * Configuration for an encrypted field (single-column mode).
 */
export interface EncryptedFieldConfig {
  /** Field name in the model (stores encrypted value) */
  name: string;
  /** Type of the original value (number or string) */
  type: FieldType;
}

/**
 * Mapping of sensitive fields per model.
 * Each field stores the encrypted value directly.
 */
export const ENCRYPTED_FIELDS: Record<EncryptedModel, EncryptedFieldConfig[]> = {
  Transaction: [
    { name: "value", type: "number" },
    { name: "description", type: "string" },
  ],

  TransactionTemplate: [
    { name: "value", type: "number" },
  ],

  Investment: [
    { name: "quantity", type: "number" },
    { name: "averagePrice", type: "number" },
    { name: "currentPrice", type: "number" },
    { name: "totalInvested", type: "number" },
    { name: "currentValue", type: "number" },
    { name: "profitLoss", type: "number" },
    { name: "profitLossPercent", type: "number" },
    { name: "goalValue", type: "number" },
    { name: "interestRate", type: "number" },
  ],

  Operation: [
    { name: "quantity", type: "number" },
    { name: "price", type: "number" },
    { name: "total", type: "number" },
    { name: "fees", type: "number" },
    { name: "notes", type: "string" },
  ],

  CreditCard: [
    { name: "limit", type: "number" },
  ],

  Invoice: [
    { name: "total", type: "number" },
    { name: "paidAmount", type: "number" },
  ],

  Purchase: [
    { name: "value", type: "number" },
    { name: "totalValue", type: "number" },
    { name: "description", type: "string" },
    { name: "notes", type: "string" },
  ],

  Budget: [
    { name: "limit", type: "number" },
  ],

  RecurringExpense: [
    { name: "value", type: "number" },
    { name: "description", type: "string" },
    { name: "notes", type: "string" },
  ],

  FinancialGoal: [
    { name: "targetValue", type: "number" },
    { name: "currentValue", type: "number" },
  ],

  GoalContribution: [
    { name: "value", type: "number" },
    { name: "notes", type: "string" },
  ],
};

/**
 * Get the encrypted field config for a model.
 */
export function getEncryptedFields(model: EncryptedModel): EncryptedFieldConfig[] {
  return ENCRYPTED_FIELDS[model] || [];
}

/**
 * Get encrypted field names for a model.
 */
export function getEncryptedFieldNames(model: EncryptedModel): string[] {
  return ENCRYPTED_FIELDS[model]?.map((f) => f.name) ?? [];
}

/**
 * Check if a field is encrypted for a model.
 */
export function isEncryptedField(model: EncryptedModel, field: string): boolean {
  return ENCRYPTED_FIELDS[model]?.some((f) => f.name === field) ?? false;
}

/**
 * Get field type for an encrypted field.
 */
export function getFieldType(model: EncryptedModel, field: string): FieldType | null {
  const config = ENCRYPTED_FIELDS[model]?.find((f) => f.name === field);
  return config?.type ?? null;
}
