import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateCategoryCache } from "@/lib/api-utils";
import { updateCategorySchema, validateBody } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!category) {
      return errorResponse("Categoria não encontrada", 404, "NOT_FOUND");
    }

    if (category.isDefault) {
      return errorResponse("Não é possível editar categorias padrão", 400, "FORBIDDEN_ACTION");
    }

    const body = await req.json();

    const validation = validateBody(updateCategorySchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { name, icon, color } = validation.data;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
      },
    });

    // Invalidate related caches
    invalidateCategoryCache(session.user.id);

    return NextResponse.json(updatedCategory);
  }, request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!category) {
      return errorResponse("Categoria não encontrada", 404, "NOT_FOUND");
    }

    if (category.isDefault) {
      return errorResponse("Não é possível excluir categorias padrão", 400, "FORBIDDEN_ACTION");
    }

    const transactionsCount = await prisma.transaction.count({
      where: {
        category: category.name,
        userId: session.user.id,
      },
    });

    if (transactionsCount > 0) {
      return errorResponse(
        `Não é possível excluir esta categoria. Existem ${transactionsCount} transações usando ela.`,
        400,
        "HAS_DEPENDENCIES"
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    // Invalidate related caches
    invalidateCategoryCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
