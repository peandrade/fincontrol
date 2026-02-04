import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
  getPeriodTotals,
  getCategoryTotals,
  getSpendingTrend,
} from "@/lib/transaction-aggregations";
import { serverCache, CacheTags, CacheTTL } from "@/lib/server-cache";
import { investmentRepository, goalRepository, budgetRepository, recurringRepository, cardRepository } from "@/repositories";

export async function GET() {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
      const cacheKey = serverCache.userKey(userId, "financial-health");

      // Check cache first
      const cached = serverCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "private, no-cache",
          },
        });
      }
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);
      const startOfYearDate = startOfYear(now);
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Fetch all necessary data in parallel - using repositories for encrypted data
      const [
        monthlyTotals,
        yearlyTotals,
        categoryExpenses,
        spendingTrendData,
        investments,
        creditCards,
        goals,
        budgets,
        recurringExpenses,
      ] = await Promise.all([
        // Current month totals (aggregated)
        getPeriodTotals(userId, startOfCurrentMonth, endOfCurrentMonth),
        // Year to date totals (aggregated)
        getPeriodTotals(userId, startOfYearDate, now),
        // Category expenses for current month (aggregated)
        getCategoryTotals(userId, startOfCurrentMonth, endOfCurrentMonth, "expense"),
        // Spending trend over 6 months (aggregated)
        getSpendingTrend(userId, 6),
        // Investments using repository (handles decryption)
        investmentRepository.findByUser(userId),
        // Credit cards with invoices using repository (handles decryption)
        cardRepository.findByUser(userId, { includeInvoices: true }),
        // Financial goals using repository (handles decryption)
        goalRepository.findByUser(userId),
        // Budgets using repository (handles decryption)
        budgetRepository.getActiveBudgets(userId, month, year),
        // Recurring expenses using repository (handles decryption)
        recurringRepository.findByUser(userId, { activeOnly: true }),
      ]);

      // === CALCULATE SAVINGS RATE ===
      const monthlyIncome = monthlyTotals.income;
      const monthlyExpenses = monthlyTotals.expense;
      const monthlySavings = monthlyTotals.balance;
      const monthlySavingsRate = monthlyIncome > 0
        ? (monthlySavings / monthlyIncome) * 100
        : 0;

      const yearlyIncome = yearlyTotals.income;
      const yearlyExpenses = yearlyTotals.expense;
      const yearlySavings = yearlyTotals.balance;
      const yearlySavingsRate = yearlyIncome > 0
        ? (yearlySavings / yearlyIncome) * 100
        : 0;

      // === CALCULATE CREDIT UTILIZATION ===
      // Type assertion for cards with invoices
      type HealthCardWithInvoices = typeof creditCards[number] & {
        invoices?: Array<{ status: string; total: unknown; paidAmount: unknown }>;
      };
      const cardsWithInvoices = creditCards as HealthCardWithInvoices[];

      const totalCreditLimit = cardsWithInvoices.reduce((sum: number, card) => sum + (card.limit as unknown as number), 0);
      const totalCreditUsed = cardsWithInvoices.reduce((sum: number, card) => {
        // Filter for unpaid invoices (status !== "paid")
        const unpaidInvoices = (card.invoices || []).filter((inv) => inv.status !== "paid");
        const unpaidTotal = unpaidInvoices.reduce((invSum: number, inv) => {
          const total = inv.total as unknown as number;
          const paidAmount = inv.paidAmount as unknown as number;
          return invSum + total - paidAmount;
        }, 0);
        return sum + unpaidTotal;
      }, 0);
      const creditUtilization = totalCreditLimit > 0
        ? (totalCreditUsed / totalCreditLimit) * 100
        : 0;

      // === CALCULATE EMERGENCY FUND STATUS ===
      const monthlyExpenseAverage = recurringExpenses.reduce((sum, exp) => sum + (exp.value as unknown as number), 0) +
        (monthlyExpenses / 1); // Use current month expenses as base

      const emergencyGoal = goals.find((g) => g.category === "emergency");
      const emergencyFundMonths = monthlyExpenseAverage > 0 && emergencyGoal
        ? (emergencyGoal.currentValue as unknown as number) / monthlyExpenseAverage
        : 0;

      // === CALCULATE GOALS PROGRESS ===
      const totalGoalsTarget = goals.reduce((sum, g) => sum + (g.targetValue as unknown as number), 0);
      const totalGoalsCurrent = goals.reduce((sum, g) => sum + (g.currentValue as unknown as number), 0);
      const goalsProgress = totalGoalsTarget > 0
        ? (totalGoalsCurrent / totalGoalsTarget) * 100
        : 0;

      // === CALCULATE INVESTMENT DIVERSIFICATION ===
      const investmentsByType = investments.reduce((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + (inv.currentValue as unknown as number);
        return acc;
      }, {} as Record<string, number>);

      const totalInvestments = Object.values(investmentsByType).reduce((a, b) => a + b, 0);
      const investmentTypes = Object.keys(investmentsByType).length;
      const diversificationScore = Math.min(investmentTypes / 5, 1) * 100; // Max 5 types for 100%

      // === CALCULATE BUDGET ADHERENCE ===
      // Convert categoryExpenses array to map for O(1) lookup
      const categoryExpensesMap: Record<string, number> = {};
      for (const cat of categoryExpenses) {
        categoryExpensesMap[cat.category] = cat.total;
      }

      let budgetAdherence = 100;
      if (budgets.length > 0) {
        const budgetStatuses = budgets.map((budget) => {
          const spent = categoryExpensesMap[budget.category] || 0;
          const limit = budget.limit as unknown as number;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          return Math.min(percentage, 200); // Cap at 200% to avoid extreme values
        });
        const avgBudgetUsage = budgetStatuses.reduce((a, b) => a + b, 0) / budgetStatuses.length;
        budgetAdherence = Math.max(0, 100 - Math.max(0, avgBudgetUsage - 100));
      }

      // === SPENDING TREND (already calculated via aggregation) ===
      const spendingTrend = spendingTrendData.trend;

      // === CALCULATE FINANCIAL HEALTH SCORE (0-1000) ===
      const scores = {
        savingsRate: Math.min(Math.max(monthlySavingsRate, 0), 50) * 2, // 0-100 (50%+ savings = max)
        creditUtilization: Math.max(0, 100 - creditUtilization * 3.33), // 0-100 (30% = 0 score)
        emergencyFund: Math.min(emergencyFundMonths / 6, 1) * 100, // 0-100 (6 months = max)
        goalsProgress: goalsProgress, // 0-100
        diversification: diversificationScore, // 0-100
        budgetAdherence: budgetAdherence, // 0-100
        spendingTrend: Math.max(0, 100 - Math.abs(spendingTrend)), // 0-100 (stable = max)
      };

      // Weighted average for final score
      const weights = {
        savingsRate: 0.25,
        creditUtilization: 0.20,
        emergencyFund: 0.20,
        goalsProgress: 0.10,
        diversification: 0.10,
        budgetAdherence: 0.10,
        spendingTrend: 0.05,
      };

      const weightedScore = Object.entries(scores).reduce((total, [key, value]) => {
        return total + value * weights[key as keyof typeof weights];
      }, 0);

      const finalScore = Math.round(weightedScore * 10); // Scale to 0-1000

      // Determine score level
      let scoreLevel: "excellent" | "good" | "fair" | "poor";
      let scoreMessage: string;
      if (finalScore >= 800) {
        scoreLevel = "excellent";
        scoreMessage = "Excelente! Sua saúde financeira está ótima.";
      } else if (finalScore >= 600) {
        scoreLevel = "good";
        scoreMessage = "Bom! Você está no caminho certo.";
      } else if (finalScore >= 400) {
        scoreLevel = "fair";
        scoreMessage = "Regular. Há espaço para melhorar.";
      } else {
        scoreLevel = "poor";
        scoreMessage = "Atenção! Revise suas finanças.";
      }

      // Generate improvement tips
      const tips: string[] = [];
      if (monthlySavingsRate < 20) {
        tips.push("Tente aumentar sua taxa de poupança para pelo menos 20%");
      }
      if (creditUtilization > 30) {
        tips.push("Reduza o uso do cartão de crédito para menos de 30% do limite");
      }
      if (emergencyFundMonths < 3) {
        tips.push("Priorize construir uma reserva de emergência de 3-6 meses");
      }
      if (investmentTypes < 3) {
        tips.push("Diversifique seus investimentos em mais classes de ativos");
      }
      if (budgetAdherence < 80) {
        tips.push("Revise seus orçamentos - você está gastando além do planejado");
      }

      const result = {
        score: finalScore,
        scoreLevel,
        scoreMessage,
        tips,
        details: {
          savingsRate: {
            monthly: {
              income: monthlyIncome,
              expenses: monthlyExpenses,
              savings: monthlySavings,
              rate: monthlySavingsRate,
            },
            yearly: {
              income: yearlyIncome,
              expenses: yearlyExpenses,
              savings: yearlySavings,
              rate: yearlySavingsRate,
            },
          },
          creditUtilization: {
            limit: totalCreditLimit,
            used: totalCreditUsed,
            percentage: creditUtilization,
          },
          emergencyFund: {
            current: emergencyGoal ? (emergencyGoal.currentValue as unknown as number) : 0,
            monthlyExpenses: monthlyExpenseAverage,
            monthsCovered: emergencyFundMonths,
            target: 6,
          },
          goals: {
            total: goals.length,
            completed: goals.filter((g) => g.isCompleted).length,
            progress: goalsProgress,
          },
          investments: {
            total: totalInvestments,
            types: investmentTypes,
            diversification: diversificationScore,
            byType: investmentsByType,
          },
          budgetAdherence,
          spendingTrend,
        },
        componentScores: scores,
      };

      // Cache the result for 5 minutes
      serverCache.set(cacheKey, result, {
        ttl: CacheTTL.MEDIUM,
        tags: [CacheTags.HEALTH_SCORE, CacheTags.TRANSACTIONS, CacheTags.INVESTMENTS, CacheTags.CARDS, CacheTags.GOALS, CacheTags.BUDGETS],
      });

      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "private, no-cache",
        },
      });
    } catch (error) {
      console.error("Erro ao calcular saúde financeira:", error);
      return errorResponse("Erro ao calcular saúde financeira", 500, "HEALTH_SCORE_ERROR");
    }
  });
}
