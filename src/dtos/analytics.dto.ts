/**
 * Analytics DTOs
 *
 * Data Transfer Objects for analytics and dashboard-related API operations.
 */

import type { EvolutionPeriod } from "@/types";

// ============================================
// Request DTOs
// ============================================

/**
 * Query parameters for analytics endpoints.
 */
export interface AnalyticsQuery {
  period?: EvolutionPeriod;
  year?: number;
  month?: number;
}

/**
 * Query parameters for wealth evolution.
 */
export interface WealthEvolutionQuery {
  period: EvolutionPeriod;
}

// ============================================
// Response DTOs
// ============================================

/**
 * Dashboard summary response.
 */
export interface DashboardSummaryResponse {
  currentMonth: {
    income: number;
    expenses: number;
    balance: number;
  };
  previousMonth: {
    income: number;
    expenses: number;
    balance: number;
  };
  change: {
    income: number;
    expenses: number;
    incomePercent: number;
    expensePercent: number;
  };
  availableBalance: number;
  savingsRate: number;
}

/**
 * Monthly evolution data point.
 */
export interface EvolutionDataPoint {
  period: string; // Date or month label
  income: number;
  expense: number;
  balance?: number;
}

/**
 * Monthly chart response.
 */
export interface MonthlyEvolutionResponse {
  data: EvolutionDataPoint[];
  period: EvolutionPeriod;
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
}

/**
 * Wealth evolution data point.
 */
export interface WealthDataPoint {
  date: string;
  transactionBalance: number;
  investmentValue: number;
  goalsSaved: number;
  cardDebt: number;
  totalWealth: number;
}

/**
 * Wealth evolution response.
 */
export interface WealthEvolutionResponse {
  evolution: WealthDataPoint[];
  summary: {
    currentWealth: number;
    transactionBalance: number;
    investmentValue: number;
    goalsSaved: number;
    cardDebt: number;
    wealthChange: number;
    wealthChangePercent: number;
  };
  period: EvolutionPeriod;
}

/**
 * Financial health score breakdown.
 */
export interface FinancialHealthResponse {
  score: number; // 0-100
  level: "poor" | "fair" | "good" | "excellent";
  factors: {
    savingsRate: {
      score: number;
      value: number;
      weight: number;
    };
    emergencyFund: {
      score: number;
      monthsCovered: number;
      weight: number;
    };
    debtRatio: {
      score: number;
      ratio: number;
      weight: number;
    };
    investmentDiversity: {
      score: number;
      typesCount: number;
      weight: number;
    };
    budgetAdherence: {
      score: number;
      adherencePercent: number;
      weight: number;
    };
  };
  recommendations: string[];
}

/**
 * Category spending analysis.
 */
export interface CategoryAnalysisItem {
  category: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

/**
 * Transaction analytics response.
 */
export interface TransactionAnalyticsResponse {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    transactionCount: number;
    averageTransaction: number;
  };
  byCategory: CategoryAnalysisItem[];
  monthlyTrend: EvolutionDataPoint[];
  topExpenses: {
    description: string;
    category: string;
    value: number;
    date: string;
  }[];
}

// ============================================
// Credit Card Analytics
// ============================================

/**
 * Card spending by category.
 */
export interface CardSpendingByCategory {
  category: string;
  value: number;
  percentage: number;
  count: number;
}

/**
 * Card monthly spending.
 */
export interface CardMonthlySpending {
  month: string;
  value: number;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}

/**
 * Card alert.
 */
export interface CardAlert {
  type: "payment_due" | "closing_soon" | "high_usage";
  cardId: string;
  cardName: string;
  message: string;
  severity: "info" | "warning" | "danger";
  dueDate?: string;
  amount?: number;
}

/**
 * Card analytics response.
 */
export interface CardAnalyticsResponse {
  spendingByCategory: CardSpendingByCategory[];
  monthlySpending: CardMonthlySpending[];
  alerts: CardAlert[];
  summary: {
    totalCards: number;
    totalLimit: number;
    totalUsed: number;
    usagePercentage: number;
    averageMonthlySpending: number;
    totalSpendingLast6Months: number;
  };
}

// ============================================
// Goals Analytics
// ============================================

/**
 * Goal progress item.
 */
export interface GoalProgressItem {
  id: string;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  remainingValue: number;
  monthlyRequired: number | null;
  deadline: string | null;
  isOnTrack: boolean;
}

/**
 * Goals analytics response.
 */
export interface GoalsAnalyticsResponse {
  goals: GoalProgressItem[];
  summary: {
    totalGoals: number;
    completedGoals: number;
    totalTargetValue: number;
    totalCurrentValue: number;
    overallProgress: number;
  };
  monthlyContributions: {
    month: string;
    total: number;
  }[];
}

// ============================================
// Quick Stats (Dashboard)
// ============================================

/**
 * Quick stats for dashboard.
 */
export interface QuickStatsResponse {
  availableBalance: number;
  totalInvested: number;
  totalGoalsSaved: number;
  totalCardDebt: number;
  netWorth: number;
  monthlyChange: {
    balance: number;
    investments: number;
    goals: number;
  };
}
