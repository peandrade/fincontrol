/**
 * Structured Logger
 *
 * Provides consistent, structured logging across the application.
 * Outputs JSON in production for easy parsing by log aggregators.
 * Uses readable format in development.
 *
 * Usage:
 * ```typescript
 * import { logger } from "@/lib/logger";
 *
 * // Simple logging
 * logger.info("User logged in", { userId: "123" });
 * logger.error("Failed to process payment", { orderId: "456", error: err });
 *
 * // Create a child logger with context
 * const log = logger.child({ service: "transactions", requestId: "abc-123" });
 * log.info("Processing transaction");
 * log.error("Transaction failed", { reason: "insufficient funds" });
 * ```
 */

// ============================================
// Types
// ============================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

// ============================================
// Configuration
// ============================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const minLevel = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? "debug" : "info");

// ============================================
// Helpers
// ============================================

function shouldLog(level: LogLevel): boolean {
  if (isTest) return false; // Suppress logs in tests
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatError(error: unknown): LogEntry["error"] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
    };
  }

  return {
    name: "Unknown",
    message: String(error),
  };
}

function extractError(context?: LogContext): { cleanContext?: LogContext; error?: LogEntry["error"] } {
  if (!context) return {};

  const { error, ...rest } = context;
  return {
    cleanContext: Object.keys(rest).length > 0 ? rest : undefined,
    error: formatError(error),
  };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  baseContext?: LogContext,
  additionalContext?: LogContext
): LogEntry {
  const mergedContext = { ...baseContext, ...additionalContext };
  const { cleanContext, error } = extractError(mergedContext);

  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: cleanContext,
    error,
  };
}

function formatForDevelopment(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    debug: "\x1b[90m", // gray
    info: "\x1b[36m",  // cyan
    warn: "\x1b[33m",  // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";
  const color = levelColors[entry.level];

  const time = entry.timestamp.split("T")[1].split(".")[0];
  const levelStr = entry.level.toUpperCase().padEnd(5);

  let output = `${color}[${time}] ${levelStr}${reset} ${entry.message}`;

  if (entry.context) {
    output += ` ${JSON.stringify(entry.context)}`;
  }

  if (entry.error) {
    output += `\n  ${color}Error: ${entry.error.name}: ${entry.error.message}${reset}`;
    if (entry.error.stack) {
      output += `\n${entry.error.stack.split("\n").slice(1).join("\n")}`;
    }
  }

  return output;
}

function formatForProduction(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function output(level: LogLevel, entry: LogEntry): void {
  const formatted = isDevelopment ? formatForDevelopment(entry) : formatForProduction(entry);

  switch (level) {
    case "debug":
    case "info":
      console.log(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

// ============================================
// Logger Implementation
// ============================================

function createLogger(baseContext?: LogContext): Logger {
  const log = (level: LogLevel, message: string, context?: LogContext): void => {
    if (!shouldLog(level)) return;
    const entry = createLogEntry(level, message, baseContext, context);
    output(level, entry);
  };

  return {
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context),
    child: (context) => createLogger({ ...baseContext, ...context }),
  };
}

// ============================================
// Export
// ============================================

/**
 * Main logger instance
 */
export const logger = createLogger();

/**
 * Create a logger for a specific service/module
 */
export function createServiceLogger(service: string): Logger {
  return logger.child({ service });
}

/**
 * Create a logger for an API request
 */
export function createRequestLogger(requestId: string, path: string): Logger {
  return logger.child({ requestId, path });
}

/**
 * Create a logger from request headers (extracts x-request-id)
 */
export function createLoggerFromRequest(request: Request): Logger {
  const requestId = request.headers.get("x-request-id") || generateRequestId();
  const url = new URL(request.url);
  return logger.child({ requestId, path: url.pathname, method: request.method });
}

/**
 * Generate a request ID (for cases where middleware didn't set one)
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// Specialized Loggers
// ============================================

/**
 * Pre-configured loggers for common services
 */
export const loggers = {
  api: createServiceLogger("api"),
  auth: createServiceLogger("auth"),
  db: createServiceLogger("database"),
  cache: createServiceLogger("cache"),
  email: createServiceLogger("email"),
  quotes: createServiceLogger("quotes"),
};
