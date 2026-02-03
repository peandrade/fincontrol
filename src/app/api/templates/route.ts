import { NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateTemplateCache } from "@/lib/api-utils";
import { createTemplateSchema, validateBody } from "@/lib/schemas";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";
import { templateRepository } from "@/repositories";

export async function GET() {
  return withAuth(async (session) => {
    // Get templates using repository (handles decryption)
    const templates = await templateRepository.findByUser(session.user.id);

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

    // Create template using repository (handles encryption)
    const template = await templateRepository.create({
      userId: session.user.id,
      name,
      type,
      category,
      description: description || null,
      value: value || null,
    });

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return NextResponse.json(template, { status: 201 });
  }, request);
}
