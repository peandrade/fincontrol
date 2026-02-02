import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";
import { differenceInMonths, differenceInDays, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GoalMilestone {
  percentage: number;
  reached: boolean;
  reachedAt?: string;
  value: number;
}

interface GoalProgress {
  goalId: string;
  name: string;
  category: string;
  color: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  milestones: GoalMilestone[];
  monthlyContributions: {
    month: string;
    value: number;
  }[];
  averageContribution: number;
  daysToTarget: number | null;
  onTrack: boolean;
  projectedCompletion: string | null;
}

interface GoalInsight {
  type: "positive" | "negative" | "neutral" | "achievement";
  title: string;
  description: string;
  goalName?: string;
}

export async function GET() {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    // Fetch goals with contributions
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (goals.length === 0) {
      return NextResponse.json({
        goalsProgress: [],
        insights: [],
        summary: {
          totalGoals: 0,
          completedGoals: 0,
          activeGoals: 0,
          totalSaved: 0,
          totalTarget: 0,
          overallProgress: 0,
          monthlyAverage: 0,
          goalsOnTrack: 0,
        },
      });
    }

    const goalsProgress: GoalProgress[] = [];
    const insights: GoalInsight[] = [];

    for (const goal of goals) {
      const progress = goal.targetValue > 0
        ? (goal.currentValue / goal.targetValue) * 100
        : 0;

      // Calculate milestones
      const milestonePercentages = [25, 50, 75, 100];
      const milestones: GoalMilestone[] = milestonePercentages.map((percentage) => {
        const milestoneValue = (goal.targetValue * percentage) / 100;
        const reached = goal.currentValue >= milestoneValue;

        // Find when milestone was reached (if applicable)
        let reachedAt: string | undefined;
        if (reached && goal.contributions.length > 0) {
          let runningTotal = 0;
          const sortedContributions = [...goal.contributions].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          for (const contrib of sortedContributions) {
            runningTotal += contrib.value;
            if (runningTotal >= milestoneValue) {
              reachedAt = format(new Date(contrib.date), "dd/MM/yyyy");
              break;
            }
          }
        }

        return {
          percentage,
          reached,
          reachedAt,
          value: milestoneValue,
        };
      });

      // Monthly contributions (last 6 months)
      const monthlyData: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const monthKey = format(subMonths(now, i), "yyyy-MM");
        monthlyData[monthKey] = 0;
      }

      for (const contrib of goal.contributions) {
        const contribDate = new Date(contrib.date);
        if (contribDate >= sixMonthsAgo) {
          const monthKey = format(contribDate, "yyyy-MM");
          if (monthKey in monthlyData) {
            monthlyData[monthKey] += contrib.value;
          }
        }
      }

      const monthlyContributions = Object.entries(monthlyData).map(([month, value]) => ({
        month: format(new Date(month + "-01"), "MMM", { locale: ptBR }),
        value,
      }));

      // Average monthly contribution
      const totalContribLastSixMonths = Object.values(monthlyData).reduce((a, b) => a + b, 0);
      const averageContribution = totalContribLastSixMonths / 6;

      // Days to target
      let daysToTarget: number | null = null;
      if (goal.targetDate) {
        daysToTarget = differenceInDays(new Date(goal.targetDate), now);
      }

      // On track calculation
      const remaining = goal.targetValue - goal.currentValue;
      let onTrack = true;
      let projectedCompletion: string | null = null;

      if (remaining > 0 && averageContribution > 0) {
        const monthsNeeded = remaining / averageContribution;
        const projectedDate = subMonths(now, -Math.ceil(monthsNeeded));
        projectedCompletion = format(projectedDate, "MMM yyyy", { locale: ptBR });

        if (goal.targetDate) {
          const targetDate = new Date(goal.targetDate);
          const monthsAvailable = differenceInMonths(targetDate, now);
          onTrack = monthsNeeded <= monthsAvailable;
        }
      } else if (remaining <= 0) {
        onTrack = true;
        projectedCompletion = "Concluída";
      } else {
        onTrack = false;
      }

      goalsProgress.push({
        goalId: goal.id,
        name: goal.name,
        category: goal.category,
        color: goal.color,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        progress: Math.min(progress, 100),
        milestones,
        monthlyContributions,
        averageContribution,
        daysToTarget,
        onTrack,
        projectedCompletion,
      });
    }

    // Generate insights
    const activeGoals = goals.filter((g) => !g.isCompleted);
    const completedGoals = goals.filter((g) => g.isCompleted);

    // Recently completed
    const recentlyCompleted = completedGoals.filter((g) => {
      if (!g.completedAt) return false;
      const daysSince = differenceInDays(now, new Date(g.completedAt));
      return daysSince <= 30;
    });

    if (recentlyCompleted.length > 0) {
      insights.push({
        type: "achievement",
        title: "Meta concluída!",
        description: `Parabéns! Você completou "${recentlyCompleted[0].name}"`,
        goalName: recentlyCompleted[0].name,
      });
    }

    // Goals approaching deadline
    const urgentGoals = activeGoals.filter((g) => {
      if (!g.targetDate) return false;
      const daysRemaining = differenceInDays(new Date(g.targetDate), now);
      return daysRemaining > 0 && daysRemaining <= 30;
    });

    if (urgentGoals.length > 0) {
      insights.push({
        type: "negative",
        title: "Prazo se aproximando",
        description: `"${urgentGoals[0].name}" vence em menos de 30 dias`,
        goalName: urgentGoals[0].name,
      });
    }

    // Goals not on track
    const offTrackGoals = goalsProgress.filter((g) => !g.onTrack && g.progress < 100);
    if (offTrackGoals.length > 0) {
      insights.push({
        type: "neutral",
        title: "Aumente suas contribuições",
        description: `${offTrackGoals.length} meta${offTrackGoals.length !== 1 ? "s" : ""} precisa${offTrackGoals.length !== 1 ? "m" : ""} de mais aportes`,
      });
    }

    // Good progress
    const onTrackGoals = goalsProgress.filter((g) => g.onTrack && g.progress > 0 && g.progress < 100);
    if (onTrackGoals.length > 0) {
      insights.push({
        type: "positive",
        title: "No caminho certo",
        description: `${onTrackGoals.length} meta${onTrackGoals.length !== 1 ? "s estão" : " está"} no ritmo para conclusão`,
      });
    }

    // Close to milestone
    const closeToMilestone = goalsProgress.find((g) => {
      const nextMilestone = g.milestones.find((m) => !m.reached);
      if (!nextMilestone) return false;
      const percentToMilestone = nextMilestone.percentage - g.progress;
      return percentToMilestone > 0 && percentToMilestone <= 5;
    });

    if (closeToMilestone) {
      const nextMilestone = closeToMilestone.milestones.find((m) => !m.reached);
      insights.push({
        type: "positive",
        title: "Quase lá!",
        description: `"${closeToMilestone.name}" está próxima dos ${nextMilestone?.percentage}%`,
        goalName: closeToMilestone.name,
      });
    }

    // Summary
    const totalSaved = goals.reduce((sum, g) => sum + g.currentValue, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetValue, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    const allContributions = goals.flatMap((g) =>
      g.contributions.filter((c) => new Date(c.date) >= sixMonthsAgo)
    );
    const monthlyAverage = allContributions.reduce((sum, c) => sum + c.value, 0) / 6;

    return NextResponse.json({
      goalsProgress,
      insights,
      summary: {
        totalGoals: goals.length,
        completedGoals: completedGoals.length,
        activeGoals: activeGoals.length,
        totalSaved,
        totalTarget,
        overallProgress,
        monthlyAverage,
        goalsOnTrack: goalsProgress.filter((g) => g.onTrack).length,
      },
    });
  });
}
