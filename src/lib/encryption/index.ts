/**
 * Encryption module exports.
 *
 * Usage:
 * ```typescript
 * import { encrypt, decryptRecord, encryptRecord } from "@/lib/encryption";
 * import type { Decrypted, DecryptedFields } from "@/lib/encryption";
 * ```
 */

// Core encryption functions
export {
  encrypt,
  decryptToString,
  decryptToNumber,
  isEncrypted,
  safeEncrypt,
  safeDecryptToNumber,
  safeDecryptToString,
  USE_ENCRYPTION,
} from "../encryption-core";

// Field configuration
export {
  ENCRYPTED_FIELDS,
  getEncryptedFields,
  getEncryptedFieldNames,
  isEncryptedField,
  getFieldType,
} from "./field-config";

export type {
  EncryptedModel,
  EncryptedFieldConfig,
  FieldType,
} from "./field-config";

// Record encryption helpers
export {
  encryptRecord,
  decryptRecord,
  encryptFields,
  decryptFields,
  decryptRecords,
  encryptRecords,
  decryptTyped,
  decryptTypedArray,
  decryptTypedFields,
} from "./record-helpers";

// TypeScript types for decrypted data
export type {
  Decrypted,
  DecryptedArray,
  DecryptedFields,
  DecryptedFieldTypes,
  HasEncryptedFields,
  CardWithDecryptedInvoices,
  CardWithDecryptedInvoicesAndPurchases,
  InvoiceWithDecryptedPurchases,
  GoalWithDecryptedContributions,
  InvestmentWithDecryptedOperations,
} from "./types";

export {
  isDecryptedNumber,
  isDecryptedString,
  assertDecryptedNumber,
  getDecryptedNumber,
  getDecryptedString,
} from "./types";

// Error handling
export {
  EncryptionErrorCode,
  EncryptionError,
  MissingKeyError,
  InvalidKeyError,
  CorruptedDataError,
  DecryptionFailedError,
  KeyVersionNotFoundError,
  decryptSuccess,
  decryptFailure,
  isEncryptionError,
  isKeyConfigurationError,
  isDataError,
  getEncryptionErrorMessage,
  wrapEncryptionError,
} from "./errors";

export type {
  DecryptResult,
  DecryptSuccess,
  DecryptFailure,
} from "./errors";

// Nested decryption helpers
export {
  NESTED_CONFIGS,
  decryptNested,
  decryptNestedArray,
  decryptWithConfig,
  decryptArrayWithConfig,
  createNestedConfig,
  mergeNestedConfigs,
  hasNestedChildren,
} from "./nested-helpers";

export type {
  NestedDecryptConfig,
  NestedConfigKey,
} from "./nested-helpers";

// Decryption cache
export {
  DecryptionCache,
  createDecryptionCache,
  getOrDecrypt,
  getOrDecryptSync,
  batchGetOrDecrypt,
  createRequestContext,
} from "./cache";

export type {
  CacheStats,
  RequestContext,
} from "./cache";

// Key management (versioned encryption)
export {
  keyManager,
  encryptVersioned,
  decryptVersioned,
  safeDecryptVersioned,
  safeDecryptVersionedNumber,
  reEncrypt,
  needsReEncryption,
  getEncryptionVersion,
  isVersionedEncrypted,
  generateKey,
} from "./key-management";
