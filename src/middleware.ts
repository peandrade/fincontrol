import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================
// Configuration
// ============================================

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/docs"];
const publicApiRoutes = ["/api/auth", "/api/rates", "/api/investments/quotes", "/api/docs"];

// Paths to skip logging (static assets, health checks, etc.)
const skipLoggingPaths = [
  "/_next",
  "/favicon.ico",
  "/api/health",
];

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING !== "false";

// ============================================
// Logging Helpers (Edge-compatible)
// ============================================

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

function shouldLog(pathname: string): boolean {
  if (isTest || !enableRequestLogging) return false;
  return !skipLoggingPaths.some((path) => pathname.startsWith(path));
}

interface RequestLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  requestId: string;
  method: string;
  path: string;
  status?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
}

function formatLog(entry: RequestLogEntry): string {
  if (isDevelopment) {
    const statusColor = entry.status
      ? entry.status >= 500
        ? "\x1b[31m" // red
        : entry.status >= 400
        ? "\x1b[33m" // yellow
        : "\x1b[32m" // green
      : "\x1b[36m"; // cyan
    const reset = "\x1b[0m";
    const gray = "\x1b[90m";

    const time = entry.timestamp.split("T")[1].split(".")[0];
    const duration = entry.duration ? ` ${gray}${entry.duration}ms${reset}` : "";
    const status = entry.status ? ` ${statusColor}${entry.status}${reset}` : "";

    return `${gray}[${time}]${reset} ${entry.method} ${entry.path}${status}${duration} ${gray}${entry.requestId}${reset}`;
  }

  // Production: JSON format
  return JSON.stringify(entry);
}

function logRequest(entry: RequestLogEntry): void {
  const formatted = formatLog(entry);
  if (entry.level === "error") {
    console.error(formatted);
  } else if (entry.level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

// ============================================
// Middleware
// ============================================

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const requestId = generateRequestId();

  // Log incoming request
  const shouldLogRequest = shouldLog(pathname);
  if (shouldLogRequest) {
    logRequest({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Incoming request",
      requestId,
      method: request.method,
      path: pathname,
      userAgent: request.headers.get("user-agent") || undefined,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });
  }

  // Check if public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Helper to create response with request ID header and logging
  const createResponse = (
    response: NextResponse,
    status?: number
  ): NextResponse => {
    // Add request ID to response headers for tracing
    response.headers.set("x-request-id", requestId);

    // Log response
    if (shouldLogRequest) {
      const duration = Date.now() - startTime;
      const responseStatus = status || response.status || 200;

      logRequest({
        timestamp: new Date().toISOString(),
        level: responseStatus >= 500 ? "error" : responseStatus >= 400 ? "warn" : "info",
        message: "Request completed",
        requestId,
        method: request.method,
        path: pathname,
        status: responseStatus,
        duration,
      });
    }

    return response;
  };

  // Allow public routes
  if (isPublicRoute || isPublicApiRoute) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Check for auth token
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Redirect to login for unauthenticated page requests
  if (!token && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    return createResponse(response, 302);
  }

  // Return 401 for unauthenticated API requests
  if (!token && pathname.startsWith("/api/")) {
    const response = NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    return createResponse(response, 401);
  }

  // Continue with authenticated request
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  // Add request ID to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
