/**
 * API Versioning Utilities
 *
 * Provides version management for the API, enabling:
 * - Version headers in responses
 * - Version negotiation via Accept header or query param
 * - Deprecation warnings for old versions
 *
 * Usage:
 * ```typescript
 * import { withVersion, API_VERSION } from "@/lib/api-version";
 *
 * // In an API route
 * export async function GET(request: Request) {
 *   const data = await fetchData();
 *   return withVersion(NextResponse.json(data));
 * }
 *
 * // Check requested version
 * const version = getRequestedVersion(request);
 * if (version === "v1") {
 *   // Return v1 format
 * } else {
 *   // Return latest format
 * }
 * ```
 *
 * Version Negotiation:
 * - Query param: ?api-version=v1
 * - Header: Accept: application/json; version=v1
 * - Header: X-API-Version: v1
 *
 * When adding a new version:
 * 1. Create new route files in /api/v2/{resource}/route.ts
 * 2. Keep v1 routes for backward compatibility
 * 3. Update API_VERSIONS and mark old versions as deprecated
 * 4. Add deprecation warnings for old versions
 */

// ============================================
// Configuration
// ============================================

/**
 * Current API version (latest)
 */
export const API_VERSION = "v1";

/**
 * Minimum supported API version
 */
export const MIN_API_VERSION = "v1";

/**
 * All supported API versions with their status
 */
export const API_VERSIONS = {
  v1: {
    status: "current" as const,
    deprecated: false,
    deprecationDate: null as string | null,
    sunsetDate: null as string | null,
  },
  // When adding v2:
  // v2: {
  //   status: "current" as const,
  //   deprecated: false,
  //   deprecationDate: null,
  //   sunsetDate: null,
  // },
  // v1: {
  //   status: "deprecated" as const,
  //   deprecated: true,
  //   deprecationDate: "2024-06-01",
  //   sunsetDate: "2024-12-01",
  // },
} as const;

export type ApiVersion = keyof typeof API_VERSIONS;

// ============================================
// Version Detection
// ============================================

/**
 * Extract requested API version from request
 * Priority: query param > X-API-Version header > Accept header > default
 */
export function getRequestedVersion(request: Request): ApiVersion {
  // 1. Check query parameter
  const url = new URL(request.url);
  const queryVersion = url.searchParams.get("api-version");
  if (queryVersion && isValidVersion(queryVersion)) {
    return queryVersion as ApiVersion;
  }

  // 2. Check X-API-Version header
  const headerVersion = request.headers.get("x-api-version");
  if (headerVersion && isValidVersion(headerVersion)) {
    return headerVersion as ApiVersion;
  }

  // 3. Check Accept header for version
  const accept = request.headers.get("accept");
  if (accept) {
    const versionMatch = accept.match(/version=(v\d+)/);
    if (versionMatch && isValidVersion(versionMatch[1])) {
      return versionMatch[1] as ApiVersion;
    }
  }

  // 4. Default to current version
  return API_VERSION;
}

/**
 * Check if a version string is valid
 */
export function isValidVersion(version: string): version is ApiVersion {
  return version in API_VERSIONS;
}

/**
 * Check if a version is deprecated
 */
export function isDeprecated(version: ApiVersion): boolean {
  return API_VERSIONS[version].deprecated;
}

// ============================================
// Response Helpers
// ============================================

/**
 * Add version headers to a response
 */
export function withVersion<T extends Response>(
  response: T,
  version: ApiVersion = API_VERSION
): T {
  response.headers.set("X-API-Version", version);
  response.headers.set("X-API-Latest-Version", API_VERSION);

  // Add deprecation headers if version is deprecated
  const versionInfo = API_VERSIONS[version];
  if (versionInfo.deprecated) {
    response.headers.set("Deprecation", "true");

    if (versionInfo.deprecationDate) {
      response.headers.set("X-Deprecation-Date", versionInfo.deprecationDate);
    }

    if (versionInfo.sunsetDate) {
      response.headers.set("Sunset", versionInfo.sunsetDate);
    }

    // Add Link header pointing to new version docs
    response.headers.set(
      "Link",
      `</api/docs>; rel="successor-version"; title="API ${API_VERSION}"`
    );
  }

  return response;
}

/**
 * Create a versioned JSON response
 */
export function versionedResponse<T>(
  data: T,
  options: {
    status?: number;
    version?: ApiVersion;
    headers?: HeadersInit;
  } = {}
): Response {
  const { status = 200, version = API_VERSION, headers = {} } = options;

  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  return withVersion(response, version);
}

// ============================================
// Version-specific Transformations
// ============================================

/**
 * Transform response data based on API version
 * Use this when you need to return different data formats for different versions
 *
 * @example
 * const data = await getData();
 * return versionedResponse(
 *   transformForVersion(data, version, {
 *     v1: (d) => ({ items: d, count: d.length }), // Old format
 *     v2: (d) => ({ data: d, meta: { total: d.length } }), // New format
 *   }),
 *   { version }
 * );
 */
export function transformForVersion<TInput, TOutput>(
  data: TInput,
  version: ApiVersion,
  transformers: Partial<Record<ApiVersion, (data: TInput) => TOutput>>
): TOutput | TInput {
  const transformer = transformers[version];
  if (transformer) {
    return transformer(data);
  }

  // If no transformer for this version, try the latest version
  const latestTransformer = transformers[API_VERSION];
  if (latestTransformer) {
    return latestTransformer(data);
  }

  // No transformation needed
  return data;
}

// ============================================
// Deprecation Utilities
// ============================================

/**
 * Get deprecation warning message for a version
 */
export function getDeprecationWarning(version: ApiVersion): string | null {
  const info = API_VERSIONS[version];
  if (!info.deprecated) return null;

  let message = `API version ${version} is deprecated.`;

  if (info.sunsetDate) {
    message += ` It will be removed on ${info.sunsetDate}.`;
  }

  message += ` Please upgrade to ${API_VERSION}.`;

  return message;
}

/**
 * Log deprecation warning (call this in route handlers when deprecated version is used)
 */
export function logDeprecationWarning(version: ApiVersion, path: string): void {
  if (!isDeprecated(version)) return;

  const warning = getDeprecationWarning(version);
  if (warning) {
    console.warn(`[API Deprecation] ${path}: ${warning}`);
  }
}
