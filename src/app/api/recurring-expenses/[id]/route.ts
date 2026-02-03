import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateRecurringCache } from "@/lib/api-utils";
import { updateRecurringExpenseSchema, validateBody } from "@/lib/schemas";
import { recurringRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await recurringRepository.findById(id, session.user.id);

    if (!existing) {
      return errorResponse("Despesa recorrente não encontrada", 404, "NOT_FOUND");
    }

    await recurringRepository.delete(id, session.user.id);

    // Invalidate related caches
    invalidateRecurringCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateRecurringExpenseSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const existing = await recurringRepository.findById(id, session.user.id);

    if (!existing) {
      return errorResponse("Despesa recorrente não encontrada", 404, "NOT_FOUND");
    }

    const { name, value, category, dueDay, isActive, description } = validation.data;

    // Update expense using repository (handles encryption)
    await recurringRepository.update(id, session.user.id, {
      ...(name !== undefined && { description: name }),
      ...(value !== undefined && { value }),
      ...(category !== undefined && { category }),
      ...(dueDay !== undefined && { dueDay }),
      ...(isActive !== undefined && { isActive }),
      ...(description !== undefined && { notes: description }),
    });

    // Fetch updated expense to return
    const expense = await recurringRepository.findById(id, session.user.id);

    // Invalidate related caches
    invalidateRecurringCache(session.user.id);

    return NextResponse.json(expense);
  }, request);
}
