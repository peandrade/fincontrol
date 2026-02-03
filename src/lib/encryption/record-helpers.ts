/**
 * Helper functions for encrypting/decrypting entire records.
 * Single-column mode: encrypted values are stored directly in the field.
 */
import {
  encrypt,
  safeEncrypt,
  safeDecryptToNumber,
  safeDecryptToString,
  USE_ENCRYPTION,
} from "../encryption-core";
import { getEncryptedFields, type EncryptedModel } from "./field-config";
import type { Decrypted } from "./types";

/**
 * Encrypt sensitive fields in a record before saving to database.
 * The encrypted value replaces the original value in the same field.
 *
 * @param record - The record data to encrypt
 * @param model - The model name to get field config
 * @returns Record with encrypted values
 */
export function encryptRecord<T extends Record<string, unknown>>(
  record: T,
  model: EncryptedModel
): T {
  if (!USE_ENCRYPTION) {
    return record;
  }

  const fields = getEncryptedFields(model);
  const result = { ...record };

  for (const field of fields) {
    const value = record[field.name];

    if (value !== undefined && value !== null) {
      // Encrypt and store in the same field
      (result as Record<string, unknown>)[field.name] = encrypt(
        value as number | string
      );
    }
  }

  return result;
}

/**
 * Decrypt sensitive fields in a record after reading from database.
 *
 * @param record - The record from database with encrypted values
 * @param model - The model name to get field config
 * @returns Record with decrypted values
 */
export function decryptRecord<T extends Record<string, unknown>>(
  record: T,
  model: EncryptedModel
): T {
  if (!USE_ENCRYPTION) {
    return record;
  }

  const fields = getEncryptedFields(model);
  const result = { ...record };

  for (const field of fields) {
    const encryptedValue = record[field.name] as string | null | undefined;

    if (encryptedValue !== undefined && encryptedValue !== null && encryptedValue !== "") {
      // Decrypt and store in the same field
      if (field.type === "number") {
        (result as Record<string, unknown>)[field.name] = safeDecryptToNumber(encryptedValue);
      } else {
        (result as Record<string, unknown>)[field.name] = safeDecryptToString(encryptedValue);
      }
    }
  }

  return result;
}

/**
 * Encrypt specific fields in data for creating/updating.
 *
 * @param data - The data to encrypt
 * @param model - The model name
 * @param fieldsToEncrypt - Optional list of field names to encrypt (all if not specified)
 */
export function encryptFields<T extends Record<string, unknown>>(
  data: T,
  model: EncryptedModel,
  fieldsToEncrypt?: string[]
): T {
  if (!USE_ENCRYPTION) {
    return data;
  }

  const fields = getEncryptedFields(model);
  const result: Record<string, unknown> = { ...data };

  for (const field of fields) {
    // Skip if not in the list of fields to encrypt
    if (fieldsToEncrypt && !fieldsToEncrypt.includes(field.name)) {
      continue;
    }

    const value = data[field.name];

    if (value !== undefined) {
      // Encrypt the value
      result[field.name] = safeEncrypt(value as number | string | null);
    }
  }

  return result as T;
}

/**
 * Decrypt specific fields from encrypted data.
 *
 * @param data - The data with encrypted values
 * @param model - The model name
 * @param fieldsToDecrypt - Optional list of field names to decrypt
 */
export function decryptFields<T extends Record<string, unknown>>(
  data: T,
  model: EncryptedModel,
  fieldsToDecrypt?: string[]
): T {
  if (!USE_ENCRYPTION) {
    return data;
  }

  const fields = getEncryptedFields(model);
  const result = { ...data };

  for (const field of fields) {
    // Skip if not in the list of fields to decrypt
    if (fieldsToDecrypt && !fieldsToDecrypt.includes(field.name)) {
      continue;
    }

    const encryptedValue = data[field.name] as string | null | undefined;

    if (encryptedValue !== undefined && encryptedValue !== null && encryptedValue !== "") {
      if (field.type === "number") {
        (result as Record<string, unknown>)[field.name] = safeDecryptToNumber(encryptedValue);
      } else {
        (result as Record<string, unknown>)[field.name] = safeDecryptToString(encryptedValue);
      }
    }
  }

  return result;
}

/**
 * Decrypt an array of records.
 */
export function decryptRecords<T extends Record<string, unknown>>(
  records: T[],
  model: EncryptedModel
): T[] {
  if (!USE_ENCRYPTION) {
    return records;
  }

  return records.map((record) => decryptRecord(record, model));
}

/**
 * Encrypt an array of records.
 */
export function encryptRecords<T extends Record<string, unknown>>(
  records: T[],
  model: EncryptedModel
): T[] {
  if (!USE_ENCRYPTION) {
    return records;
  }

  return records.map((record) => encryptRecord(record, model));
}

// ============================================
// Typed Decryption Helpers
// ============================================

/**
 * Decrypt a record with proper typing.
 * Returns a properly typed decrypted record, eliminating the need for type casts.
 *
 * @example
 * ```typescript
 * const transaction = await prisma.transaction.findFirst({ where: { id } });
 * const decrypted = decryptTyped(transaction, "Transaction");
 * // decrypted.value is now number, not string
 * ```
 */
export function decryptTyped<T extends Record<string, unknown>, M extends EncryptedModel>(
  record: T,
  model: M
): Decrypted<T, M> {
  return decryptRecord(record, model) as Decrypted<T, M>;
}

/**
 * Decrypt an array of records with proper typing.
 */
export function decryptTypedArray<T extends Record<string, unknown>, M extends EncryptedModel>(
  records: T[],
  model: M
): Decrypted<T, M>[] {
  return decryptRecords(records, model) as Decrypted<T, M>[];
}

/**
 * Decrypt specific fields from a record with proper typing.
 */
export function decryptTypedFields<T extends Record<string, unknown>, M extends EncryptedModel>(
  data: T,
  model: M,
  fieldsToDecrypt?: string[]
): Decrypted<T, M> {
  return decryptFields(data, model, fieldsToDecrypt) as Decrypted<T, M>;
}
