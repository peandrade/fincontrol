import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { serverCache, CacheTags, CacheTTL } from "@/lib/server-cache";
import { transactionRepository, operationRepository, invoiceRepository, goalRepository } from "@/repositories";

interface WealthDataPoint {
  month: string;
  label: string;
  transactionBalance: number;
  investmentValue: number;
  cardDebt: number;
  totalWealth: number;
  goalsSaved: number;
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
            "Cache-Control": "private, no-cache",
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

      // All queries in parallel using repositories (handles decryption)
      const [
        initialTransactions,
        transactionsInPeriod,
        initialOperations,
        operationsInPeriod,
        unpaidInvoices,
        goalsSummary,
      ] = await Promise.all([
        // Initial transactions (before startDate)
        transactionRepository.findByUser(userId, {
          endDate: new Date(startDate.getTime() - 1),
        }),

        // Transactions in period
        transactionRepository.findByUser(userId, {
          startDate,
        }),

        // Initial operations (before startDate)
        operationRepository.findByUser(userId, {
          endDate: new Date(startDate.getTime() - 1),
        }),

        // Operations in period
        operationRepository.findByUser(userId, {
          startDate,
        }),

        // Unpaid invoices (for card debt)
        invoiceRepository.getUnpaidByUser(userId),

        // Financial goals summary
        goalRepository.getSummary(userId),
      ]);

      // Calculate initial balances from app-level aggregation
      const initBalance = initialTransactions.reduce((sum, t) => {
        const value = t.value as unknown as number;
        return sum + (t.type === "income" ? value : -value);
      }, 0);

      const initInvestment = initialOperations.reduce((sum, op) => {
        const total = op.total as unknown as number;
        if (op.type === "buy" || op.type === "deposit") return sum + total;
        if (op.type === "sell" || op.type === "withdraw") return sum - total;
        return sum;
      }, 0);

      // Aggregate transactions by period
      const transactionDeltas: Record<string, number> = {};
      for (const t of transactionsInPeriod) {
        const d = new Date(t.date);
        const key = groupByDay
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        const value = t.value as unknown as number;
        if (!transactionDeltas[key]) transactionDeltas[key] = 0;
        transactionDeltas[key] += t.type === "income" ? value : -value;
      }

      // Aggregate operations by period
      const operationDeltas: Record<string, number> = {};
      for (const op of operationsInPeriod) {
        const d = new Date(op.date);
        const key = groupByDay
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        const total = op.total as unknown as number;
        if (!operationDeltas[key]) operationDeltas[key] = 0;
        if (op.type === "buy" || op.type === "deposit") {
          operationDeltas[key] += total;
        } else if (op.type === "sell" || op.type === "withdraw") {
          operationDeltas[key] -= total;
        }
      }

      // Total goals saved from summary
      const totalGoalsSaved = goalsSummary.totalSaved;

      // Build period keys and initialize data structure
      const periods: string[] = [];
      const dataByPeriod: Record<string, WealthDataPoint> = {};
      const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

      // Apply running balance for transactions
      let runningBalance = initBalance;
      for (const key of periods) {
        runningBalance += transactionDeltas[key] || 0;
        dataByPeriod[key].transactionBalance = runningBalance;
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
        const total = inv.total as unknown as number;
        const paidAmount = inv.paidAmount as unknown as number;
        const debt = Math.max(total - paidAmount, 0);
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
          "Cache-Control": "private, no-cache",
        },
      });
    } catch (error) {
      console.error("Erro ao calcular evolução patrimonial:", error);
      return errorResponse("Erro ao calcular evolução patrimonial", 500, "WEALTH_EVOLUTION_ERROR");
    }
  }, request);
}
