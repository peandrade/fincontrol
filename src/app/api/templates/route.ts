import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateTemplateCache } from "@/lib/api-utils";
import { createTemplateSchema, validateBody } from "@/lib/schemas";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";

export async function GET() {
  return withAuth(async (session) => {
    const templates = await prisma.transactionTemplate.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { usageCount: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json(templates, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    });
  });
}

export async function POST(request: Request) {
  // Rate limit: 30 mutations per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.mutation,
    identifier: "templates-create",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async (session, req) => {
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createTemplateSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { name, type, category, description, value } = validation.data;

    const template = await prisma.transactionTemplate.create({
      data: {
        name,
        description: description || null,
        category,
        type,
        value: value || null,
        userId: session.user.id,
      },
    });

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return NextResponse.json(template, { status: 201 });
  }, request);
}
