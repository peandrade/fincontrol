import { NextRequest, NextResponse } from "next/server";
import { GoalCategory } from "@prisma/client";
import { withAuth, errorResponse, invalidateGoalCache } from "@/lib/api-utils";
import { createGoalSchema, validateBody } from "@/lib/schemas";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";
import { goalRepository } from "@/repositories";

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
    // Get goals using repository (handles decryption)
    const goals = await goalRepository.findByUser(session.user.id, {
      includeContributions: true,
    });

    // Sort by completion status and target date
    const sortedGoals = [...goals].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (a.targetDate && b.targetDate) {
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }
      return 0;
    });

    const goalsWithProgress: GoalWithProgress[] = sortedGoals.map((goal) => {
      const targetValue = goal.targetValue as unknown as number;
      const currentValue = goal.currentValue as unknown as number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contributions = (goal as any).contributions || [];

      const progress = targetValue > 0
        ? Math.min((currentValue / targetValue) * 100, 100)
        : 0;
      const remaining = Math.max(targetValue - currentValue, 0);

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
        targetValue,
        currentValue,
        progress,
        remaining,
        monthlyNeeded,
        contributionsCount: contributions.length,
      };
    });

    const summary = {
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.isCompleted).length,
      totalTargetValue: goals.reduce((sum, g) => sum + (g.targetValue as unknown as number), 0),
      totalCurrentValue: goals.reduce((sum, g) => sum + (g.currentValue as unknown as number), 0),
      overallProgress: goals.length > 0
        ? goals.reduce((sum, g) => sum + (g.currentValue as unknown as number), 0) /
          goals.reduce((sum, g) => sum + (g.targetValue as unknown as number), 0) * 100
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

    // Create goal using repository (handles encryption)
    const goal = await goalRepository.create({
      userId: session.user.id,
      name,
      description: description || undefined,
      category: type, // Schema uses 'type', DB uses 'category'
      targetValue,
      currentValue: currentValue || 0,
      targetDate: deadline ? new Date(deadline) : undefined,
      icon: icon || undefined,
      color: color || "#8B5CF6",
    });

    // Create initial contribution if there's a starting value
    if (currentValue && currentValue > 0) {
      await goalRepository.addContribution(goal.id, session.user.id, {
        value: currentValue,
        date: new Date(),
        notes: "Valor inicial",
      });
    }

    // Invalidate related caches
    invalidateGoalCache(session.user.id);

    return NextResponse.json(goal, { status: 201 });
  }, request);
}
