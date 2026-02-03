import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import {
  ErrorCodes,
  HttpStatus,
  type ApiError,
  type ErrorCode,
  type ValidationErrorDetail,
} from "@/types/api";
import { serverCache, CacheTags } from "@/lib/server-cache";
import { API_VERSION, withVersion } from "@/lib/api-version";
import {
  isEncryptionError,
  getEncryptionErrorMessage,
  isKeyConfigurationError,
} from "@/lib/encryption";

// Re-export types for convenience
export type { ApiError, ErrorCode, ValidationErrorDetail };
export { ErrorCodes, HttpStatus };

// Re-export versioning utilities
export { API_VERSION, withVersion } from "@/lib/api-version";
export type { ApiVersion } from "@/lib/api-version";

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = HttpStatus.BAD_REQUEST,
  code: ErrorCode = ErrorCodes.BAD_REQUEST,
  details?: unknown
): NextResponse<ApiError> {
  const response = NextResponse.json(
    { error: message, code, details },
    { status }
  );
  return withVersion(response);
}

/**
 * Create a validation error response (422 Unprocessable Entity)
 */
export function validationErrorResponse(
  message: string,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: message, code: ErrorCodes.VALIDATION_ERROR, details },
    { status: HttpStatus.UNPROCESSABLE_ENTITY }
  );
}

/**
 * Create a standardized unauthorized response (401)
 */
export function unauthorizedResponse(): NextResponse<ApiError> {
  return NextResponse.json(
    { error: "Não autorizado", code: ErrorCodes.UNAUTHORIZED },
    { status: HttpStatus.UNAUTHORIZED }
  );
}

/**
 * Create a standardized not found response (404)
 */
export function notFoundResponse(resource: string = "Recurso"): NextResponse<ApiError> {
  return NextResponse.json(
    { error: `${resource} não encontrado`, code: ErrorCodes.NOT_FOUND },
    { status: HttpStatus.NOT_FOUND }
  );
}

/**
 * Create a standardized forbidden response (403)
 */
export function forbiddenResponse(): NextResponse<ApiError> {
  return NextResponse.json(
    { error: "Acesso negado", code: ErrorCodes.FORBIDDEN },
    { status: HttpStatus.FORBIDDEN }
  );
}

/**
 * Create a standardized server error response (500)
 */
export function serverErrorResponse(message: string = "Erro interno do servidor"): NextResponse<ApiError> {
  return NextResponse.json(
    { error: message, code: ErrorCodes.INTERNAL_ERROR },
    { status: HttpStatus.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Create a rate limit exceeded response (429)
 */
export function rateLimitResponse(retryAfter?: number): NextResponse<ApiError> {
  const headers: HeadersInit = {};
  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }
  return NextResponse.json(
    { error: "Muitas requisições. Tente novamente em alguns minutos.", code: ErrorCodes.RATE_LIMITED },
    { status: HttpStatus.TOO_MANY_REQUESTS, headers }
  );
}

/**
 * Create a conflict response (409)
 */
export function conflictResponse(message: string): NextResponse<ApiError> {
  return NextResponse.json(
    { error: message, code: ErrorCodes.CONFLICT },
    { status: HttpStatus.CONFLICT }
  );
}

/**
 * Create an encryption error response (500)
 * Returns user-friendly message without exposing technical details.
 */
export function encryptionErrorResponse(error: unknown): NextResponse<ApiError> {
  const message = getEncryptionErrorMessage(error);

  // Key configuration errors are server configuration issues
  if (isKeyConfigurationError(error)) {
    console.error("Encryption key configuration error:", error);
    return NextResponse.json(
      { error: message, code: ErrorCodes.INTERNAL_ERROR },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }

  // Data errors may indicate corruption or tampering
  console.error("Encryption error:", error);
  return NextResponse.json(
    { error: message, code: ErrorCodes.INTERNAL_ERROR },
    { status: HttpStatus.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Handle an error, returning appropriate response for encryption errors.
 */
export function handleApiError(error: unknown, operation: string): NextResponse<ApiError> {
  if (isEncryptionError(error)) {
    return encryptionErrorResponse(error);
  }

  console.error(`Erro ao ${operation}:`, error);
  return serverErrorResponse(`Erro ao ${operation}`);
}

/**
 * Authenticated session with guaranteed user ID
 */
export interface AuthenticatedSession extends Session {
  user: Session["user"] & {
    id: string;
  };
}

/**
 * Handler function type for authenticated routes.
 * Uses `unknown` as return type since handlers can return various response types.
 * Type safety is enforced at the handler level, not the wrapper level.
 */
export type AuthenticatedHandler = (
  session: AuthenticatedSession,
  request: Request
) => Promise<NextResponse<unknown>>;

/**
 * Wrapper for authenticated API routes.
 * Handles auth check and provides typed session to handler.
 *
 * Note: Returns `NextResponse<unknown>` because handlers return different types
 * for success vs error responses. Type safety is maintained at the route level.
 *
 * @example
 * // Simple usage
 * export async function GET(request: Request) {
 *   return withAuth(async (session) => {
 *     const data = await prisma.transaction.findMany({
 *       where: { userId: session.user.id }
 *     });
 *     return NextResponse.json(data);
 *   });
 * }
 *
 * @example
 * // With request body
 * export async function POST(request: Request) {
 *   return withAuth(async (session, req) => {
 *     const body = await req.json();
 *     // ... handle request
 *     return NextResponse.json(result, { status: 201 });
 *   }, request);
 * }
 */
export async function withAuth(
  handler: AuthenticatedHandler,
  request?: Request
): Promise<NextResponse<unknown>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    // Cast to authenticated session since we've verified user.id exists
    const authenticatedSession = session as AuthenticatedSession;

    return await handler(authenticatedSession, request || new Request("http://localhost"));
  } catch (error) {
    console.error("API Error:", error);
    return serverErrorResponse();
  }
}

/**
 * Wrapper for authenticated API routes with error handling.
 * Catches errors and returns standardized error responses.
 *
 * @example
 * export async function GET(request: Request) {
 *   return withAuthAndErrorHandling(async (session) => {
 *     const data = await prisma.transaction.findMany({
 *       where: { userId: session.user.id }
 *     });
 *     return NextResponse.json(data);
 *   }, "buscar transações");
 * }
 */
export async function withAuthAndErrorHandling(
  handler: AuthenticatedHandler,
  operation: string,
  request?: Request
): Promise<NextResponse<unknown>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const authenticatedSession = session as AuthenticatedSession;

    return await handler(authenticatedSession, request || new Request("http://localhost"));
  } catch (error) {
    console.error(`Erro ao ${operation}:`, error);
    return serverErrorResponse(`Erro ao ${operation}`);
  }
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Verify resource ownership
 */
export function verifyOwnership(
  resourceUserId: string | null | undefined,
  sessionUserId: string
): boolean {
  return resourceUserId === sessionUserId;
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    },
  });
}

/**
 * Extract pagination params from URL
 */
export function getPaginationParams(url: URL | string, defaults = { page: 1, pageSize: 50 }) {
  const searchParams = typeof url === "string" ? new URL(url).searchParams : url.searchParams;

  const page = Math.max(1, parseInt(searchParams.get("page") || String(defaults.page)));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || String(defaults.pageSize))));

  return { page, pageSize, skip: (page - 1) * pageSize };
}

// ============================================
// SUCCESS RESPONSE HELPERS
// ============================================

/**
 * Create a successful response (200 OK)
 */
export function successResponse<T>(data: T, headers?: HeadersInit): NextResponse<T> {
  const response = NextResponse.json(data, { status: HttpStatus.OK, headers });
  return withVersion(response);
}

/**
 * Create a created response (201 Created)
 */
export function createdResponse<T>(data: T): NextResponse<T> {
  const response = NextResponse.json(data, { status: HttpStatus.CREATED });
  return withVersion(response);
}

/**
 * Create a no content response (204 No Content)
 * Used for successful DELETE operations
 */
export function noContentResponse(): NextResponse<null> {
  const response = new NextResponse(null, { status: HttpStatus.NO_CONTENT }) as NextResponse<null>;
  withVersion(response);
  return response;
}

/**
 * Create a list response with optional pagination and summary
 */
export function listResponse<T, S = Record<string, unknown>>(
  data: T[],
  options?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
    };
    summary?: S;
    headers?: HeadersInit;
  }
): NextResponse {
  const response: Record<string, unknown> = { data };

  if (options?.pagination) {
    const { page, pageSize, total } = options.pagination;
    response.pagination = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    };
  }

  if (options?.summary) {
    response.summary = options.summary;
  }

  const jsonResponse = NextResponse.json(response, { status: HttpStatus.OK, headers: options?.headers });
  return withVersion(jsonResponse);
}

// ============================================
// CACHE INVALIDATION HELPERS
// ============================================

/**
 * Invalidate cache for transaction-related data
 */
export function invalidateTransactionCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.TRANSACTIONS, userId);
  serverCache.invalidateByTag(CacheTags.DASHBOARD, userId);
  serverCache.invalidateByTag(CacheTags.ANALYTICS, userId);
  serverCache.invalidateByTag(CacheTags.WEALTH, userId);
  serverCache.invalidateByTag(CacheTags.HEALTH_SCORE, userId);
}

/**
 * Invalidate cache for investment-related data
 */
export function invalidateInvestmentCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.INVESTMENTS, userId);
  serverCache.invalidateByTag(CacheTags.DASHBOARD, userId);
  serverCache.invalidateByTag(CacheTags.ANALYTICS, userId);
  serverCache.invalidateByTag(CacheTags.WEALTH, userId);
  serverCache.invalidateByTag(CacheTags.HEALTH_SCORE, userId);
}

/**
 * Invalidate cache for card-related data
 */
export function invalidateCardCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.CARDS, userId);
  serverCache.invalidateByTag(CacheTags.DASHBOARD, userId);
  serverCache.invalidateByTag(CacheTags.WEALTH, userId);
  serverCache.invalidateByTag(CacheTags.HEALTH_SCORE, userId);
}

/**
 * Invalidate cache for goal-related data
 */
export function invalidateGoalCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.GOALS, userId);
  serverCache.invalidateByTag(CacheTags.DASHBOARD, userId);
  serverCache.invalidateByTag(CacheTags.WEALTH, userId);
  serverCache.invalidateByTag(CacheTags.HEALTH_SCORE, userId);
}

/**
 * Invalidate cache for budget-related data
 */
export function invalidateBudgetCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.BUDGETS, userId);
  serverCache.invalidateByTag(CacheTags.HEALTH_SCORE, userId);
}

/**
 * Invalidate cache for category-related data
 */
export function invalidateCategoryCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.CATEGORIES, userId);
}

/**
 * Invalidate cache for template-related data
 */
export function invalidateTemplateCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.TEMPLATES, userId);
}

/**
 * Invalidate cache for recurring expense-related data
 */
export function invalidateRecurringCache(userId: string): void {
  serverCache.invalidateByTag(CacheTags.RECURRING, userId);
  serverCache.invalidateByTag(CacheTags.DASHBOARD, userId);
}

/**
 * Invalidate all cache for a user
 */
export function invalidateAllUserCache(userId: string): void {
  serverCache.invalidateUser(userId);
}
