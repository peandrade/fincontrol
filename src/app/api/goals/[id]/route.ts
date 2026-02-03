import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateGoalCache } from "@/lib/api-utils";
import { updateGoalSchema, validateBody } from "@/lib/schemas";
import { goalRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    // Get goal using repository (handles decryption)
    const goal = await goalRepository.findById(id, session.user.id, true);

    if (!goal) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    const targetValue = goal.targetValue as unknown as number;
    const currentValue = goal.currentValue as unknown as number;
    const progress = targetValue > 0
      ? Math.min((currentValue / targetValue) * 100, 100)
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

    const existing = await goalRepository.findById(id, session.user.id);

    if (!existing) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    const { name, description, type, targetValue, deadline, icon, color } = validation.data;

    // Update goal using repository (handles encryption)
    await goalRepository.update(id, session.user.id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { category: type }),
      ...(targetValue !== undefined && { targetValue }),
      ...(deadline !== undefined && { targetDate: deadline ? new Date(deadline) : null }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
    });

    // Fetch updated goal to return
    const goal = await goalRepository.findById(id, session.user.id);

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return NextResponse.json(goal);
  }, request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await goalRepository.findById(id, session.user.id);

    if (!existing) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    await goalRepository.delete(id, session.user.id);

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
