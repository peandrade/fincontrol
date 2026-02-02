import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateGoalCache } from "@/lib/api-utils";
import { updateGoalSchema, validateBody } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const goal = await prisma.financialGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!goal) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    if (goal.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    const progress = goal.targetValue > 0
      ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
      : 0;

    return NextResponse.json({ ...goal, progress });
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateGoalSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const existing = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    const { name, description, type, targetValue, deadline, icon, color } = validation.data;

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { category: type }),
        ...(targetValue !== undefined && { targetValue }),
        ...(deadline !== undefined && { targetDate: deadline ? new Date(deadline) : null }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
      },
    });

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return NextResponse.json(goal);
  }, request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    await prisma.financialGoal.delete({
      where: { id },
    });

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
