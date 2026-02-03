import { NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateTemplateCache } from "@/lib/api-utils";
import { updateTemplateSchema, validateBody } from "@/lib/schemas";
import { templateRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    // Get template using repository (handles decryption)
    const template = await templateRepository.findById(id, session.user.id);

    if (!template) {
      return errorResponse("Template não encontrado", 404, "NOT_FOUND");
    }

    return NextResponse.json(template);
  });
}

export async function PUT(request: Request, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateTemplateSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const existingTemplate = await templateRepository.findById(id, session.user.id);

    if (!existingTemplate) {
      return errorResponse("Template não encontrado", 404, "NOT_FOUND");
    }

    const { name, type, category, description, value } = validation.data;

    // Update template using repository (handles encryption)
    const template = await templateRepository.update(id, session.user.id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(category !== undefined && { category }),
      ...(type !== undefined && { type }),
      ...(value !== undefined && { value }),
    });

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return NextResponse.json(template);
  }, request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existingTemplate = await templateRepository.findById(id, session.user.id);

    if (!existingTemplate) {
      return errorResponse("Template não encontrado", 404, "NOT_FOUND");
    }

    await templateRepository.delete(id, session.user.id);

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}

// POST to increment usage count
export async function POST(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existingTemplate = await templateRepository.findById(id, session.user.id);

    if (!existingTemplate) {
      return errorResponse("Template não encontrado", 404, "NOT_FOUND");
    }

    // Increment usage using repository
    const template = await templateRepository.incrementUsage(id, session.user.id);

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return NextResponse.json(template);
  });
}
