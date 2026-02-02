/**
 * Environment variable validation and typed access.
 * Validates required variables at startup and provides type-safe access.
 */

/**
 * Required environment variables - app will fail to start without these
 */
const requiredVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
] as const;

/**
 * Optional environment variables with defaults
 */
const optionalVars = {
  NEXTAUTH_URL: "http://localhost:3000",
  BRAPI_API_KEY: "",
  RESEND_API_KEY: "",
  DIRECT_URL: "",
} as const;

type RequiredVar = (typeof requiredVars)[number];
type OptionalVar = keyof typeof optionalVars;

interface EnvConfig {
  // Required
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  // Optional
  NEXTAUTH_URL: string;
  BRAPI_API_KEY: string;
  RESEND_API_KEY: string;
  DIRECT_URL: string;
  // Computed
  isProduction: boolean;
  isDevelopment: boolean;
}

let cachedEnv: EnvConfig | null = null;

/**
 * Validate that all required environment variables are set.
 * Throws an error with details if any are missing.
 */
function validateEnv(): void {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}\n\n` +
        `Please check your .env file or environment configuration.`
    );
  }
}

/**
 * Get validated environment configuration.
 * Validates on first call and caches the result.
 */
export function getEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  // Validate required vars
  validateEnv();

  // Build config with defaults for optional vars
  cachedEnv = {
    // Required (validated above)
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,

    // Optional with defaults
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || optionalVars.NEXTAUTH_URL,
    BRAPI_API_KEY: process.env.BRAPI_API_KEY || optionalVars.BRAPI_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY || optionalVars.RESEND_API_KEY,
    DIRECT_URL: process.env.DIRECT_URL || optionalVars.DIRECT_URL,

    // Computed
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
  };

  return cachedEnv;
}

/**
 * Check if a specific optional service is configured.
 */
export function isServiceConfigured(service: "brapi" | "resend" | "email"): boolean {
  const env = getEnv();

  switch (service) {
    case "brapi":
      return !!env.BRAPI_API_KEY;
    case "resend":
    case "email":
      return !!env.RESEND_API_KEY;
    default:
      return false;
  }
}

/**
 * Get a warning message for missing optional services.
 * Useful for logging during startup.
 */
export function getMissingServicesWarning(): string | null {
  const missing: string[] = [];

  if (!process.env.BRAPI_API_KEY) {
    missing.push("BRAPI_API_KEY (cotações de ações não funcionarão)");
  }
  if (!process.env.RESEND_API_KEY) {
    missing.push("RESEND_API_KEY (emails não serão enviados)");
  }

  if (missing.length === 0) {
    return null;
  }

  return `Optional environment variables not configured:\n${missing.map((v) => `  - ${v}`).join("\n")}`;
}

/**
 * Initialize environment validation.
 * Call this early in your app's startup (e.g., in instrumentation.ts or layout.tsx).
 */
export function initEnv(): EnvConfig {
  const env = getEnv();

  // Log warnings for missing optional services in development
  if (env.isDevelopment) {
    const warning = getMissingServicesWarning();
    if (warning) {
      console.warn(`\n⚠️  ${warning}\n`);
    }
  }

  return env;
}

// Type exports for consumers
export type { EnvConfig };
