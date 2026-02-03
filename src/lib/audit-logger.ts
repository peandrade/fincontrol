/**
 * Audit Logger
 *
 * Tracks access to sensitive data for security and compliance purposes.
 * Logs operations like reading, decrypting, modifying, and exporting financial data.
 *
 * Usage:
 * ```typescript
 * import { auditLogger, AuditAction } from "@/lib/audit-logger";
 *
 * // Log a read operation
 * auditLogger.log({
 *   userId: session.user.id,
 *   action: AuditAction.READ,
 *   model: "Transaction",
 *   recordId: transaction.id,
 * });
 *
 * // Log decryption of specific fields
 * auditLogger.logDecryption(userId, "Transaction", transactionId, ["value", "description"]);
 *
 * // Log bulk export
 * auditLogger.logExport(userId, "Transaction", 150);
 * ```
 */

import { logger, createServiceLogger } from "./logger";
import type { EncryptedModel } from "./encryption/field-config";

// ============================================
// Types
// ============================================

/**
 * Audit action types for tracking different operations.
 */
export enum AuditAction {
  /** Reading data (without decryption) */
  READ = "read",
  /** Decrypting sensitive fields */
  DECRYPT = "decrypt",
  /** Creating new records */
  CREATE = "create",
  /** Updating existing records */
  UPDATE = "update",
  /** Deleting records */
  DELETE = "delete",
  /** Exporting data */
  EXPORT = "export",
  /** Importing data */
  IMPORT = "import",
  /** Authentication events */
  AUTH = "auth",
  /** Sensitive setting changes */
  SETTINGS = "settings",
}

/**
 * Audit event severity levels.
 */
export enum AuditSeverity {
  /** Normal operations */
  INFO = "info",
  /** Operations that should be monitored */
  NOTICE = "notice",
  /** Potentially concerning operations */
  WARNING = "warning",
  /** Security-relevant events */
  CRITICAL = "critical",
}

/**
 * Full audit context for logging.
 */
export interface AuditContext {
  /** User performing the action */
  userId: string;
  /** Type of action */
  action: AuditAction;
  /** Model/resource being accessed */
  model: string;
  /** Specific record ID if applicable */
  recordId?: string;
  /** Fields being accessed/modified */
  fields?: string[];
  /** Number of records affected */
  count?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** IP address if available */
  ipAddress?: string;
  /** User agent if available */
  userAgent?: string;
  /** Event severity */
  severity?: AuditSeverity;
}

/**
 * Audit log entry as stored/transmitted.
 */
export interface AuditLogEntry extends AuditContext {
  timestamp: string;
  eventId: string;
}

/**
 * Audit logger configuration.
 */
export interface AuditLoggerConfig {
  /** Enable/disable audit logging */
  enabled: boolean;
  /** Minimum severity to log */
  minSeverity: AuditSeverity;
  /** Log decryption events (can be high volume) */
  logDecryption: boolean;
  /** Log read events (can be very high volume) */
  logReads: boolean;
  /** Custom log handler */
  handler?: (entry: AuditLogEntry) => void | Promise<void>;
}

// ============================================
// Default Configuration
// ============================================

const defaultConfig: AuditLoggerConfig = {
  enabled: process.env.AUDIT_LOGGING !== "false",
  minSeverity: AuditSeverity.INFO,
  logDecryption: process.env.AUDIT_LOG_DECRYPTION === "true",
  logReads: process.env.AUDIT_LOG_READS === "true",
};

// ============================================
// Severity Mapping
// ============================================

const severityLevels: Record<AuditSeverity, number> = {
  [AuditSeverity.INFO]: 0,
  [AuditSeverity.NOTICE]: 1,
  [AuditSeverity.WARNING]: 2,
  [AuditSeverity.CRITICAL]: 3,
};

/**
 * Get default severity for an action.
 */
function getDefaultSeverity(action: AuditAction): AuditSeverity {
  switch (action) {
    case AuditAction.DELETE:
    case AuditAction.EXPORT:
    case AuditAction.SETTINGS:
      return AuditSeverity.NOTICE;
    case AuditAction.AUTH:
      return AuditSeverity.NOTICE;
    default:
      return AuditSeverity.INFO;
  }
}

// ============================================
// Audit Logger Class
// ============================================

/**
 * Audit logger for tracking sensitive data access.
 */
class AuditLogger {
  private config: AuditLoggerConfig;
  private auditLog = createServiceLogger("audit");

  constructor(config?: Partial<AuditLoggerConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Generate a unique event ID.
   */
  private generateEventId(): string {
    return `audit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Check if an event should be logged based on configuration.
   */
  private shouldLog(action: AuditAction, severity: AuditSeverity): boolean {
    if (!this.config.enabled) return false;

    // Check severity threshold
    if (severityLevels[severity] < severityLevels[this.config.minSeverity]) {
      return false;
    }

    // Check action-specific settings
    if (action === AuditAction.DECRYPT && !this.config.logDecryption) {
      return false;
    }

    if (action === AuditAction.READ && !this.config.logReads) {
      return false;
    }

    return true;
  }

  /**
   * Log an audit event.
   */
  async logEvent(context: AuditContext): Promise<void> {
    const severity = context.severity ?? getDefaultSeverity(context.action);

    if (!this.shouldLog(context.action, severity)) {
      return;
    }

    const entry: AuditLogEntry = {
      ...context,
      severity,
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
    };

    // Use custom handler if provided
    if (this.config.handler) {
      try {
        await this.config.handler(entry);
      } catch (error) {
        this.auditLog.error("Custom audit handler failed", { error, entry });
      }
    }

    // Always log to structured logger
    const logMethod = severity === AuditSeverity.CRITICAL ? "error" :
                      severity === AuditSeverity.WARNING ? "warn" : "info";

    this.auditLog[logMethod](`[AUDIT] ${context.action.toUpperCase()} ${context.model}`, {
      eventId: entry.eventId,
      userId: entry.userId,
      action: entry.action,
      model: entry.model,
      recordId: entry.recordId,
      fields: entry.fields,
      count: entry.count,
      severity: entry.severity,
      metadata: entry.metadata,
    });
  }

  /**
   * Shorthand for logging events.
   */
  log(context: AuditContext): void {
    // Fire and forget - don't await
    this.logEvent(context).catch((error) => {
      logger.error("Failed to log audit event", { error });
    });
  }

  /**
   * Log a decryption event.
   */
  logDecryption(
    userId: string,
    model: EncryptedModel | string,
    recordId?: string,
    fields?: string[]
  ): void {
    this.log({
      userId,
      action: AuditAction.DECRYPT,
      model,
      recordId,
      fields,
    });
  }

  /**
   * Log a read event.
   */
  logRead(
    userId: string,
    model: string,
    recordId?: string,
    count?: number
  ): void {
    this.log({
      userId,
      action: AuditAction.READ,
      model,
      recordId,
      count,
    });
  }

  /**
   * Log a create event.
   */
  logCreate(
    userId: string,
    model: string,
    recordId: string
  ): void {
    this.log({
      userId,
      action: AuditAction.CREATE,
      model,
      recordId,
    });
  }

  /**
   * Log an update event.
   */
  logUpdate(
    userId: string,
    model: string,
    recordId: string,
    fields?: string[]
  ): void {
    this.log({
      userId,
      action: AuditAction.UPDATE,
      model,
      recordId,
      fields,
    });
  }

  /**
   * Log a delete event.
   */
  logDelete(
    userId: string,
    model: string,
    recordId: string
  ): void {
    this.log({
      userId,
      action: AuditAction.DELETE,
      model,
      recordId,
      severity: AuditSeverity.NOTICE,
    });
  }

  /**
   * Log an export event.
   */
  logExport(
    userId: string,
    model: string,
    count: number,
    format?: string
  ): void {
    this.log({
      userId,
      action: AuditAction.EXPORT,
      model,
      count,
      metadata: format ? { format } : undefined,
      severity: AuditSeverity.NOTICE,
    });
  }

  /**
   * Log an import event.
   */
  logImport(
    userId: string,
    model: string,
    count: number,
    source?: string
  ): void {
    this.log({
      userId,
      action: AuditAction.IMPORT,
      model,
      count,
      metadata: source ? { source } : undefined,
      severity: AuditSeverity.NOTICE,
    });
  }

  /**
   * Log an authentication event.
   */
  logAuth(
    userId: string,
    event: "login" | "logout" | "password_change" | "password_reset" | "failed_login",
    metadata?: Record<string, unknown>
  ): void {
    const severity = event === "failed_login" ? AuditSeverity.WARNING : AuditSeverity.NOTICE;

    this.log({
      userId,
      action: AuditAction.AUTH,
      model: "User",
      metadata: { event, ...metadata },
      severity,
    });
  }

  /**
   * Log a settings change event.
   */
  logSettingsChange(
    userId: string,
    setting: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      userId,
      action: AuditAction.SETTINGS,
      model: "Settings",
      fields: [setting],
      metadata,
      severity: AuditSeverity.NOTICE,
    });
  }

  /**
   * Update configuration at runtime.
   */
  configure(config: Partial<AuditLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable audit logging.
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable audit logging.
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if audit logging is enabled.
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// ============================================
// Export
// ============================================

/**
 * Default audit logger instance.
 */
export const auditLogger = new AuditLogger();

/**
 * Create a custom audit logger with specific configuration.
 */
export function createAuditLogger(config?: Partial<AuditLoggerConfig>): AuditLogger {
  return new AuditLogger(config);
}

/**
 * Convenience function for logging decryption events.
 */
export function logDecryption(
  userId: string,
  model: EncryptedModel | string,
  recordId?: string,
  fields?: string[]
): void {
  auditLogger.logDecryption(userId, model, recordId, fields);
}

/**
 * Convenience function for logging read events.
 */
export function logAuditRead(
  userId: string,
  model: string,
  recordId?: string,
  count?: number
): void {
  auditLogger.logRead(userId, model, recordId, count);
}
