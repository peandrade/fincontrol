import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoalCategory } from "@prisma/client";
import { withAuth, errorResponse, invalidateGoalCache } from "@/lib/api-utils";
import { createGoalSchema, validateBody } from "@/lib/schemas";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";

export interface GoalWithProgress {
  id: string;
  name: string;
  description: string | null;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  targetDate: Date | null;
  icon: string | null;
  color: string;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  progress: number;
  remaining: number;
  monthlyNeeded: number | null;
  contributionsCount: number;
}

export async function GET() {
  return withAuth(async (session) => {
    const goals = await prisma.financialGoal.findMany({
      where: { userId: session.user.id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: [{ isCompleted: "asc" }, { targetDate: "asc" }],
    });

    const goalsWithProgress: GoalWithProgress[] = goals.map((goal) => {
      const progress = goal.targetValue > 0
        ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
        : 0;
      const remaining = Math.max(goal.targetValue - goal.currentValue, 0);

      let monthlyNeeded: number | null = null;
      if (goal.targetDate && remaining > 0) {
        const now = new Date();
        const target = new Date(goal.targetDate);
        const monthsDiff =
          (target.getFullYear() - now.getFullYear()) * 12 +
          (target.getMonth() - now.getMonth());

        if (monthsDiff > 0) {
          monthlyNeeded = remaining / monthsDiff;
        }
      }

      return {
        ...goal,
        progress,
        remaining,
        monthlyNeeded,
        contributionsCount: goal.contributions.length,
      };
    });

    const summary = {
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.isCompleted).length,
      totalTargetValue: goals.reduce((sum, g) => sum + g.targetValue, 0),
      totalCurrentValue: goals.reduce((sum, g) => sum + g.currentValue, 0),
      overallProgress: goals.length > 0
        ? goals.reduce((sum, g) => sum + g.currentValue, 0) /
          goals.reduce((sum, g) => sum + g.targetValue, 0) * 100
        : 0,
    };

    return NextResponse.json({ goals: goalsWithProgress, summary }, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  });
}

export async function POST(request: NextRequest) {
  // Rate limit: 30 mutations per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.mutation,
    identifier: "goals-create",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async (session, req) => {
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createGoalSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400, "VALIDATION_ERROR", validation.details);
    }

    const { name, description, type, targetValue, deadline, icon, color, currentValue } = validation.data;

    const goal = await prisma.financialGoal.create({
      data: {
        name,
        description: description || null,
        category: type, // Schema uses 'type', DB uses 'category'
        targetValue,
        currentValue: currentValue || 0,
        targetDate: deadline ? new Date(deadline) : null,
        icon: icon || null,
        color: color || "#8B5CF6",
        userId: session.user.id,
      },
    });

    // Create initial contribution if there's a starting value
    if (currentValue && currentValue > 0) {
      await prisma.goalContribution.create({
        data: {
          goalId: goal.id,
          value: currentValue,
          date: new Date(),
          notes: "Valor inicial",
        },
      });
    }

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return NextResponse.json(goal, { status: 201 });
  }, request);
}
