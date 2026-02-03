/**
 * Standardized API response types and error codes.
 * All API routes should follow these patterns for consistency.
 */

// ============================================
// ERROR CODES
// ============================================

/**
 * Standard error codes used across all API routes.
 * Routes can also use custom error codes as strings.
 */
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",     // 422 - Invalid input data
  BAD_REQUEST: "BAD_REQUEST",               // 400 - Malformed request
  UNAUTHORIZED: "UNAUTHORIZED",             // 401 - Not authenticated
  FORBIDDEN: "FORBIDDEN",                   // 403 - No permission
  NOT_FOUND: "NOT_FOUND",                   // 404 - Resource not found
  CONFLICT: "CONFLICT",                     // 409 - Resource conflict (e.g., duplicate)
  RATE_LIMITED: "RATE_LIMITED",             // 429 - Too many requests

  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",         // 500 - Internal server error
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE", // 503 - External service down
} as const;

/** Standard error codes or custom string codes */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes] | string;

// ============================================
// ERROR RESPONSE
// ============================================

/**
 * Standard error response format.
 * All error responses should follow this structure.
 */
export interface ApiError {
  /** Human-readable error message (in Portuguese) */
  error: string;
  /** Machine-readable error code */
  code: ErrorCode;
  /** Additional error details (e.g., validation errors from Zod) */
  details?: unknown;
}

/**
 * Validation error detail for field-level errors.
 * Compatible with Zod's issue format.
 */
export interface ValidationErrorDetail {
  path?: (string | number)[];
  message: string;
  code?: string;
}

// ============================================
// PAGINATION
// ============================================

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Request parameters for paginated endpoints.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ============================================
// SUCCESS RESPONSES
// ============================================

/**
 * Standard response for single resource.
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Standard response for list of resources.
 */
export interface ApiListResponse<T> {
  data: T[];
  pagination?: PaginationMeta;
  meta?: Record<string, unknown>;
}

/**
 * Standard response for list with summary.
 */
export interface ApiListWithSummaryResponse<T, S = Record<string, unknown>> {
  data: T[];
  summary: S;
  pagination?: PaginationMeta;
}

/**
 * Standard response for created resource.
 * Status: 201 Created
 */
export interface ApiCreatedResponse<T> {
  data: T;
}

/**
 * Standard response for successful operation with message.
 */
export interface ApiSuccessResponse {
  success: true;
  message?: string;
}

// ============================================
// HTTP STATUS CODES
// ============================================

/**
 * Standard HTTP status codes used in the API.
 */
export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];

// ============================================
// RESPONSE HELPERS (Type Guards)
// ============================================

/**
 * Type guard to check if response is an error.
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    "code" in response
  );
}

/**
 * Type guard to check if response has pagination.
 */
export function hasPagination<T>(
  response: ApiListResponse<T>
): response is Required<Pick<ApiListResponse<T>, "pagination">> & ApiListResponse<T> {
  return response.pagination !== undefined;
}
