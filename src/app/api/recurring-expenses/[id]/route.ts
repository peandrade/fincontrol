import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateRecurringCache } from "@/lib/api-utils";
import { updateRecurringExpenseSchema, validateBody } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await prisma.recurringExpense.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Despesa recorrente não encontrada", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    await prisma.recurringExpense.delete({
      where: { id },
    });

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

    const existing = await prisma.recurringExpense.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Despesa recorrente não encontrada", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    const { name, value, category, dueDay, isActive, description } = validation.data;

    const expense = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(name !== undefined && { description: name }),
        ...(value !== undefined && { value }),
        ...(category !== undefined && { category }),
        ...(dueDay !== undefined && { dueDay }),
        ...(isActive !== undefined && { isActive }),
        ...(description !== undefined && { notes: description }),
      },
    });

    // Invalidate related caches
    invalidateRecurringCache(session.user.id);

    return NextResponse.json(expense);
  }, request);
}
