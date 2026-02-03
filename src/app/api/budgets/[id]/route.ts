import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateBudgetCache } from "@/lib/api-utils";
import { updateBudgetSchema, validateBody } from "@/lib/schemas";
import { budgetRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await budgetRepository.findById(id, session.user.id);

    if (!existing) {
      return errorResponse("Orçamento não encontrado", 404, "NOT_FOUND");
    }

    await budgetRepository.delete(id, session.user.id);

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

    const existing = await budgetRepository.findById(id, session.user.id);

    if (!existing) {
      return errorResponse("Orçamento não encontrado", 404, "NOT_FOUND");
    }

    const { category, limit } = validation.data;

    await budgetRepository.update(id, session.user.id, {
      ...(category !== undefined && { category }),
      ...(limit !== undefined && { limit }),
    });

    // Fetch updated budget to return
    const budget = await budgetRepository.findById(id, session.user.id);

    // Invalidate related caches
    invalidateBudgetCache(session.user.id);

    return NextResponse.json(budget);
  }, request);
}
