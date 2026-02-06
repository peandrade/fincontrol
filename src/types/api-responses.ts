// ============================================
// Analytics API Response Types
// ============================================

export interface CategoryTrend {
  category: string;
  months: {
    month: string;
    value: number;
  }[];
  trend: number;
  average: number;
}

export interface DayOfWeekPattern {
  dayOfWeek: number;
  dayKey: string;
  totalExpenses: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}

export interface SpendingVelocity {
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

export interface YearComparisonMonth {
  month: number;
  monthKey: string;
  currentYearExpenses: number;
  previousYearExpenses: number;
  currentYearIncome: number;
  previousYearIncome: number;
}

export interface YearComparison {
  currentYear: number;
  previousYear: number;
  months: YearComparisonMonth[];
  totals: {
    currentYearExpenses: number;
    previousYearExpenses: number;
    currentYearIncome: number;
    previousYearIncome: number;
    expenseChange: number;
    incomeChange: number;
  };
}

export interface TopInsight {
  type: "positive" | "negative" | "neutral";
  titleKey: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
}

export interface AnalyticsData {
  dayOfWeekPatterns: DayOfWeekPattern[];
  categoryTrends: CategoryTrend[];
  spendingVelocity: SpendingVelocity;
  yearComparison: YearComparison;
  insights: TopInsight[];
}

// ============================================
// Financial Health API Response Types
// ============================================

export interface SavingsRatePeriod {
  income: number;
  expenses: number;
  savings: number;
  rate: number;
}

export interface FinancialHealthDetails {
  savingsRate: {
    monthly: SavingsRatePeriod;
    yearly: SavingsRatePeriod;
  };
  creditUtilization: {
    limit: number;
    used: number;
    percentage: number;
  };
  emergencyFund: {
    current: number;
    monthlyExpenses: number;
    monthsCovered: number;
    target: number;
  };
  goals: {
    total: number;
    completed: number;
    progress: number;
  };
  investments: {
    total: number;
    types: number;
    diversification: number;
    byType: Record<string, number>;
  };
  budgetAdherence: number;
  spendingTrend: number;
}

export interface ComponentScores {
  savingsRate: number;
  creditUtilization: number;
  emergencyFund: number;
  goalsProgress: number;
  diversification: number;
  budgetAdherence: number;
  spendingTrend: number;
}

export interface FinancialHealthData {
  score: number;
  scoreLevel: "excellent" | "good" | "fair" | "poor";
  scoreMessage: string;
  tips: string[];
  details: FinancialHealthDetails;
  componentScores: ComponentScores;
}

// ============================================
// Wealth Evolution API Response Types
// ============================================

export interface WealthDataPoint {
  month: string;
  label: string;
  transactionBalance: number;
  investmentValue: number;
  cardDebt: number;
  totalWealth: number;
  goalsSaved: number;
}

export interface WealthSummary {
  currentWealth: number;
  transactionBalance: number;
  investmentValue: number;
  goalsSaved: number;
  cardDebt: number;
  wealthChange: number;
  wealthChangePercent: number;
}

export interface WealthEvolutionData {
  evolution: WealthDataPoint[];
  summary: WealthSummary;
  period: string;
}

// ============================================
// Cards Analytics API Response Types
// ============================================

export interface CardSpendingByCategory {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface CardBreakdown {
  cardId: string;
  cardName: string;
  cardColor: string;
  total: number;
}

export interface CardMonthlySpending {
  month: string;
  monthLabel: string;
  total: number;
  cardBreakdown: CardBreakdown[];
}

export interface CardAlert {
  type: "payment_due" | "high_usage" | "closing_soon";
  cardId: string;
  cardName: string;
  cardColor: string;
  message: string;
  value?: number;
  daysUntil?: number;
}

export interface CardsSummary {
  totalCards: number;
  totalLimit: number;
  totalUsed: number;
  usagePercentage: number;
  averageMonthlySpending: number;
  totalSpendingLast6Months: number;
}

export interface CardsAnalyticsData {
  spendingByCategory: CardSpendingByCategory[];
  monthlySpending: CardMonthlySpending[];
  alerts: CardAlert[];
  summary: CardsSummary;
}

// ============================================
// Dashboard Summary API Response Types
// ============================================

export interface DashboardSummaryData {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  totalInvested: number;
  currentInvestmentValue: number;
  investmentProfitLoss: number;
  totalCardLimit: number;
  usedCardLimit: number;
  availableCardLimit: number;
  overdueDebts: number;
  totalGoalsSaved: number;
  totalGoalsTarget: number;
  goalsProgress: number;
}
