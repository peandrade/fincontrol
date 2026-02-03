import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { toNumber } from "@/lib/decimal-utils";
import { decryptRecord, USE_ENCRYPTION } from "@/lib/encryption";

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

// Raw query result types (for non-encrypted fallback)
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

// === HELPER FUNCTIONS ===

/**
 * Decrypt an array of transaction records.
 */
function decryptTransactions<T extends Record<string, unknown>>(transactions: T[]): T[] {
  if (!USE_ENCRYPTION) {
    return transactions;
  }
  return transactions.map((t) => decryptRecord(t, "Transaction"));
}

// === AGGREGATION FUNCTIONS ===

/**
 * Get total income and expenses for a specific period.
 * Uses app-level aggregation to support encrypted values.
 */
export async function getPeriodTotals(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<PeriodTotals> {
  // If encryption is disabled, use optimized raw query
  if (!USE_ENCRYPTION) {
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

  // With encryption, fetch records and aggregate in JS
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const decrypted = decryptTransactions(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

  let income = 0;
  let expense = 0;

  for (const t of decrypted) {
    const value = t.value as unknown as number;
    if (t.type === "income") {
      income += value;
    } else if (t.type === "expense") {
      expense += value;
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
  // If encryption is disabled, use optimized raw query
  if (!USE_ENCRYPTION) {
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

  // With encryption, fetch records and aggregate in JS
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const decrypted = decryptTransactions(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

  // Group by month
  const monthlyMap = new Map<string, { income: number; expense: number }>();

  for (const t of decrypted) {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { income: 0, expense: 0 });
    }

    const data = monthlyMap.get(monthKey)!;
    const value = t.value as unknown as number;
    if (t.type === "income") {
      data.income += value;
    } else if (t.type === "expense") {
      data.expense += value;
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
  // If encryption is disabled, use optimized raw query
  if (!USE_ENCRYPTION) {
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

  // With encryption, fetch records and aggregate in JS
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      ...(type && { type }),
    },
  });

  const decrypted = decryptTransactions(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

  // Group by category
  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const t of decrypted) {
    const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
    existing.total += t.value as unknown as number;
    existing.count += 1;
    categoryMap.set(t.category, existing);
  }

  const grandTotal = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
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
 * Get total available balance (income - expenses) using app-level aggregation.
 */
export async function getAvailableBalance(userId: string): Promise<number> {
  // If encryption is disabled, use optimized raw query
  if (!USE_ENCRYPTION) {
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

  // With encryption, fetch records and aggregate in JS
  const transactions = await prisma.transaction.findMany({
    where: { userId },
  });

  const decrypted = decryptTransactions(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

  let income = 0;
  let expense = 0;

  for (const t of decrypted) {
    const value = t.value as unknown as number;
    if (t.type === "income") {
      income += value;
    } else if (t.type === "expense") {
      expense += value;
    }
  }

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

  // If encryption is disabled, use Prisma aggregate
  if (!USE_ENCRYPTION) {
    const result = await (prisma.transaction.aggregate as any)({
      where: {
        userId,
        type: "expense",
        date: { gte: startOfMonth, lte: now },
      },
      _sum: { value: true },
    });

    const spent = (result._sum.value as unknown as number) || 0;
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

  // With encryption, fetch records and aggregate in JS
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: { gte: startOfMonth, lte: now },
    },
  });

  const decrypted = decryptTransactions(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

  const spent = decrypted.reduce((sum, t) => sum + (t.value as unknown as number), 0);
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

/**
 * Get daily totals for a period.
 * Used for charts that need daily granularity.
 */
export async function getDailyTotals(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; income: number; expense: number; balance: number }>> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const decrypted = decryptTransactions(transactions as unknown as Record<string, unknown>[]) as unknown as typeof transactions;

  // Group by day
  const dailyMap = new Map<string, { income: number; expense: number }>();

  for (const t of decrypted) {
    const date = new Date(t.date);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { income: 0, expense: 0 });
    }

    const data = dailyMap.get(dateKey)!;
    const value = t.value as unknown as number;
    if (t.type === "income") {
      data.income += value;
    } else if (t.type === "expense") {
      data.expense += value;
    }
  }

  // Convert to array with balance
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
