import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateBudgetCache } from "@/lib/api-utils";
import { updateBudgetSchema, validateBody } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await prisma.budget.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return errorResponse("Orçamento não encontrado", 404, "NOT_FOUND");
    }

    await prisma.budget.delete({
      where: { id },
    });

    // Invalidate related caches
    invalidateBudgetCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    const validation = validateBody(updateBudgetSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const existing = await prisma.budget.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return errorResponse("Orçamento não encontrado", 404, "NOT_FOUND");
    }

    const { category, limit, period } = validation.data;

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(limit !== undefined && { limit }),
        ...(period !== undefined && { period }),
      },
    });

    // Invalidate related caches
    invalidateBudgetCache(session.user.id);

    return NextResponse.json(budget);
  }, request);
}
