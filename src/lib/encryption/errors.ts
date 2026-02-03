/**
 * Encryption error handling module.
 *
 * Provides specific error types and result patterns for encryption operations,
 * allowing graceful handling of encryption failures.
 */

// ============================================
// Error Codes
// ============================================

/**
 * Specific error codes for encryption-related failures.
 */
export enum EncryptionErrorCode {
  /** ENCRYPTION_KEY environment variable is not set */
  MISSING_KEY = "ENCRYPTION_MISSING_KEY",
  /** ENCRYPTION_KEY has invalid format (not 64 hex characters) */
  INVALID_KEY = "ENCRYPTION_INVALID_KEY",
  /** Encrypted data format is invalid or corrupted */
  CORRUPTED_DATA = "ENCRYPTION_CORRUPTED_DATA",
  /** Decryption operation failed (wrong key or tampered data) */
  DECRYPTION_FAILED = "ENCRYPTION_DECRYPTION_FAILED",
  /** Encryption operation failed */
  ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
  /** Key version not found for decryption */
  KEY_VERSION_NOT_FOUND = "KEY_VERSION_NOT_FOUND",
}

// ============================================
// Error Classes
// ============================================

/**
 * Base error class for encryption-related errors.
 */
export class EncryptionError extends Error {
  public readonly code: EncryptionErrorCode;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: EncryptionErrorCode,
    originalError?: Error
  ) {
    super(message);
    this.name = "EncryptionError";
    this.code = code;
    this.originalError = originalError;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EncryptionError);
    }
  }

  /**
   * Create a human-readable error message including the code.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when the encryption key is missing.
 */
export class MissingKeyError extends EncryptionError {
  constructor() {
    super(
      "ENCRYPTION_KEY environment variable is not set. Encryption/decryption operations are unavailable.",
      EncryptionErrorCode.MISSING_KEY
    );
    this.name = "MissingKeyError";
  }
}

/**
 * Error thrown when the encryption key has invalid format.
 */
export class InvalidKeyError extends EncryptionError {
  constructor(actualLength: number) {
    super(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${actualLength} characters.`,
      EncryptionErrorCode.INVALID_KEY
    );
    this.name = "InvalidKeyError";
  }
}

/**
 * Error thrown when encrypted data format is corrupted.
 */
export class CorruptedDataError extends EncryptionError {
  public readonly encryptedValue: string;

  constructor(encryptedValue: string, reason?: string) {
    const message = reason
      ? `Encrypted data is corrupted: ${reason}`
      : "Encrypted data format is invalid or corrupted";
    super(message, EncryptionErrorCode.CORRUPTED_DATA);
    this.name = "CorruptedDataError";
    this.encryptedValue = encryptedValue.substring(0, 50) + (encryptedValue.length > 50 ? "..." : "");
  }
}

/**
 * Error thrown when decryption fails.
 */
export class DecryptionFailedError extends EncryptionError {
  constructor(originalError?: Error) {
    super(
      "Failed to decrypt data. The encryption key may be incorrect or the data may be tampered.",
      EncryptionErrorCode.DECRYPTION_FAILED,
      originalError
    );
    this.name = "DecryptionFailedError";
  }
}

/**
 * Error thrown when a key version is not found.
 */
export class KeyVersionNotFoundError extends EncryptionError {
  public readonly version: string;

  constructor(version: string) {
    super(
      `Encryption key version '${version}' not found. The data may have been encrypted with a key that is no longer available.`,
      EncryptionErrorCode.KEY_VERSION_NOT_FOUND
    );
    this.name = "KeyVersionNotFoundError";
    this.version = version;
  }
}

// ============================================
// Result Type for Safe Operations
// ============================================

/**
 * Success result from a safe decryption operation.
 */
export interface DecryptSuccess<T> {
  success: true;
  data: T;
}

/**
 * Failure result from a safe decryption operation.
 */
export interface DecryptFailure<T> {
  success: false;
  error: EncryptionError;
  /** Fallback value to use when decryption fails */
  fallback: T;
}

/**
 * Result type for safe decryption operations.
 * Allows handling failures gracefully without throwing exceptions.
 */
export type DecryptResult<T> = DecryptSuccess<T> | DecryptFailure<T>;

/**
 * Create a success result.
 */
export function decryptSuccess<T>(data: T): DecryptSuccess<T> {
  return { success: true, data };
}

/**
 * Create a failure result with a fallback value.
 */
export function decryptFailure<T>(error: EncryptionError, fallback: T): DecryptFailure<T> {
  return { success: false, error, fallback };
}

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Check if an error is an encryption-related error.
 */
export function isEncryptionError(error: unknown): error is EncryptionError {
  return error instanceof EncryptionError;
}

/**
 * Check if an error indicates missing or invalid key configuration.
 */
export function isKeyConfigurationError(error: unknown): boolean {
  if (!isEncryptionError(error)) return false;
  return (
    error.code === EncryptionErrorCode.MISSING_KEY ||
    error.code === EncryptionErrorCode.INVALID_KEY
  );
}

/**
 * Check if an error indicates corrupted or tampered data.
 */
export function isDataError(error: unknown): boolean {
  if (!isEncryptionError(error)) return false;
  return (
    error.code === EncryptionErrorCode.CORRUPTED_DATA ||
    error.code === EncryptionErrorCode.DECRYPTION_FAILED
  );
}

/**
 * Get a user-friendly error message for encryption errors.
 * Returns Portuguese messages for user-facing errors.
 */
export function getEncryptionErrorMessage(error: unknown): string {
  if (!isEncryptionError(error)) {
    return "Erro ao processar dados criptografados";
  }

  switch (error.code) {
    case EncryptionErrorCode.MISSING_KEY:
      return "Configuração de segurança não encontrada. Contate o suporte.";
    case EncryptionErrorCode.INVALID_KEY:
      return "Configuração de segurança inválida. Contate o suporte.";
    case EncryptionErrorCode.CORRUPTED_DATA:
      return "Dados corrompidos. Tente novamente ou contate o suporte.";
    case EncryptionErrorCode.DECRYPTION_FAILED:
      return "Falha ao descriptografar dados. Contate o suporte.";
    case EncryptionErrorCode.KEY_VERSION_NOT_FOUND:
      return "Versão de chave não encontrada. Contate o suporte.";
    default:
      return "Erro de criptografia. Contate o suporte.";
  }
}

/**
 * Wrap an error into an EncryptionError if it isn't already one.
 */
export function wrapEncryptionError(error: unknown): EncryptionError {
  if (isEncryptionError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Check for common crypto errors
    if (error.message.includes("Unsupported state or unable to authenticate data")) {
      return new DecryptionFailedError(error);
    }
    if (error.message.includes("Invalid IV length") || error.message.includes("Invalid key length")) {
      return new CorruptedDataError("", error.message);
    }

    return new EncryptionError(
      error.message,
      EncryptionErrorCode.ENCRYPTION_FAILED,
      error
    );
  }

  return new EncryptionError(
    String(error),
    EncryptionErrorCode.ENCRYPTION_FAILED
  );
}
