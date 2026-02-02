import { transactionRepository, type TransactionFilters } from "@/repositories";
import type { TransactionType } from "@/types";

/**
 * Input for creating a transaction.
 * Accepts date as string or Date for flexibility.
 */
export interface CreateTransactionData {
  type: TransactionType;
  value: number;
  category: string;
  description?: string;
  date: Date | string;
}

/**
 * Input for updating a transaction.
 * All fields are optional, date can be string or Date.
 */
export interface UpdateTransactionData {
  type?: TransactionType;
  value?: number;
  category?: string;
  description?: string | null;
  date?: Date | string;
}

/**
 * Service error for transaction business logic failures.
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Monthly comparison data.
 */
export interface MonthlyComparison {
  current: {
    income: number;
    expenses: number;
    balance: number;
  };
  previous: {
    income: number;
    expenses: number;
    balance: number;
  };
  change: {
    income: number;
    expenses: number;
    balance: number;
    incomePercent: number;
    expensePercent: number;
  };
}

/**
 * Service for transaction business logic.
 * Handles CRUD operations and analytics.
 */
export class TransactionService {
  /**
   * Parse a date from string or Date object.
   * Sets time to noon to avoid timezone issues.
   */
  private parseDate(date: Date | string): Date {
    const dateStr = typeof date === "string" ? date : date.toISOString();
    const dateParts = dateStr.split("T")[0].split("-");
    return new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      12, 0, 0, 0
    );
  }

  /**
   * Create a new transaction.
   */
  async createTransaction(
    userId: string,
    data: CreateTransactionData
  ) {
    const dateValue = this.parseDate(data.date);

    return transactionRepository.create({
      userId,
      type: data.type,
      value: data.value,
      category: data.category,
      description: data.description,
      date: dateValue,
    });
  }

  /**
   * Get a single transaction by ID.
   *
   * @throws TransactionError if not found
   */
  async getTransaction(userId: string, transactionId: string) {
    const transaction = await transactionRepository.findById(transactionId, userId);

    if (!transaction) {
      throw new TransactionError("Transação não encontrada", "NOT_FOUND");
    }

    return transaction;
  }

  /**
   * Get transactions with filters.
   */
  async getTransactions(userId: string, filters: TransactionFilters = {}) {
    return transactionRepository.findByUser(userId, filters);
  }

  /**
   * Get transactions with pagination.
   */
  async getTransactionsPaginated(userId: string, filters: TransactionFilters = {}) {
    return transactionRepository.findByUserPaginated(userId, filters);
  }

  /**
   * Update a transaction.
   *
   * @throws TransactionError if not found
   */
  async updateTransaction(
    userId: string,
    transactionId: string,
    data: UpdateTransactionData
  ) {
    // Build update data with proper date parsing
    const updateData: Partial<{
      type: TransactionType;
      value: number;
      category: string;
      description: string;
      date: Date;
    }> = {};

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.value !== undefined) {
      updateData.value = data.value;
    }

    if (data.category !== undefined) {
      updateData.category = data.category;
    }

    if (data.description !== undefined) {
      updateData.description = data.description || undefined;
    }

    if (data.date !== undefined) {
      updateData.date = this.parseDate(data.date);
    }

    const result = await transactionRepository.update(transactionId, userId, updateData);

    if (result.count === 0) {
      throw new TransactionError("Transação não encontrada", "NOT_FOUND");
    }

    return transactionRepository.findById(transactionId, userId);
  }

  /**
   * Delete a transaction.
   *
   * @throws TransactionError if not found
   */
  async deleteTransaction(userId: string, transactionId: string) {
    const result = await transactionRepository.delete(transactionId, userId);

    if (result.count === 0) {
      throw new TransactionError("Transação não encontrada", "NOT_FOUND");
    }

    return true;
  }

  /**
   * Get current balance (all-time income - expenses).
   */
  async getBalance(userId: string) {
    return transactionRepository.getBalance(userId);
  }

  /**
   * Get monthly summary with comparison to previous month.
   */
  async getMonthlySummaryWithComparison(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyComparison> {
    const current = await transactionRepository.getMonthlySummary(userId, year, month);

    // Calculate previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previous = await transactionRepository.getMonthlySummary(userId, prevYear, prevMonth);

    // Calculate changes
    const incomeChange = current.income - previous.income;
    const expenseChange = current.expenses - previous.expenses;
    const balanceChange = current.balance - previous.balance;

    return {
      current: {
        income: current.income,
        expenses: current.expenses,
        balance: current.balance,
      },
      previous: {
        income: previous.income,
        expenses: previous.expenses,
        balance: previous.balance,
      },
      change: {
        income: incomeChange,
        expenses: expenseChange,
        balance: balanceChange,
        incomePercent: previous.income > 0 ? (incomeChange / previous.income) * 100 : 0,
        expensePercent: previous.expenses > 0 ? (expenseChange / previous.expenses) * 100 : 0,
      },
    };
  }

  /**
   * Get category breakdown for expenses in a period.
   */
  async getCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    type: TransactionType = "expense"
  ) {
    const breakdown = await transactionRepository.getCategoryBreakdown(
      userId,
      type,
      startDate,
      endDate
    );

    const total = breakdown.reduce((sum, cat) => sum + (cat._sum.value || 0), 0);

    return breakdown.map((cat) => ({
      category: cat.category,
      value: cat._sum.value || 0,
      count: cat._count,
      percentage: total > 0 ? ((cat._sum.value || 0) / total) * 100 : 0,
    }));
  }

  /**
   * Calculate savings rate for a period.
   */
  async getSavingsRate(userId: string, year: number, month: number) {
    const summary = await transactionRepository.getMonthlySummary(userId, year, month);

    const savingsRate = summary.income > 0
      ? ((summary.income - summary.expenses) / summary.income) * 100
      : 0;

    return {
      income: summary.income,
      expenses: summary.expenses,
      savings: summary.income - summary.expenses,
      rate: savingsRate,
    };
  }
}

// Singleton instance
export const transactionService = new TransactionService();
