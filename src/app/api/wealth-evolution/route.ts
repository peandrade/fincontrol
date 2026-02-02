import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { serverCache, CacheTags, CacheTTL } from "@/lib/server-cache";
import { toNumber } from "@/lib/decimal-utils";

interface WealthDataPoint {
  month: string;
  label: string;
  transactionBalance: number;
  investmentValue: number;
  cardDebt: number;
  totalWealth: number;
  goalsSaved: number;
}

interface TransactionAggregate {
  period: Date;
  type: string;
  total: Prisma.Decimal;
}

interface OperationAggregate {
  period: Date;
  type: string;
  total: Prisma.Decimal;
}

const VALID_PERIODS = ["1w", "1m", "3m", "6m", "1y"] as const;
type ValidPeriod = (typeof VALID_PERIODS)[number];

function isValidPeriod(value: string): value is ValidPeriod {
  return VALID_PERIODS.includes(value as ValidPeriod);
}

export async function GET(request: NextRequest) {
  return withAuth(async (session, req) => {
    try {
      const userId = session.user.id;
      const { searchParams } = new URL(req.url);
      const periodParam = searchParams.get("period") || "1y";

      // Validate period against whitelist
      const period = isValidPeriod(periodParam) ? periodParam : "1y";

      // Check cache first
      const cacheKey = serverCache.userKey(userId, `wealth-evolution:${period}`);
      const cached = serverCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
          },
        });
      }

    const now = new Date();
    let startDate: Date;
    const groupByDay = period === "1w" || period === "1m";

    switch (period) {
      case "1w":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "1m":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "3m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "6m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "1y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
    }

    // All queries in parallel - including initial balances
    const [
      initialTransactionBalance,
      initialInvestmentBalance,
      transactionsByPeriod,
      operationsByPeriod,
      unpaidInvoices,
      goals,
    ] = await Promise.all([
      // Initial transaction balance (before startDate)
      prisma.$queryRaw<[{ balance: Prisma.Decimal | null }]>`
        SELECT COALESCE(
          SUM(CASE WHEN type = 'income' THEN value ELSE -value END),
          0
        ) as balance
        FROM transactions
        WHERE "userId" = ${userId} AND date < ${startDate}
      `,

      // Initial investment balance (before startDate)
      prisma.$queryRaw<[{ balance: Prisma.Decimal | null }]>`
        SELECT COALESCE(
          SUM(CASE
            WHEN o.type IN ('buy', 'deposit') THEN o.total
            WHEN o.type IN ('sell', 'withdraw') THEN -o.total
            ELSE 0
          END),
          0
        ) as balance
        FROM operations o
        JOIN investments i ON o."investmentId" = i.id
        WHERE i."userId" = ${userId} AND o.date < ${startDate}
      `,

      // Transactions grouped by period
      groupByDay
        ? prisma.$queryRaw<TransactionAggregate[]>`
            SELECT
              DATE_TRUNC('day', date) as period,
              type::text,
              SUM(value) as total
            FROM transactions
            WHERE "userId" = ${userId} AND date >= ${startDate}
            GROUP BY DATE_TRUNC('day', date), type
            ORDER BY period
          `
        : prisma.$queryRaw<TransactionAggregate[]>`
            SELECT
              DATE_TRUNC('month', date) as period,
              type::text,
              SUM(value) as total
            FROM transactions
            WHERE "userId" = ${userId} AND date >= ${startDate}
            GROUP BY DATE_TRUNC('month', date), type
            ORDER BY period
          `,

      // Operations grouped by period
      groupByDay
        ? prisma.$queryRaw<OperationAggregate[]>`
            SELECT
              DATE_TRUNC('day', o.date) as period,
              o.type,
              SUM(o.total) as total
            FROM operations o
            JOIN investments i ON o."investmentId" = i.id
            WHERE i."userId" = ${userId} AND o.date >= ${startDate}
            GROUP BY DATE_TRUNC('day', o.date), o.type
            ORDER BY period
          `
        : prisma.$queryRaw<OperationAggregate[]>`
            SELECT
              DATE_TRUNC('month', o.date) as period,
              o.type,
              SUM(o.total) as total
            FROM operations o
            JOIN investments i ON o."investmentId" = i.id
            WHERE i."userId" = ${userId} AND o.date >= ${startDate}
            GROUP BY DATE_TRUNC('month', o.date), o.type
            ORDER BY period
          `,

      // Unpaid invoices (for card debt)
      prisma.invoice.findMany({
        where: {
          creditCard: { userId },
          status: { not: "paid" },
        },
        select: {
          month: true,
          year: true,
          total: true,
          paidAmount: true,
        },
      }),

      // Financial goals
      prisma.financialGoal.aggregate({
        where: { userId },
        _sum: { currentValue: true },
      }),
    ]);

    // Build period keys and initialize data structure
    const periods: string[] = [];
    const dataByPeriod: Record<string, WealthDataPoint> = {};
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const initBalance = toNumber(initialTransactionBalance[0]?.balance);
    const initInvestment = toNumber(initialInvestmentBalance[0]?.balance);

    if (groupByDay) {
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);

      while (current <= now) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        periods.push(key);

        const label = period === "1w"
          ? `${dayNames[current.getDay()]} ${current.getDate()}`
          : `${String(current.getDate()).padStart(2, "0")}/${String(current.getMonth() + 1).padStart(2, "0")}`;

        dataByPeriod[key] = {
          month: key,
          label,
          transactionBalance: initBalance,
          investmentValue: initInvestment,
          cardDebt: 0,
          totalWealth: 0,
          goalsSaved: 0,
        };

        current.setDate(current.getDate() + 1);
      }
    } else {
      const current = new Date(startDate);
      while (current <= now) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        periods.push(key);

        const monthLabel = new Date(current.getFullYear(), current.getMonth()).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });

        dataByPeriod[key] = {
          month: key,
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          transactionBalance: initBalance,
          investmentValue: initInvestment,
          cardDebt: 0,
          totalWealth: 0,
          goalsSaved: 0,
        };

        current.setMonth(current.getMonth() + 1);
      }
    }

    // Process aggregated transactions - O(aggregates) instead of O(periods × transactions)
    const transactionDeltas: Record<string, number> = {};
    for (const row of transactionsByPeriod) {
      const d = new Date(row.period);
      const key = groupByDay
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!transactionDeltas[key]) transactionDeltas[key] = 0;
      const amount = toNumber(row.total);
      transactionDeltas[key] += row.type === "income" ? amount : -amount;
    }

    // Apply running balance for transactions
    let runningBalance = initBalance;
    for (const key of periods) {
      runningBalance += transactionDeltas[key] || 0;
      dataByPeriod[key].transactionBalance = runningBalance;
    }

    // Process aggregated operations - O(aggregates) instead of O(periods × operations)
    const operationDeltas: Record<string, number> = {};
    for (const row of operationsByPeriod) {
      const d = new Date(row.period);
      const key = groupByDay
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!operationDeltas[key]) operationDeltas[key] = 0;
      const amount = toNumber(row.total);
      if (row.type === "buy" || row.type === "deposit") {
        operationDeltas[key] += amount;
      } else if (row.type === "sell" || row.type === "withdraw") {
        operationDeltas[key] -= amount;
      }
    }

    // Apply running balance for investments
    let runningInvestment = initInvestment;
    for (const key of periods) {
      runningInvestment += operationDeltas[key] || 0;
      dataByPeriod[key].investmentValue = runningInvestment;
    }

    // Index unpaid invoices by month for O(1) lookup
    const invoiceDebtByMonth: Record<string, number> = {};
    for (const inv of unpaidInvoices) {
      const key = `${inv.year}-${String(inv.month).padStart(2, "0")}`;
      const debt = Math.max(inv.total - inv.paidAmount, 0);
      invoiceDebtByMonth[key] = (invoiceDebtByMonth[key] || 0) + debt;
    }

    // Calculate cumulative card debt for each period
    for (const key of periods) {
      let keyDate: Date;
      if (groupByDay) {
        const [year, month, day] = key.split("-").map(Number);
        keyDate = new Date(year, month - 1, day);
      } else {
        const [year, month] = key.split("-").map(Number);
        keyDate = new Date(year, month - 1);
      }

      // Sum debt from invoices up to this period
      let totalDebt = 0;
      for (const [invKey, debt] of Object.entries(invoiceDebtByMonth)) {
        const [invYear, invMonth] = invKey.split("-").map(Number);
        const invDate = new Date(invYear, invMonth - 1);
        if (invDate <= keyDate) {
          totalDebt += debt;
        }
      }
      dataByPeriod[key].cardDebt = totalDebt;
    }

    // Add goals saved
    const totalGoalsSaved = goals._sum.currentValue || 0;
    for (const key of periods) {
      dataByPeriod[key].goalsSaved = totalGoalsSaved;
    }

    // Calculate total wealth
    for (const key of periods) {
      const d = dataByPeriod[key];
      d.totalWealth = d.transactionBalance + d.investmentValue + d.goalsSaved - d.cardDebt;
    }

    const evolution = periods.map((p) => dataByPeriod[p]);

    const current_data = evolution[evolution.length - 1] || {
      transactionBalance: 0,
      investmentValue: 0,
      cardDebt: 0,
      totalWealth: 0,
      goalsSaved: 0,
    };

    const previousPeriod = evolution[evolution.length - 2];
    const wealthChange = previousPeriod
      ? current_data.totalWealth - previousPeriod.totalWealth
      : 0;
    const wealthChangePercent = previousPeriod && previousPeriod.totalWealth !== 0
      ? ((current_data.totalWealth - previousPeriod.totalWealth) / Math.abs(previousPeriod.totalWealth)) * 100
      : 0;

    const result = {
      evolution,
      summary: {
        currentWealth: current_data.totalWealth,
        transactionBalance: current_data.transactionBalance,
        investmentValue: current_data.investmentValue,
        goalsSaved: current_data.goalsSaved,
        cardDebt: current_data.cardDebt,
        wealthChange,
        wealthChangePercent,
      },
      period,
    };

    // Cache for 1 minute
    serverCache.set(cacheKey, result, {
      ttl: CacheTTL.DEFAULT,
      tags: [CacheTags.WEALTH, CacheTags.TRANSACTIONS, CacheTags.INVESTMENTS, CacheTags.CARDS, CacheTags.GOALS],
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
    } catch (error) {
      console.error("Erro ao calcular evolução patrimonial:", error);
      return errorResponse("Erro ao calcular evolução patrimonial", 500, "WEALTH_EVOLUTION_ERROR");
    }
  }, request);
}
