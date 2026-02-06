import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { transactionRepository } from "@/repositories";

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
  dayKey: string;
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
    monthKey: string;
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
  titleKey: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
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

      // Fetch all necessary data using repository (handles decryption)
      const [
        expensesLast6Months,
        transactionsForYearComparison,
        currentMonthExpenses,
        lastMonthExpenses,
        sameMonthLastYearExpenses,
      ] = await Promise.all([
        // Expenses from last 6 months (for day of week patterns and category trends)
        transactionRepository.findByUser(userId, {
          type: "expense",
          startDate: sixMonthsAgo,
        }),

        // Transactions for year comparison (current and previous year)
        transactionRepository.findByUser(userId, {
          startDate: startOfPreviousYear,
          endDate: endOfCurrentYear,
        }),

        // Current month expenses
        transactionRepository.findByUser(userId, {
          type: "expense",
          startDate: currentMonthStart,
        }),

        // Last month expenses
        transactionRepository.findByUser(userId, {
          type: "expense",
          startDate: lastMonthStart,
          endDate: lastMonthEnd,
        }),

        // Same month last year expenses
        transactionRepository.findByUser(userId, {
          type: "expense",
          startDate: new Date(previousYear, now.getMonth(), 1),
          endDate: new Date(previousYear, now.getMonth() + 1, 0, 23, 59, 59),
        }),
      ]);

      // === DAY OF WEEK PATTERNS ===
      const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayOfWeekData: Record<number, { total: number; count: number }> = {};

      for (let i = 0; i < 7; i++) {
        dayOfWeekData[i] = { total: 0, count: 0 };
      }

      for (const expense of expensesLast6Months) {
        const dow = new Date(expense.date).getDay();
        const value = expense.value as unknown as number;
        dayOfWeekData[dow].total += value;
        dayOfWeekData[dow].count += 1;
      }

      const totalExpenses = Object.values(dayOfWeekData).reduce((sum, d) => sum + d.total, 0);

      const dayOfWeekPatterns: DayOfWeekPattern[] = Object.entries(dayOfWeekData).map(
        ([day, data]) => ({
          dayOfWeek: parseInt(day),
          dayKey: dayKeys[parseInt(day)],
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
      for (const expense of expensesLast6Months) {
        const monthKey = format(new Date(expense.date), "yyyy-MM");
        const value = expense.value as unknown as number;
        if (!categoryMonthlyData[expense.category]) {
          categoryMonthlyData[expense.category] = {};
        }
        categoryMonthlyData[expense.category][monthKey] =
          (categoryMonthlyData[expense.category][monthKey] || 0) + value;
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
      const currentMonthSpentValue = currentMonthExpenses.reduce((sum, t) => sum + (t.value as unknown as number), 0);
      const daysElapsed = now.getDate();
      const daysInMonth = endOfMonth(now).getDate();
      const dailyAverage = daysElapsed > 0 ? currentMonthSpentValue / daysElapsed : 0;
      const projectedTotal = dailyAverage * daysInMonth;

      const lastMonthTotal = lastMonthExpenses.reduce((sum, t) => sum + (t.value as unknown as number), 0);
      const sameMonthLastYearTotal = sameMonthLastYearExpenses.reduce((sum, t) => sum + (t.value as unknown as number), 0);

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
      const yearMonthKeys = ["jan", "feb", "mar", "apr", "mayShort", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

      // Index monthly totals
      const monthlyIndex: Record<string, number> = {};
      for (const t of transactionsForYearComparison) {
        const d = new Date(t.date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const value = t.value as unknown as number;
        const key = `${year}-${month}-${t.type}`;
        monthlyIndex[key] = (monthlyIndex[key] || 0) + value;
      }

      const yearComparisonMonths: YearComparison["months"] = [];
      for (let month = 0; month < 12; month++) {
        const monthNum = month + 1;
        yearComparisonMonths.push({
          month,
          monthKey: yearMonthKeys[month],
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
          titleKey: "insightSpendingUp",
          descriptionKey: "insightSpendingUpDesc",
          params: { category: biggest.category, percent: Math.round(biggest.trend) },
        });
      }

      const decreasingCategories = categoryTrends.filter((c) => c.trend < -20);
      if (decreasingCategories.length > 0) {
        const biggest = decreasingCategories.sort((a, b) => a.trend - b.trend)[0];
        insights.push({
          type: "positive",
          titleKey: "insightSavingsFound",
          descriptionKey: "insightSavingsFoundDesc",
          params: { category: biggest.category, percent: Math.round(Math.abs(biggest.trend)) },
        });
      }

      if (spendingVelocity.comparison.vsLastMonth > 20) {
        insights.push({
          type: "negative",
          titleKey: "insightFastPace",
          descriptionKey: "insightFastPaceDesc",
          params: { percent: Math.round(spendingVelocity.comparison.vsLastMonth) },
        });
      } else if (spendingVelocity.comparison.vsLastMonth < -20) {
        insights.push({
          type: "positive",
          titleKey: "insightControlledPace",
          descriptionKey: "insightControlledPaceDesc",
          params: { percent: Math.round(Math.abs(spendingVelocity.comparison.vsLastMonth)) },
        });
      }

      const highestSpendingDay = dayOfWeekPatterns.reduce((max, day) =>
        day.totalExpenses > max.totalExpenses ? day : max
      );
      if (highestSpendingDay.percentage > 20) {
        insights.push({
          type: "neutral",
          titleKey: "insightSpendingPattern",
          descriptionKey: "insightSpendingPatternDesc",
          params: { dayKey: highestSpendingDay.dayKey, percent: Math.round(highestSpendingDay.percentage) },
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
