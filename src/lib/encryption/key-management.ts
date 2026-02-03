/**
 * Encryption key management module.
 *
 * Supports versioned keys for key rotation scenarios.
 * Allows decrypting data encrypted with old keys while
 * encrypting new data with the current key.
 *
 * Key Format:
 * - Current: ENCRYPTION_KEY=v2:64_hex_characters
 * - Legacy: ENCRYPTION_KEYS_LEGACY=v1:64_hex_chars,v0:64_hex_chars
 *
 * Encrypted Data Format:
 * - Legacy (unversioned): iv:authTag:ciphertext
 * - Versioned: version:iv:authTag:ciphertext
 */

import * as crypto from "crypto";
import {
  EncryptionError,
  MissingKeyError,
  InvalidKeyError,
  KeyVersionNotFoundError,
  CorruptedDataError,
  DecryptionFailedError,
  type DecryptResult,
  decryptSuccess,
  decryptFailure,
} from "./errors";

// ============================================
// Constants
// ============================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const SEPARATOR = ":";

/** Default version for unversioned encrypted data */
const LEGACY_VERSION = "v0";

/** Current version for new encryptions */
const CURRENT_VERSION = "v1";

// ============================================
// Types
// ============================================

/**
 * Parsed key with version and buffer.
 */
interface ParsedKey {
  version: string;
  key: Buffer;
}

/**
 * Parsed encrypted data.
 */
interface ParsedEncryptedData {
  version: string;
  iv: Buffer;
  authTag: Buffer;
  ciphertext: Buffer;
}

// ============================================
// Key Parsing
// ============================================

/**
 * Parse a versioned key string.
 * Format: "v1:64_hex_characters" or just "64_hex_characters" (legacy)
 */
function parseKeyString(keyString: string): ParsedKey {
  const parts = keyString.split(SEPARATOR);

  if (parts.length === 1) {
    // Legacy format: just the hex key
    if (parts[0].length !== 64) {
      throw new InvalidKeyError(parts[0].length);
    }
    return {
      version: LEGACY_VERSION,
      key: Buffer.from(parts[0], "hex"),
    };
  }

  if (parts.length === 2) {
    // Versioned format: version:hex_key
    const [version, hexKey] = parts;
    if (hexKey.length !== 64) {
      throw new InvalidKeyError(hexKey.length);
    }
    return {
      version,
      key: Buffer.from(hexKey, "hex"),
    };
  }

  throw new InvalidKeyError(keyString.length);
}

/**
 * Load all available keys from environment.
 */
function loadKeys(): Map<string, Buffer> {
  const keys = new Map<string, Buffer>();

  // Load current key
  const currentKey = process.env.ENCRYPTION_KEY;
  if (currentKey) {
    const parsed = parseKeyString(currentKey);
    keys.set(parsed.version, parsed.key);
  }

  // Load legacy keys
  const legacyKeys = process.env.ENCRYPTION_KEYS_LEGACY;
  if (legacyKeys) {
    const keyStrings = legacyKeys.split(",").map((s) => s.trim());
    for (const keyString of keyStrings) {
      if (keyString) {
        const parsed = parseKeyString(keyString);
        // Don't overwrite current version
        if (!keys.has(parsed.version)) {
          keys.set(parsed.version, parsed.key);
        }
      }
    }
  }

  return keys;
}

// ============================================
// Key Manager Class
// ============================================

/**
 * Manages encryption keys with version support.
 */
class KeyManager {
  private keys: Map<string, Buffer> | null = null;
  private currentVersion: string | null = null;

  /**
   * Initialize keys from environment.
   */
  private ensureLoaded(): void {
    if (this.keys !== null) return;

    this.keys = loadKeys();

    // Determine current version
    const currentKey = process.env.ENCRYPTION_KEY;
    if (currentKey) {
      const parts = currentKey.split(SEPARATOR);
      this.currentVersion = parts.length === 2 ? parts[0] : CURRENT_VERSION;
    }
  }

  /**
   * Get the current encryption key.
   * Throws if no key is configured.
   */
  getCurrentKey(): { version: string; key: Buffer } {
    this.ensureLoaded();

    if (!this.keys || this.keys.size === 0) {
      throw new MissingKeyError();
    }

    const version = this.currentVersion || LEGACY_VERSION;
    const key = this.keys.get(version);

    if (!key) {
      throw new MissingKeyError();
    }

    return { version, key };
  }

  /**
   * Get a key by version.
   * Returns undefined if version not found.
   */
  getKey(version: string): Buffer | undefined {
    this.ensureLoaded();
    return this.keys?.get(version);
  }

  /**
   * Check if a specific key version is available.
   */
  hasKey(version: string): boolean {
    this.ensureLoaded();
    return this.keys?.has(version) ?? false;
  }

  /**
   * Get all available key versions.
   */
  getAvailableVersions(): string[] {
    this.ensureLoaded();
    return this.keys ? Array.from(this.keys.keys()) : [];
  }

  /**
   * Check if any keys are configured.
   */
  hasAnyKey(): boolean {
    this.ensureLoaded();
    return this.keys !== null && this.keys.size > 0;
  }

  /**
   * Reload keys from environment (useful for testing).
   */
  reload(): void {
    this.keys = null;
    this.currentVersion = null;
    this.ensureLoaded();
  }
}

// Singleton instance
export const keyManager = new KeyManager();

// ============================================
// Versioned Encryption/Decryption
// ============================================

/**
 * Parse encrypted data into components.
 * Handles both versioned and unversioned formats.
 */
function parseEncryptedData(encrypted: string): ParsedEncryptedData {
  const parts = encrypted.split(SEPARATOR);

  // Check for versioned format (4 parts: version:iv:tag:data)
  if (parts.length === 4) {
    const [version, ivHex, tagHex, dataHex] = parts;
    return {
      version,
      iv: Buffer.from(ivHex, "hex"),
      authTag: Buffer.from(tagHex, "hex"),
      ciphertext: Buffer.from(dataHex, "hex"),
    };
  }

  // Legacy format (3 parts: iv:tag:data)
  if (parts.length === 3) {
    const [ivHex, tagHex, dataHex] = parts;
    return {
      version: LEGACY_VERSION,
      iv: Buffer.from(ivHex, "hex"),
      authTag: Buffer.from(tagHex, "hex"),
      ciphertext: Buffer.from(dataHex, "hex"),
    };
  }

  throw new CorruptedDataError(encrypted, "Invalid format");
}

/**
 * Encrypt a value using the current key with version prefix.
 *
 * @param value - Value to encrypt
 * @returns Encrypted string in format: version:iv:authTag:ciphertext
 */
export function encryptVersioned(value: number | string): string {
  const { version, key } = keyManager.getCurrentKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = String(value);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Use versioned format
  return [
    version,
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(SEPARATOR);
}

/**
 * Decrypt a value, handling both versioned and legacy formats.
 *
 * @param encrypted - Encrypted string
 * @returns Decrypted string value
 */
export function decryptVersioned(encrypted: string): string {
  const parsed = parseEncryptedData(encrypted);
  const key = keyManager.getKey(parsed.version);

  if (!key) {
    throw new KeyVersionNotFoundError(parsed.version);
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, parsed.iv);
    decipher.setAuthTag(parsed.authTag);

    const decrypted = Buffer.concat([
      decipher.update(parsed.ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new DecryptionFailedError(error instanceof Error ? error : undefined);
  }
}

/**
 * Safely decrypt with a fallback value.
 */
export function safeDecryptVersioned(
  encrypted: string | null | undefined,
  fallback: string = ""
): DecryptResult<string> {
  if (encrypted === null || encrypted === undefined || encrypted === "") {
    return decryptSuccess(fallback);
  }

  try {
    const decrypted = decryptVersioned(encrypted);
    return decryptSuccess(decrypted);
  } catch (error) {
    if (error instanceof Error) {
      const { wrapEncryptionError } = require("./errors");
      return decryptFailure(wrapEncryptionError(error), fallback);
    }
    return decryptFailure(
      new DecryptionFailedError(),
      fallback
    );
  }
}

/**
 * Decrypt to number with fallback.
 */
export function safeDecryptVersionedNumber(
  encrypted: string | null | undefined,
  fallback: number = 0
): DecryptResult<number> {
  const result = safeDecryptVersioned(encrypted, String(fallback));

  if (!result.success) {
    // Type narrowing: result is DecryptFailure here
    const failureResult = result as { success: false; error: EncryptionError; fallback: string };
    return decryptFailure(failureResult.error, fallback);
  }

  const num = parseFloat(result.data);
  if (isNaN(num)) {
    return decryptFailure(
      new CorruptedDataError(encrypted || "", "Not a valid number"),
      fallback
    );
  }

  return decryptSuccess(num);
}

// ============================================
// Re-encryption for Key Rotation
// ============================================

/**
 * Re-encrypt a value with the current key.
 * Useful for migrating data during key rotation.
 *
 * @param encrypted - Currently encrypted value
 * @returns Value encrypted with current key
 */
export function reEncrypt(encrypted: string): string {
  const decrypted = decryptVersioned(encrypted);
  return encryptVersioned(decrypted);
}

/**
 * Check if a value needs re-encryption (encrypted with old key version).
 */
export function needsReEncryption(encrypted: string): boolean {
  try {
    const parsed = parseEncryptedData(encrypted);
    const { version: currentVersion } = keyManager.getCurrentKey();
    return parsed.version !== currentVersion;
  } catch {
    return false;
  }
}

/**
 * Get the key version used to encrypt a value.
 */
export function getEncryptionVersion(encrypted: string): string | null {
  try {
    const parsed = parseEncryptedData(encrypted);
    return parsed.version;
  } catch {
    return null;
  }
}

// ============================================
// Validation
// ============================================

/**
 * Check if a string appears to be encrypted (versioned or legacy format).
 */
export function isVersionedEncrypted(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const parts = value.split(SEPARATOR);

  // Check versioned format (4 parts)
  if (parts.length === 4) {
    const [version, iv, tag, data] = parts;
    return (
      version.startsWith("v") &&
      iv.length === 32 &&
      /^[0-9a-f]+$/i.test(iv) &&
      tag.length === 32 &&
      /^[0-9a-f]+$/i.test(tag) &&
      data.length > 0 &&
      /^[0-9a-f]+$/i.test(data)
    );
  }

  // Check legacy format (3 parts)
  if (parts.length === 3) {
    const [iv, tag, data] = parts;
    return (
      iv.length === 32 &&
      /^[0-9a-f]+$/i.test(iv) &&
      tag.length === 32 &&
      /^[0-9a-f]+$/i.test(tag) &&
      data.length > 0 &&
      /^[0-9a-f]+$/i.test(data)
    );
  }

  return false;
}

// ============================================
// Key Generation Utility
// ============================================

/**
 * Generate a new random encryption key.
 * Useful for initial setup or key rotation.
 *
 * @param version - Version string to prepend
 * @returns Versioned key string ready for ENCRYPTION_KEY env var
 */
export function generateKey(version: string = "v1"): string {
  const key = crypto.randomBytes(KEY_LENGTH);
  return `${version}:${key.toString("hex")}`;
}
