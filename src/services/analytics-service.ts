/**
 * Analytics Service
 *
 * Provides analytics and insights calculations for the financial dashboard.
 * Centralizes complex analytics logic that was previously spread across routes.
 */

import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { createServiceLogger } from "@/lib/logger";
import {
  transactionRepository,
  investmentRepository,
  cardRepository,
  goalRepository,
  budgetRepository,
} from "@/repositories";

const log = createServiceLogger("analytics");

// ============================================
// Types
// ============================================

export interface PeriodTotals {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardSummary {
  balance: {
    current: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyBalance: number;
  };
  investments: {
    totalInvested: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    count: number;
  };
  cards: {
    totalLimit: number;
    usedLimit: number;
    availableLimit: number;
    usagePercent: number;
    count: number;
  };
  goals: {
    total: number;
    completed: number;
    targetValue: number;
    currentValue: number;
    progress: number;
  };
  wealth: {
    total: number;
    breakdown: {
      balance: number;
      investments: number;
      goals: number;
      debts: number;
    };
  };
}

export interface HealthScore {
  score: number;
  level: "excellent" | "good" | "fair" | "poor";
  message: string;
  tips: string[];
  componentScores: {
    savingsRate: number;
    creditUtilization: number;
    emergencyFund: number;
    goalsProgress: number;
    diversification: number;
    budgetAdherence: number;
  };
}

// ============================================
// Analytics Service
// ============================================

export class AnalyticsService {
  /**
   * Get transaction totals for a period.
   */
  async getPeriodTotals(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PeriodTotals> {
    // Use repository for proper decryption
    const transactions = await transactionRepository.findByUser(userId, {
      startDate,
      endDate,
    });

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.value as unknown as number), 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.value as unknown as number), 0);

    return {
      income,
      expense,
      balance: income - expense,
      count: transactions.length,
    };
  }

  /**
   * Get category breakdown for a period.
   * Note: With encrypted values, we can't use groupBy at database level.
   * Aggregation is done in-memory after decryption.
   */
  async getCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    type: "income" | "expense" = "expense"
  ): Promise<CategoryTotal[]> {
    // Use repository for proper decryption
    const transactions = await transactionRepository.findByUser(userId, {
      type,
      startDate,
      endDate,
    });

    // Aggregate by category in memory
    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const t of transactions) {
      const value = t.value as unknown as number;
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
      categoryMap.set(t.category, {
        total: existing.total + value,
        count: existing.count + 1,
      });
    }

    const total = [...categoryMap.values()].reduce((sum, cat) => sum + cat.total, 0);

    // Convert to array and sort by total descending
    const result: CategoryTotal[] = [...categoryMap.entries()]
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return result;
  }

  /**
   * Get monthly trend for the last N months.
   */
  async getMonthlyTrend(userId: string, months: number = 6): Promise<MonthlyTrend[]> {
    const now = new Date();
    const startDate = startOfMonth(subMonths(now, months - 1));

    // Use repository for proper decryption
    const transactions = await transactionRepository.findByUser(userId, {
      startDate,
    });

    // Group by month
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const key = format(monthDate, "yyyy-MM");
      monthlyData[key] = { income: 0, expense: 0 };
    }

    for (const t of transactions) {
      const key = format(new Date(t.date), "yyyy-MM");
      if (monthlyData[key]) {
        const value = t.value as unknown as number;
        if (t.type === "income") {
          monthlyData[key].income += value;
        } else {
          monthlyData[key].expense += value;
        }
      }
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    }));
  }

  /**
   * Calculate spending trend percentage.
   */
  async getSpendingTrend(userId: string, months: number = 6): Promise<{
    trend: number;
    average: number;
    current: number;
  }> {
    const monthlyTrend = await this.getMonthlyTrend(userId, months);

    if (monthlyTrend.length < 2) {
      return { trend: 0, average: 0, current: 0 };
    }

    const expenses = monthlyTrend.map((m) => m.expense);
    const average = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const current = expenses[expenses.length - 1];
    const previous = expenses[expenses.length - 2];

    const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return { trend, average, current };
  }

  /**
   * Get complete dashboard summary.
   */
  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const startTime = Date.now();
    log.debug("Calculating dashboard summary", { userId });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Use repositories for proper decryption
    const [
      allTransactions,
      monthlyTransactions,
      investments,
      creditCards,
      goals,
    ] = await Promise.all([
      transactionRepository.findByUser(userId),
      transactionRepository.findByUser(userId, {
        startDate: monthStart,
        endDate: monthEnd,
      }),
      investmentRepository.findByUser(userId),
      cardRepository.findByUser(userId, { isActive: true, includeInvoices: true }),
      goalRepository.findByUser(userId),
    ]);

    // Calculate balances
    const balance = allTransactions.reduce((acc, t) => {
      const value = t.value as unknown as number;
      return t.type === "income" ? acc + value : acc - value;
    }, 0);

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.value as unknown as number), 0);

    const monthlyExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.value as unknown as number), 0);

    // Investments
    const totalInvested = investments.reduce((acc, i) => acc + (i.totalInvested as unknown as number), 0);
    const currentInvestmentValue = investments.reduce((acc, i) => acc + (i.currentValue as unknown as number), 0);
    const investmentProfitLoss = investments.reduce((acc, i) => acc + (i.profitLoss as unknown as number), 0);

    // Credit cards - filter invoices by status in memory since repository returns all
    // Type assertion for cards with invoices
    type CardWithInvoices = typeof creditCards[number] & {
      invoices?: Array<{
        status: string;
        total: unknown;
        paidAmount: unknown;
        year: number;
        month: number;
        dueDate: Date;
      }>;
    };
    const cardsWithInvoices = creditCards as CardWithInvoices[];

    const totalCardLimit = cardsWithInvoices.reduce((acc: number, c) => acc + (c.limit as unknown as number), 0);
    const usedCardLimit = cardsWithInvoices.reduce((acc: number, c) => {
      const relevantInvoices = (c.invoices || []).filter(
        (inv) => inv.status === "open" || inv.status === "closed" || inv.status === "overdue"
      );
      const used = relevantInvoices.reduce(
        (sum: number, inv) => sum + ((inv.total as unknown as number) - (inv.paidAmount as unknown as number)),
        0
      );
      return acc + used;
    }, 0);

    // Calculate overdue debts - filter for relevant invoices
    const cardsWithFilteredInvoices = cardsWithInvoices.map((c) => ({
      ...c,
      invoices: (c.invoices || []).filter(
        (inv) => inv.status === "open" || inv.status === "closed" || inv.status === "overdue"
      ),
    }));
    const overdueDebts = this.calculateOverdueDebts(cardsWithFilteredInvoices as any, now);

    // Goals
    const totalGoalTarget = goals.reduce((acc, g) => acc + (g.targetValue as unknown as number), 0);
    const totalGoalCurrent = goals.reduce((acc, g) => acc + (g.currentValue as unknown as number), 0);

    const summary = {
      balance: {
        current: balance,
        monthlyIncome,
        monthlyExpenses,
        monthlyBalance: monthlyIncome - monthlyExpenses,
      },
      investments: {
        totalInvested,
        currentValue: currentInvestmentValue,
        profitLoss: investmentProfitLoss,
        profitLossPercent: totalInvested > 0 ? (investmentProfitLoss / totalInvested) * 100 : 0,
        count: investments.length,
      },
      cards: {
        totalLimit: totalCardLimit,
        usedLimit: usedCardLimit,
        availableLimit: totalCardLimit - usedCardLimit,
        usagePercent: totalCardLimit > 0 ? (usedCardLimit / totalCardLimit) * 100 : 0,
        count: creditCards.length,
      },
      goals: {
        total: goals.length,
        completed: goals.filter((g) => g.isCompleted).length,
        targetValue: totalGoalTarget,
        currentValue: totalGoalCurrent,
        progress: totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0,
      },
      wealth: {
        total: balance + currentInvestmentValue + totalGoalCurrent - overdueDebts,
        breakdown: {
          balance,
          investments: currentInvestmentValue,
          goals: totalGoalCurrent,
          debts: overdueDebts > 0 ? -overdueDebts : 0,
        },
      },
    };

    log.info("Dashboard summary calculated", {
      userId,
      durationMs: Date.now() - startTime,
      wealth: summary.wealth.total,
    });

    return summary;
  }

  /**
   * Calculate financial health score.
   */
  async calculateHealthScore(userId: string): Promise<HealthScore> {
    const startTime = Date.now();
    log.debug("Calculating health score", { userId });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Use repositories for proper decryption
    const [
      monthlyTotals,
      investments,
      creditCards,
      goals,
      budgets,
      categoryExpenses,
    ] = await Promise.all([
      this.getPeriodTotals(userId, monthStart, monthEnd),
      investmentRepository.findByUser(userId),
      cardRepository.findByUser(userId, { includeInvoices: true }),
      goalRepository.findByUser(userId),
      budgetRepository.findByUser(userId),
      this.getCategoryBreakdown(userId, monthStart, monthEnd, "expense"),
    ]);

    // Savings rate (0-100, where 50% savings = max score)
    const savingsRate = monthlyTotals.income > 0
      ? ((monthlyTotals.income - monthlyTotals.expense) / monthlyTotals.income) * 100
      : 0;
    const savingsScore = Math.min(Math.max(savingsRate, 0), 50) * 2;

    // Credit utilization (0-100, where 30%+ = 0 score)
    // Type assertion for cards with invoices
    type HealthCardWithInvoices = typeof creditCards[number] & {
      invoices?: Array<{ status: string; total: unknown; paidAmount: unknown }>;
    };
    const healthCardsWithInvoices = creditCards as HealthCardWithInvoices[];

    const totalCreditLimit = healthCardsWithInvoices.reduce((sum: number, c) => sum + (c.limit as unknown as number), 0);
    const totalCreditUsed = healthCardsWithInvoices.reduce((sum: number, c) => {
      // Filter for unpaid invoices (status !== "paid")
      const unpaidInvoices = (c.invoices || []).filter((inv) => inv.status !== "paid");
      return sum + unpaidInvoices.reduce((invSum: number, inv) => invSum + (inv.total as unknown as number) - (inv.paidAmount as unknown as number), 0);
    }, 0);
    const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;
    const creditScore = Math.max(0, 100 - creditUtilization * 3.33);

    // Emergency fund (0-100, where 6 months = max)
    const emergencyGoal = goals.find((g) => g.category === "emergency");
    const emergencyFundMonths = monthlyTotals.expense > 0 && emergencyGoal
      ? (emergencyGoal.currentValue as unknown as number) / monthlyTotals.expense
      : 0;
    const emergencyScore = Math.min(emergencyFundMonths / 6, 1) * 100;

    // Goals progress
    const totalGoalTarget2 = goals.reduce((sum, g) => sum + (g.targetValue as unknown as number), 0);
    const totalGoalCurrent2 = goals.reduce((sum, g) => sum + (g.currentValue as unknown as number), 0);
    const goalsScore = totalGoalTarget2 > 0 ? (totalGoalCurrent2 / totalGoalTarget2) * 100 : 50;

    // Diversification (0-100, where 5 types = max)
    const investmentTypes = new Set(investments.map((i) => i.type)).size;
    const diversificationScore = Math.min(investmentTypes / 5, 1) * 100;

    // Budget adherence
    let budgetScore = 100;
    if (budgets.length > 0) {
      const categoryMap: Record<string, number> = {};
      for (const cat of categoryExpenses) {
        categoryMap[cat.category] = cat.total;
      }

      const budgetStatuses = budgets.map((b) => {
        const spent = categoryMap[b.category] || 0;
        return Math.min((spent / (b.limit as unknown as number)) * 100, 200);
      });

      const avgUsage = budgetStatuses.reduce((a, b) => a + b, 0) / budgetStatuses.length;
      budgetScore = Math.max(0, 100 - Math.max(0, avgUsage - 100));
    }

    // Weighted final score
    const weights = {
      savingsRate: 0.25,
      creditUtilization: 0.20,
      emergencyFund: 0.20,
      goalsProgress: 0.15,
      diversification: 0.10,
      budgetAdherence: 0.10,
    };

    const finalScore = Math.round(
      savingsScore * weights.savingsRate +
      creditScore * weights.creditUtilization +
      emergencyScore * weights.emergencyFund +
      goalsScore * weights.goalsProgress +
      diversificationScore * weights.diversification +
      budgetScore * weights.budgetAdherence
    );

    // Determine level and message
    let level: HealthScore["level"];
    let message: string;

    if (finalScore >= 80) {
      level = "excellent";
      message = "Excelente! Sua saúde financeira está ótima.";
    } else if (finalScore >= 60) {
      level = "good";
      message = "Bom! Você está no caminho certo.";
    } else if (finalScore >= 40) {
      level = "fair";
      message = "Regular. Há espaço para melhorar.";
    } else {
      level = "poor";
      message = "Atenção! Revise suas finanças.";
    }

    // Generate tips
    const tips: string[] = [];
    if (savingsRate < 20) tips.push("Tente aumentar sua taxa de poupança para pelo menos 20%");
    if (creditUtilization > 30) tips.push("Reduza o uso do cartão de crédito para menos de 30% do limite");
    if (emergencyFundMonths < 3) tips.push("Priorize construir uma reserva de emergência de 3-6 meses");
    if (investmentTypes < 3) tips.push("Diversifique seus investimentos em mais classes de ativos");
    if (budgetScore < 80) tips.push("Revise seus orçamentos - você está gastando além do planejado");

    log.info("Health score calculated", {
      userId,
      durationMs: Date.now() - startTime,
      score: finalScore,
      level,
    });

    return {
      score: finalScore,
      level,
      message,
      tips,
      componentScores: {
        savingsRate: savingsScore,
        creditUtilization: creditScore,
        emergencyFund: emergencyScore,
        goalsProgress: goalsScore,
        diversification: diversificationScore,
        budgetAdherence: budgetScore,
      },
    };
  }

  /**
   * Helper to calculate overdue debts from credit cards.
   */
  private calculateOverdueDebts(
    creditCards: Array<{
      invoices: Array<{
        status: string;
        year: number;
        month: number;
        total: number;
        paidAmount: number;
        dueDate: Date;
      }>;
    }>,
    now: Date
  ): number {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return creditCards.reduce((acc, c) => {
      const overdue = c.invoices
        .filter((inv) => {
          const total = inv.total as unknown as number;
          const paidAmount = inv.paidAmount as unknown as number;
          if (inv.status === "paid" || total <= paidAmount) return false;
          if (inv.status === "overdue") return true;

          const isPastMonth = inv.year < currentYear ||
            (inv.year === currentYear && inv.month < currentMonth);
          const isCurrentMonthOverdue = inv.year === currentYear &&
            inv.month === currentMonth &&
            new Date(inv.dueDate) < now;

          return isPastMonth || isCurrentMonthOverdue;
        })
        .reduce((sum, inv) => sum + ((inv.total as unknown as number) - (inv.paidAmount as unknown as number)), 0);
      return acc + overdue;
    }, 0);
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
