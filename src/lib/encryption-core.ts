/**
 * Encryption module for sensitive financial data.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * Format: iv:authTag:ciphertext (all hex encoded)
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SEPARATOR = ":";

/**
 * Flag to enable/disable encryption globally.
 * Set to false for rollback during migration.
 */
export const USE_ENCRYPTION = process.env.USE_ENCRYPTION !== "false";

/**
 * Get the encryption key from environment.
 * Key must be 32 bytes (64 hex characters).
 */
function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (keyHex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${keyHex.length} characters.`
    );
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a value (number or string) using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext
 * Prevents double encryption by checking if value is already encrypted.
 */
export function encrypt(value: number | string): string {
  if (!USE_ENCRYPTION) {
    return String(value);
  }

  const stringValue = String(value);

  // Prevent double encryption
  if (isEncrypted(stringValue)) {
    console.warn("[ENCRYPT] Value is already encrypted, returning as-is");
    return stringValue;
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(stringValue, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(SEPARATOR);
}

/**
 * Decrypt a value encrypted with encrypt().
 * Returns the original string value.
 * Handles double-encrypted values by decrypting recursively.
 */
export function decryptToString(encrypted: string): string {
  if (!USE_ENCRYPTION) {
    return encrypted;
  }

  if (!isEncrypted(encrypted)) {
    return encrypted;
  }

  try {
    const key = getKey();
    const [ivHex, tagHex, dataHex] = encrypted.split(SEPARATOR);

    if (!ivHex || !tagHex || !dataHex) {
      throw new Error("Invalid encrypted format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");
    const data = Buffer.from(dataHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    const result = decrypted.toString("utf8");

    // Handle double-encrypted values (decrypt again if result is still encrypted)
    if (isEncrypted(result)) {
      console.warn("[DECRYPT] Detected double-encrypted value, decrypting again...");
      return decryptToString(result);
    }

    return result;
  } catch (error) {
    console.error("[DECRYPT] Crypto error:", error);
    throw error;
  }
}

/**
 * Decrypt a value and parse it as a number.
 */
export function decryptToNumber(encrypted: string): number {
  const decrypted = decryptToString(encrypted);
  const num = parseFloat(decrypted);

  if (isNaN(num)) {
    throw new Error(`Decrypted value is not a valid number: ${decrypted}`);
  }

  return num;
}

/**
 * Check if a string appears to be encrypted (matches our format).
 * Format: 32hex:32hex:hex (iv:tag:data)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const parts = value.split(SEPARATOR);
  if (parts.length !== 3) {
    return false;
  }

  const [iv, tag, data] = parts;

  // IV must be 32 hex chars (16 bytes)
  if (iv.length !== 32 || !/^[0-9a-f]+$/i.test(iv)) {
    return false;
  }

  // Tag must be 32 hex chars (16 bytes)
  if (tag.length !== 32 || !/^[0-9a-f]+$/i.test(tag)) {
    return false;
  }

  // Data must be non-empty hex
  if (data.length === 0 || !/^[0-9a-f]+$/i.test(data)) {
    return false;
  }

  return true;
}

/**
 * Safely decrypt a value, returning null if the value is null/undefined.
 */
export function safeDecryptToNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return decryptToNumber(value);
}

/**
 * Safely decrypt a string value, returning null if the value is null/undefined.
 */
export function safeDecryptToString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return decryptToString(value);
}

/**
 * Safely encrypt a value, returning null if the value is null/undefined.
 */
export function safeEncrypt(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return encrypt(value);
}

// ============================================
// Result-based Safe Decryption
// ============================================

/**
 * Result type for safe decryption operations.
 */
export interface SafeDecryptResult<T> {
  success: boolean;
  data: T;
  error?: Error;
}

/**
 * Safely decrypt a string value with Result pattern.
 * Returns fallback value on failure instead of throwing.
 */
export function safeDecryptStringResult(
  encrypted: string | null | undefined,
  fallback: string = ""
): SafeDecryptResult<string> {
  if (encrypted === null || encrypted === undefined || encrypted === "") {
    return { success: true, data: fallback };
  }

  try {
    const decrypted = decryptToString(encrypted);
    return { success: true, data: decrypted };
  } catch (error) {
    return {
      success: false,
      data: fallback,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Safely decrypt a number value with Result pattern.
 * Returns fallback value on failure instead of throwing.
 */
export function safeDecryptNumberResult(
  encrypted: string | null | undefined,
  fallback: number = 0
): SafeDecryptResult<number> {
  if (encrypted === null || encrypted === undefined || encrypted === "") {
    return { success: true, data: fallback };
  }

  try {
    const decrypted = decryptToNumber(encrypted);
    return { success: true, data: decrypted };
  } catch (error) {
    return {
      success: false,
      data: fallback,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
