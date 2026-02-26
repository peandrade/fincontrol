import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { serverCache, CacheTags, CacheTTL } from "@/lib/server-cache";
import { transactionRepository, recurringRepository, invoiceRepository } from "@/repositories";
import type { ForecastPeriod, CashFlowDataPoint, CashFlowAlert, CashFlowSummary, CashFlowForecastData } from "@/types/api-responses";

const VALID_PERIODS = [30, 60, 90] as const;

function isValidPeriod(value: number): value is ForecastPeriod {
  return VALID_PERIODS.includes(value as ForecastPeriod);
}

/**
 * GET /api/cash-flow-forecast
 *
 * Returns cash flow projection for the next 30, 60, or 90 days.
 * Considers:
 * - Current balance (from transactions)
 * - Recurring expenses (fixed monthly expenses)
 * - Credit card invoices (unpaid)
 * - Expected income (based on historical average)
 */
export async function GET(request: NextRequest) {
  return withAuth(async (session, req) => {
    try {
      const userId = session.user.id;
      const { searchParams } = new URL(req.url);
      const daysParam = parseInt(searchParams.get("days") || "30", 10);

      // Validate period against whitelist
      const period: ForecastPeriod = isValidPeriod(daysParam) ? daysParam : 30;

      // Check cache first
      const cacheKey = serverCache.userKey(userId, `cash-flow-forecast:${period}`);
      const cached = serverCache.get<CashFlowForecastData>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { "Cache-Control": "private, no-cache" },
        });
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Fetch all required data in parallel
      const [
        currentBalance,
        recurringExpenses,
        unpaidInvoices,
        last6MonthsTransactions,
      ] = await Promise.all([
        // Current balance from all transactions
        transactionRepository.getBalance(userId),

        // Active recurring expenses
        recurringRepository.getActive(userId),

        // Unpaid invoices
        invoiceRepository.getUnpaidByUser(userId),

        // Transactions from last 6 months (for income average calculation)
        transactionRepository.findByUser(userId, {
          startDate: new Date(now.getFullYear(), now.getMonth() - 6, 1),
          type: "income",
        }),
      ]);

      // Calculate average monthly income based on last 6 months
      const incomeByMonth = new Map<string, number>();
      for (const t of last6MonthsTransactions) {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const value = t.value as unknown as number;
        incomeByMonth.set(key, (incomeByMonth.get(key) || 0) + value);
      }

      const monthsWithIncome = incomeByMonth.size;
      const totalIncome = Array.from(incomeByMonth.values()).reduce((sum, v) => sum + v, 0);
      const avgMonthlyIncome = monthsWithIncome > 0 ? totalIncome / monthsWithIncome : 0;

      // Common income days (salary usually comes on 5th or 20th)
      const incomeDays = [5, 20];
      const incomePerDay = avgMonthlyIncome / incomeDays.length;

      // Index recurring expenses by due day
      const recurringByDay = new Map<number, number>();
      let totalMonthlyRecurring = 0;
      for (const expense of recurringExpenses) {
        const value = expense.value as unknown as number;
        const day = expense.dueDay || 10; // Default to day 10 if not set
        recurringByDay.set(day, (recurringByDay.get(day) || 0) + value);
        totalMonthlyRecurring += value;
      }

      // Index invoices by due date
      const invoicesByDate = new Map<string, number>();
      for (const invoice of unpaidInvoices) {
        const dueDate = new Date(invoice.dueDate);
        const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
        const total = invoice.total as unknown as number;
        const paidAmount = invoice.paidAmount as unknown as number;
        const remaining = Math.max(total - paidAmount, 0);
        if (remaining > 0) {
          invoicesByDate.set(key, (invoicesByDate.get(key) || 0) + remaining);
        }
      }

      // Build forecast data points
      const forecast: CashFlowDataPoint[] = [];
      const alerts: CashFlowAlert[] = [];
      let runningBalance = currentBalance;
      let lowestBalance = currentBalance;
      let lowestBalanceDate = today.toISOString().split("T")[0];
      let daysUntilNegative: number | null = null;
      let totalExpectedIncome = 0;
      let totalExpectedExpenses = 0;

      // Low balance threshold (R$500 or 20% of monthly expenses)
      const lowBalanceThreshold = Math.max(500, totalMonthlyRecurring * 0.2);

      for (let i = 0; i < period; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const dayOfMonth = date.getDate();

        // Calculate income for this day
        let dayIncome = 0;
        if (incomeDays.includes(dayOfMonth)) {
          dayIncome = incomePerDay;
          totalExpectedIncome += dayIncome;
        }

        // Calculate expenses for this day
        let dayExpenses = 0;

        // Recurring expenses
        const recurringForDay = recurringByDay.get(dayOfMonth) || 0;
        dayExpenses += recurringForDay;

        // Invoice due this day
        const invoiceForDay = invoicesByDate.get(dateKey) || 0;
        dayExpenses += invoiceForDay;

        totalExpectedExpenses += dayExpenses;

        // Update running balance
        runningBalance = runningBalance + dayIncome - dayExpenses;

        // Track lowest balance
        if (runningBalance < lowestBalance) {
          lowestBalance = runningBalance;
          lowestBalanceDate = dateKey;
        }

        // Track days until negative
        if (runningBalance < 0 && daysUntilNegative === null) {
          daysUntilNegative = i;
        }

        // Generate alerts
        if (runningBalance < 0 && !alerts.some(a => a.type === "negative_balance" && a.date === dateKey)) {
          alerts.push({
            type: "negative_balance",
            date: dateKey,
            projectedBalance: runningBalance,
            message: `negativeBalanceAlert`,
            severity: "danger",
          });
        } else if (runningBalance < lowBalanceThreshold && runningBalance >= 0 && !alerts.some(a => a.type === "low_balance" && a.date === dateKey)) {
          alerts.push({
            type: "low_balance",
            date: dateKey,
            projectedBalance: runningBalance,
            message: `lowBalanceAlert`,
            severity: "warning",
          });
        }

        // Alert for high expense days (expenses > 30% of average monthly income)
        if (dayExpenses > avgMonthlyIncome * 0.3 && dayExpenses > 0) {
          alerts.push({
            type: "high_expense_day",
            date: dateKey,
            projectedBalance: runningBalance,
            message: `highExpenseAlert`,
            severity: "warning",
          });
        }

        // Format label
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
        const label = i === 0
          ? "Hoje"
          : i === 1
            ? "Amanha"
            : `${dayNames[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

        forecast.push({
          date: dateKey,
          label,
          balance: runningBalance,
          income: dayIncome,
          expenses: dayExpenses,
          isNegative: runningBalance < 0,
        });
      }

      // Limit alerts to most important ones (max 5)
      const sortedAlerts = alerts
        .sort((a, b) => {
          // Sort by severity (danger first) then by date
          if (a.severity !== b.severity) {
            return a.severity === "danger" ? -1 : 1;
          }
          return a.date.localeCompare(b.date);
        })
        .slice(0, 5);

      const summary: CashFlowSummary = {
        currentBalance,
        projectedEndBalance: runningBalance,
        lowestBalance,
        lowestBalanceDate,
        totalExpectedIncome,
        totalExpectedExpenses,
        daysUntilNegative,
      };

      const result: CashFlowForecastData = {
        forecast,
        alerts: sortedAlerts,
        summary,
        period,
      };

      // Cache for 5 minutes (medium TTL since it's based on projections)
      serverCache.set(cacheKey, result, {
        ttl: CacheTTL.MEDIUM,
        tags: [CacheTags.CASH_FLOW, CacheTags.TRANSACTIONS, CacheTags.RECURRING, CacheTags.CARDS],
      });

      return NextResponse.json(result, {
        headers: { "Cache-Control": "private, no-cache" },
      });
    } catch (error) {
      console.error("Erro ao calcular previsao de fluxo de caixa:", error);
      return errorResponse("Erro ao calcular previsao de fluxo de caixa", 500, "CASH_FLOW_FORECAST_ERROR");
    }
  }, request);
}
