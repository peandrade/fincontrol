import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { toNumber } from "@/lib/decimal-utils";

// === TYPE DEFINITIONS ===

export interface PeriodTotals {
  income: number;
  expense: number;
  balance: number;
}

export interface MonthlyTotal {
  month: string; // YYYY-MM format
  year: number;
  monthNum: number;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  percentage?: number;
}

// Raw query result types
interface PeriodAggregateResult {
  type: string;
  total: Prisma.Decimal;
}

interface MonthlyAggregateResult {
  month: Date;
  type: string;
  total: Prisma.Decimal;
}

interface CategoryAggregateResult {
  category: string;
  total: Prisma.Decimal;
  count: bigint;
}

// === AGGREGATION FUNCTIONS ===

/**
 * Get total income and expenses for a specific period.
 * Uses database aggregation for optimal performance.
 */
export async function getPeriodTotals(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<PeriodTotals> {
  const results = await prisma.$queryRaw<PeriodAggregateResult[]>`
    SELECT
      type::text,
      SUM(value) as total
    FROM transactions
    WHERE "userId" = ${userId}
      AND date >= ${startDate}
      AND date <= ${endDate}
    GROUP BY type
  `;

  let income = 0;
  let expense = 0;

  for (const row of results) {
    if (row.type === "income") {
      income = toNumber(row.total);
    } else if (row.type === "expense") {
      expense = toNumber(row.total);
    }
  }

  return {
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * Get monthly totals aggregated by month.
 * Returns income, expense, and balance for each month in the period.
 */
export async function getMonthlyTotals(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyTotal[]> {
  const results = await prisma.$queryRaw<MonthlyAggregateResult[]>`
    SELECT
      DATE_TRUNC('month', date) as month,
      type::text,
      SUM(value) as total
    FROM transactions
    WHERE "userId" = ${userId}
      AND date >= ${startDate}
      AND date <= ${endDate}
    GROUP BY DATE_TRUNC('month', date), type
    ORDER BY month
  `;

  // Group results by month
  const monthlyMap = new Map<string, { income: number; expense: number }>();

  for (const row of results) {
    const monthDate = new Date(row.month);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { income: 0, expense: 0 });
    }

    const data = monthlyMap.get(monthKey)!;
    if (row.type === "income") {
      data.income = toNumber(row.total);
    } else if (row.type === "expense") {
      data.expense = toNumber(row.total);
    }
  }

  // Convert to array
  const monthlyTotals: MonthlyTotal[] = [];
  for (const [monthKey, data] of monthlyMap) {
    const [yearStr, monthStr] = monthKey.split("-");
    monthlyTotals.push({
      month: monthKey,
      year: parseInt(yearStr),
      monthNum: parseInt(monthStr),
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    });
  }

  return monthlyTotals.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get totals grouped by category.
 * Optionally filter by transaction type (income/expense).
 */
export async function getCategoryTotals(
  userId: string,
  startDate: Date,
  endDate: Date,
  type?: "income" | "expense"
): Promise<CategoryTotal[]> {
  let results: CategoryAggregateResult[];

  if (type) {
    results = await prisma.$queryRaw<CategoryAggregateResult[]>`
      SELECT
        category,
        SUM(value) as total,
        COUNT(*) as count
      FROM transactions
      WHERE "userId" = ${userId}
        AND date >= ${startDate}
        AND date <= ${endDate}
        AND type::text = ${type}
      GROUP BY category
      ORDER BY total DESC
    `;
  } else {
    results = await prisma.$queryRaw<CategoryAggregateResult[]>`
      SELECT
        category,
        SUM(value) as total,
        COUNT(*) as count
      FROM transactions
      WHERE "userId" = ${userId}
        AND date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY category
      ORDER BY total DESC
    `;
  }

  const grandTotal = results.reduce((sum, row) => sum + toNumber(row.total), 0);

  return results.map((row) => ({
    category: row.category,
    total: toNumber(row.total),
    count: toNumber(row.count),
    percentage: grandTotal > 0 ? (toNumber(row.total) / grandTotal) * 100 : 0,
  }));
}

/**
 * Get spending trend comparing recent months to older months.
 * Returns percentage change (positive = spending increased, negative = decreased).
 */
export async function getSpendingTrend(
  userId: string,
  monthsToAnalyze: number = 6
): Promise<{
  trend: number;
  recentAverage: number;
  olderAverage: number;
}> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToAnalyze, 1);

  const monthlyTotals = await getMonthlyTotals(userId, startDate, now);

  if (monthlyTotals.length < 2) {
    return { trend: 0, recentAverage: 0, olderAverage: 0 };
  }

  // Split into recent and older
  const splitPoint = Math.max(1, Math.floor(monthlyTotals.length / 2));
  const recentMonths = monthlyTotals.slice(-splitPoint);
  const olderMonths = monthlyTotals.slice(0, -splitPoint);

  const recentAverage =
    recentMonths.length > 0
      ? recentMonths.reduce((sum, m) => sum + m.expense, 0) / recentMonths.length
      : 0;

  const olderAverage =
    olderMonths.length > 0
      ? olderMonths.reduce((sum, m) => sum + m.expense, 0) / olderMonths.length
      : 0;

  const trend = olderAverage > 0 ? ((recentAverage - olderAverage) / olderAverage) * 100 : 0;

  return { trend, recentAverage, olderAverage };
}

/**
 * Get total available balance (income - expenses) using database aggregation.
 * Much more efficient than fetching all transactions.
 */
export async function getAvailableBalance(userId: string): Promise<number> {
  const result = await prisma.$queryRaw<{ income: Prisma.Decimal | null; expense: Prisma.Decimal | null }[]>`
    SELECT
      SUM(CASE WHEN type = 'income' THEN value ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END) as expense
    FROM transactions
    WHERE "userId" = ${userId}
  `;

  if (!result[0]) {
    return 0;
  }

  const income = toNumber(result[0].income);
  const expense = toNumber(result[0].expense);

  return income - expense;
}

/**
 * Get current month spending with projection.
 */
export async function getCurrentMonthSpending(userId: string): Promise<{
  spent: number;
  dailyAverage: number;
  daysElapsed: number;
  daysInMonth: number;
  projectedTotal: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "expense",
      date: { gte: startOfMonth, lte: now },
    },
    _sum: { value: true },
  });

  const spent = result._sum.value || 0;
  const daysElapsed = now.getDate();
  const daysInMonth = endOfMonth.getDate();
  const dailyAverage = daysElapsed > 0 ? spent / daysElapsed : 0;
  const projectedTotal = dailyAverage * daysInMonth;

  return {
    spent,
    dailyAverage,
    daysElapsed,
    daysInMonth,
    projectedTotal,
  };
}
