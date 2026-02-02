import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateTemplateCache } from "@/lib/api-utils";
import { updateTemplateSchema, validateBody } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const template = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

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

    const existingTemplate = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return errorResponse("Template não encontrado", 404, "NOT_FOUND");
    }

    const { name, type, category, description, value } = validation.data;

    const template = await prisma.transactionTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(category !== undefined && { category }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value }),
      },
    });

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return NextResponse.json(template);
  }, request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existingTemplate = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return errorResponse("Template não encontrado", 404, "NOT_FOUND");
    }

    await prisma.transactionTemplate.delete({
      where: { id },
    });

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}

// POST to increment usage count
export async function POST(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existingTemplate = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return errorResponse("Template não encontrado", 404, "NOT_FOUND");
    }

    const template = await prisma.transactionTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    // Invalidate related caches
    invalidateTemplateCache(session.user.id);

    return NextResponse.json(template);
  });
}
