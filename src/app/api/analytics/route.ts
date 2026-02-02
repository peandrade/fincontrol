import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { Prisma } from "@prisma/client";
import { toNumber } from "@/lib/decimal-utils";

interface CategoryTrend {
  category: string;
  months: {
    month: string;
    value: number;
  }[];
  trend: number;
  average: number;
}

interface DayOfWeekPattern {
  dayOfWeek: number;
  dayName: string;
  totalExpenses: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}

interface SpendingVelocity {
  currentMonth: {
    spent: number;
    dailyAverage: number;
    daysElapsed: number;
    projectedTotal: number;
  };
  comparison: {
    vsLastMonth: number;
    vsSameMonthLastYear: number;
  };
}

interface YearComparison {
  currentYear: number;
  previousYear: number;
  months: {
    month: number;
    monthName: string;
    currentYearExpenses: number;
    previousYearExpenses: number;
    currentYearIncome: number;
    previousYearIncome: number;
  }[];
  totals: {
    currentYearExpenses: number;
    previousYearExpenses: number;
    currentYearIncome: number;
    previousYearIncome: number;
    expenseChange: number;
    incomeChange: number;
  };
}

interface TopInsight {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  value?: number;
  category?: string;
}

interface DowAggregate {
  dow: number;
  total: Prisma.Decimal;
  count: bigint;
}

interface CategoryMonthAggregate {
  category: string;
  month: Date;
  total: Prisma.Decimal;
}

interface MonthlyAggregate {
  month: number;
  year: number;
  type: string;
  total: Prisma.Decimal;
}

export async function GET() {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    const sixMonthsAgo = subMonths(now, 6);
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const startOfPreviousYear = new Date(previousYear, 0, 1);
    const endOfCurrentYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // All queries in parallel using database aggregations
    const [
      dowPatterns,
      categoryByMonth,
      monthlyTotals,
      currentMonthSpent,
      lastMonthSpent,
      sameMonthLastYearSpent,
    ] = await Promise.all([
      // Day of week patterns - aggregated at DB level
      prisma.$queryRaw<DowAggregate[]>`
        SELECT
          EXTRACT(DOW FROM date)::int as dow,
          SUM(value) as total,
          COUNT(*) as count
        FROM transactions
        WHERE "userId" = ${userId}
          AND type = 'expense'
          AND date >= ${sixMonthsAgo}
        GROUP BY EXTRACT(DOW FROM date)
      `,

      // Category trends by month - aggregated at DB level
      prisma.$queryRaw<CategoryMonthAggregate[]>`
        SELECT
          category,
          DATE_TRUNC('month', date) as month,
          SUM(value) as total
        FROM transactions
        WHERE "userId" = ${userId}
          AND type = 'expense'
          AND date >= ${sixMonthsAgo}
        GROUP BY category, DATE_TRUNC('month', date)
        ORDER BY category, month
      `,

      // Monthly totals for year comparison - aggregated at DB level
      prisma.$queryRaw<MonthlyAggregate[]>`
        SELECT
          EXTRACT(MONTH FROM date)::int as month,
          EXTRACT(YEAR FROM date)::int as year,
          type::text,
          SUM(value) as total
        FROM transactions
        WHERE "userId" = ${userId}
          AND date >= ${startOfPreviousYear}
          AND date <= ${endOfCurrentYear}
        GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date), type
        ORDER BY year, month
      `,

      // Current month expenses
      prisma.transaction.aggregate({
        where: {
          userId,
          type: "expense",
          date: { gte: currentMonthStart },
        },
        _sum: { value: true },
      }),

      // Last month expenses
      prisma.transaction.aggregate({
        where: {
          userId,
          type: "expense",
          date: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { value: true },
      }),

      // Same month last year expenses
      prisma.transaction.aggregate({
        where: {
          userId,
          type: "expense",
          date: {
            gte: new Date(previousYear, now.getMonth(), 1),
            lte: new Date(previousYear, now.getMonth() + 1, 0, 23, 59, 59),
          },
        },
        _sum: { value: true },
      }),
    ]);

    // === DAY OF WEEK PATTERNS ===
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayOfWeekData: Record<number, { total: number; count: number }> = {};

    for (let i = 0; i < 7; i++) {
      dayOfWeekData[i] = { total: 0, count: 0 };
    }

    for (const row of dowPatterns) {
      dayOfWeekData[row.dow] = {
        total: toNumber(row.total),
        count: toNumber(row.count),
      };
    }

    const totalExpenses = Object.values(dayOfWeekData).reduce((sum, d) => sum + d.total, 0);

    const dayOfWeekPatterns: DayOfWeekPattern[] = Object.entries(dayOfWeekData).map(
      ([day, data]) => ({
        dayOfWeek: parseInt(day),
        dayName: dayNames[parseInt(day)],
        totalExpenses: data.total,
        transactionCount: data.count,
        averageTransaction: data.count > 0 ? data.total / data.count : 0,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      })
    );

    // === CATEGORY TRENDS ===
    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      monthKeys.push(format(subMonths(now, i), "yyyy-MM"));
    }

    const categoryMonthlyData: Record<string, Record<string, number>> = {};
    for (const row of categoryByMonth) {
      const monthKey = format(new Date(row.month), "yyyy-MM");
      if (!categoryMonthlyData[row.category]) {
        categoryMonthlyData[row.category] = {};
      }
      categoryMonthlyData[row.category][monthKey] = toNumber(row.total);
    }

    const categoryTrends: CategoryTrend[] = Object.entries(categoryMonthlyData)
      .map(([category, months]) => {
        const monthlyValues = monthKeys.map((key) => ({
          month: key,
          value: months[key] || 0,
        }));

        const values = monthlyValues.map((m) => m.value);
        const average = values.reduce((a, b) => a + b, 0) / values.length;

        const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const olderAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

        return {
          category,
          months: monthlyValues,
          trend,
          average,
        };
      })
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);

    // === SPENDING VELOCITY ===
    const currentMonthSpentValue = currentMonthSpent._sum.value || 0;
    const daysElapsed = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const dailyAverage = daysElapsed > 0 ? currentMonthSpentValue / daysElapsed : 0;
    const projectedTotal = dailyAverage * daysInMonth;

    const lastMonthTotal = lastMonthSpent._sum.value || 0;
    const sameMonthLastYearTotal = sameMonthLastYearSpent._sum.value || 0;

    const spendingVelocity: SpendingVelocity = {
      currentMonth: {
        spent: currentMonthSpentValue,
        dailyAverage,
        daysElapsed,
        projectedTotal,
      },
      comparison: {
        vsLastMonth: lastMonthTotal > 0 ? ((projectedTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
        vsSameMonthLastYear:
          sameMonthLastYearTotal > 0
            ? ((projectedTotal - sameMonthLastYearTotal) / sameMonthLastYearTotal) * 100
            : 0,
      },
    };

    // === YEAR COMPARISON ===
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Index monthly totals for O(1) lookup
    const monthlyIndex: Record<string, number> = {};
    for (const row of monthlyTotals) {
      const key = `${row.year}-${row.month}-${row.type}`;
      monthlyIndex[key] = toNumber(row.total);
    }

    const yearComparisonMonths: YearComparison["months"] = [];
    for (let month = 0; month < 12; month++) {
      const monthNum = month + 1; // DB uses 1-12
      yearComparisonMonths.push({
        month,
        monthName: monthNames[month],
        currentYearExpenses: monthlyIndex[`${currentYear}-${monthNum}-expense`] || 0,
        previousYearExpenses: monthlyIndex[`${previousYear}-${monthNum}-expense`] || 0,
        currentYearIncome: monthlyIndex[`${currentYear}-${monthNum}-income`] || 0,
        previousYearIncome: monthlyIndex[`${previousYear}-${monthNum}-income`] || 0,
      });
    }

    const currentYearTotalExpenses = yearComparisonMonths.reduce((sum, m) => sum + m.currentYearExpenses, 0);
    const previousYearTotalExpenses = yearComparisonMonths.reduce((sum, m) => sum + m.previousYearExpenses, 0);
    const currentYearTotalIncome = yearComparisonMonths.reduce((sum, m) => sum + m.currentYearIncome, 0);
    const previousYearTotalIncome = yearComparisonMonths.reduce((sum, m) => sum + m.previousYearIncome, 0);

    const yearComparison: YearComparison = {
      currentYear,
      previousYear,
      months: yearComparisonMonths,
      totals: {
        currentYearExpenses: currentYearTotalExpenses,
        previousYearExpenses: previousYearTotalExpenses,
        currentYearIncome: currentYearTotalIncome,
        previousYearIncome: previousYearTotalIncome,
        expenseChange:
          previousYearTotalExpenses > 0
            ? ((currentYearTotalExpenses - previousYearTotalExpenses) / previousYearTotalExpenses) * 100
            : 0,
        incomeChange:
          previousYearTotalIncome > 0
            ? ((currentYearTotalIncome - previousYearTotalIncome) / previousYearTotalIncome) * 100
            : 0,
      },
    };

    // === TOP INSIGHTS ===
    const insights: TopInsight[] = [];

    const increasingCategories = categoryTrends.filter((c) => c.trend > 20);
    if (increasingCategories.length > 0) {
      const biggest = increasingCategories[0];
      insights.push({
        type: "negative",
        title: "Gastos em alta",
        description: `${biggest.category} aumentou ${biggest.trend.toFixed(0)}% nos últimos meses`,
        value: biggest.trend,
        category: biggest.category,
      });
    }

    const decreasingCategories = categoryTrends.filter((c) => c.trend < -20);
    if (decreasingCategories.length > 0) {
      const biggest = decreasingCategories.sort((a, b) => a.trend - b.trend)[0];
      insights.push({
        type: "positive",
        title: "Economia identificada",
        description: `${biggest.category} reduziu ${Math.abs(biggest.trend).toFixed(0)}% nos últimos meses`,
        value: biggest.trend,
        category: biggest.category,
      });
    }

    if (spendingVelocity.comparison.vsLastMonth > 20) {
      insights.push({
        type: "negative",
        title: "Ritmo acelerado",
        description: `Você está gastando ${spendingVelocity.comparison.vsLastMonth.toFixed(0)}% mais rápido que o mês passado`,
        value: spendingVelocity.comparison.vsLastMonth,
      });
    } else if (spendingVelocity.comparison.vsLastMonth < -20) {
      insights.push({
        type: "positive",
        title: "Ritmo controlado",
        description: `Seus gastos estão ${Math.abs(spendingVelocity.comparison.vsLastMonth).toFixed(0)}% menores que o mês passado`,
        value: spendingVelocity.comparison.vsLastMonth,
      });
    }

    const highestSpendingDay = dayOfWeekPatterns.reduce((max, day) =>
      day.totalExpenses > max.totalExpenses ? day : max
    );
    if (highestSpendingDay.percentage > 20) {
      insights.push({
        type: "neutral",
        title: "Padrão de gastos",
        description: `${highestSpendingDay.dayName} é o dia que você mais gasta (${highestSpendingDay.percentage.toFixed(0)}% do total)`,
        value: highestSpendingDay.percentage,
      });
    }

    return NextResponse.json(
      {
        dayOfWeekPatterns,
        categoryTrends,
        spendingVelocity,
        yearComparison,
        insights,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      }
    );
    } catch (error) {
      console.error("Erro ao gerar analytics:", error);
      return errorResponse("Erro ao gerar analytics", 500, "ANALYTICS_ERROR");
    }
  });
}
