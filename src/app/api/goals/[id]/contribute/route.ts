import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateGoalCache } from "@/lib/api-utils";
import { createGoalContributionSchema, validateBody } from "@/lib/schemas";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const deleteContributionSchema = z.object({
  contributionId: z.string().min(1, "ID da contribuição é obrigatório"),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    // Override goalId with the one from params
    const validation = validateBody(createGoalContributionSchema, { ...body, goalId: id });
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const goal = await prisma.financialGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    const { value, date, notes } = validation.data;

    const contribution = await prisma.goalContribution.create({
      data: {
        goalId: id,
        value,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    });

    const newCurrentValue = goal.currentValue + value;
    const isCompleted = newCurrentValue >= goal.targetValue;

    await prisma.financialGoal.update({
      where: { id },
      data: {
        currentValue: newCurrentValue,
        isCompleted,
        completedAt: isCompleted && !goal.isCompleted ? new Date() : goal.completedAt,
      },
    });

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return NextResponse.json({
      contribution,
      newCurrentValue,
      isCompleted,
    });
  }, request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    const validation = validateBody(deleteContributionSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { contributionId } = validation.data;

    const goal = await prisma.financialGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    const contribution = await prisma.goalContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution || contribution.goalId !== id) {
      return errorResponse("Contribuição não encontrada", 404, "NOT_FOUND");
    }

    await prisma.goalContribution.delete({
      where: { id: contributionId },
    });

    const newCurrentValue = Math.max(goal.currentValue - contribution.value, 0);
    await prisma.financialGoal.update({
      where: { id },
      data: {
        currentValue: newCurrentValue,
        isCompleted: newCurrentValue >= goal.targetValue,
      },
    });

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return NextResponse.json({ success: true });
  }, request);
}
