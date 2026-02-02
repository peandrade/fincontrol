import { prisma } from "@/lib/prisma";
import { isFixedIncome, type CreateOperationInput, type InvestmentType } from "@/types";
import {
  fetchCDIHistory,
  calculateFixedIncomeYield,
} from "@/lib/cdi-history-service";

/**
 * Service error for business logic failures.
 */
export class InvestmentOperationError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "VALIDATION_ERROR"
      | "INSUFFICIENT_BALANCE"
      | "INSUFFICIENT_QUANTITY"
      | "INVALID_DATE"
      | "INVALID_OPERATION",
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "InvestmentOperationError";
  }
}

/**
 * Result of investment metrics calculation.
 */
interface InvestmentMetrics {
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

/**
 * Service for investment operation business logic.
 * Handles buy, sell, deposit, withdraw, and dividend operations.
 *
 * Extracted from /api/investments/[id]/operations/route.ts
 */
export class InvestmentOperationService {
  /**
   * Add a new operation to an investment.
   * Handles all operation types: buy, sell, dividend.
   * Creates corresponding transaction records.
   * Recalculates fixed income yield if applicable.
   *
   * @throws InvestmentOperationError if validation fails
   */
  async addOperation(
    userId: string,
    investmentId: string,
    input: CreateOperationInput,
    options: {
      availableBalance?: number;
      skipBalanceCheck?: boolean;
    } = {}
  ) {
    // 1. Fetch and validate ownership
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        operations: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    if (!investment) {
      throw new InvestmentOperationError("Investimento não encontrado", "NOT_FOUND");
    }

    if (investment.userId !== userId) {
      throw new InvestmentOperationError("Não autorizado", "FORBIDDEN");
    }

    // 2. Parse and validate date
    const operationDate = this.parseOperationDate(input.date);
    this.validateOperationDate(operationDate, investment.operations[0]?.date);

    // 3. Handle different operation types
    const isFixed = isFixedIncome(investment.type as InvestmentType);

    if (input.type === "dividend") {
      return this.handleDividendOperation(
        userId,
        investment,
        input,
        operationDate
      );
    }

    return this.handleBuySellOperation(
      userId,
      investment,
      input,
      operationDate,
      isFixed,
      options
    );
  }

  /**
   * Handle dividend operations.
   * Creates operation record and income transaction.
   */
  private async handleDividendOperation(
    userId: string,
    investment: { id: string; name: string; ticker: string | null },
    input: CreateOperationInput,
    operationDate: Date
  ) {
    if (!input.total || input.total <= 0) {
      throw new InvestmentOperationError(
        "Valor do dividendo é obrigatório",
        "VALIDATION_ERROR"
      );
    }

    const dividendTotal = Number(input.total);

    const result = await prisma.$transaction(async (tx) => {
      // Create the operation
      const operation = await tx.operation.create({
        data: {
          investmentId: investment.id,
          type: "dividend",
          quantity: 0,
          price: 0,
          total: dividendTotal,
          date: operationDate,
          fees: 0,
          notes: input.notes || null,
        },
      });

      // Create income transaction for the dividend
      await tx.transaction.create({
        data: {
          type: "income",
          value: dividendTotal,
          category: "Dividendo",
          description: `Provento: ${investment.name}${investment.ticker ? ` (${investment.ticker})` : ""}`,
          date: operationDate,
          userId,
        },
      });

      // Return updated investment
      const updatedInvestment = await tx.investment.findUnique({
        where: { id: investment.id },
        include: {
          operations: { orderBy: { date: "desc" } },
        },
      });

      return { operation, investment: updatedInvestment };
    });

    return result;
  }

  /**
   * Handle buy/sell operations.
   * Validates balance/quantity, calculates metrics, creates transaction records.
   */
  private async handleBuySellOperation(
    userId: string,
    investment: {
      id: string;
      name: string;
      type: string;
      quantity: number;
      averagePrice: number;
      currentPrice: number;
      totalInvested: number;
      currentValue: number;
      indexer: string | null;
      interestRate: number | null;
    },
    input: CreateOperationInput,
    operationDate: Date,
    isFixed: boolean,
    options: { availableBalance?: number; skipBalanceCheck?: boolean }
  ) {
    const { type, notes } = input;
    const quantity = Number(input.quantity) || 1;
    const price = Number(input.price);
    const fees = Number(input.fees) || 0;
    const total = isFixed ? price + fees : quantity * price + fees;

    // Validate price
    if (!price) {
      throw new InvestmentOperationError("Valor é obrigatório", "VALIDATION_ERROR");
    }

    // Validate sell operations
    if (type === "sell") {
      if (isFixed) {
        if (price > investment.currentValue) {
          throw new InvestmentOperationError(
            `Valor do resgate (R$ ${price.toFixed(2)}) excede o saldo disponível (R$ ${investment.currentValue.toFixed(2)})`,
            "INSUFFICIENT_BALANCE"
          );
        }
      } else {
        if (quantity > investment.quantity) {
          throw new InvestmentOperationError(
            `Quantidade (${quantity}) excede o disponível (${investment.quantity} cotas)`,
            "INSUFFICIENT_QUANTITY"
          );
        }
      }
    }

    // Validate balance for buy operations
    if (type === "buy" && !options.skipBalanceCheck && options.availableBalance !== undefined) {
      if (options.availableBalance < total) {
        throw new InvestmentOperationError(
          "Saldo insuficiente",
          "INSUFFICIENT_BALANCE",
          { availableBalance: options.availableBalance, required: total }
        );
      }
    }

    // Calculate new investment values
    const metrics = this.calculateMetrics(investment, { type, quantity, price, fees, total }, isFixed);

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the operation
      const operation = await tx.operation.create({
        data: {
          investmentId: investment.id,
          type,
          quantity: isFixed ? 1 : quantity,
          price: isFixed ? total - fees : price,
          total,
          date: operationDate,
          fees,
          notes: notes || null,
        },
      });

      // Create transaction record for buy (expense)
      if (type === "buy" && !options.skipBalanceCheck) {
        await tx.transaction.create({
          data: {
            type: "expense",
            value: total,
            category: "Investimento",
            description: `${isFixed ? "Depósito" : "Compra"}: ${investment.name}`,
            date: operationDate,
            userId,
          },
        });
      }

      // Create transaction record for sell (income)
      if (type === "sell") {
        await tx.transaction.create({
          data: {
            type: "income",
            value: total - fees,
            category: "Investimento",
            description: `${isFixed ? "Resgate" : "Venda"}: ${investment.name}`,
            date: operationDate,
            userId,
          },
        });
      }

      // Update investment values
      const updatedInvestment = await tx.investment.update({
        where: { id: investment.id },
        data: {
          quantity: metrics.quantity,
          averagePrice: metrics.averagePrice,
          totalInvested: metrics.totalInvested,
          currentPrice: metrics.currentPrice,
          currentValue: metrics.currentValue,
          profitLoss: metrics.profitLoss,
          profitLossPercent: metrics.profitLossPercent,
        },
        include: {
          operations: { orderBy: { date: "desc" } },
        },
      });

      return { operation, investment: updatedInvestment };
    });

    // Post-transaction: recalculate yield for fixed income
    let finalInvestment = result.investment;
    if (isFixed && investment.indexer && investment.indexer !== "NA") {
      finalInvestment = await this.recalculateFixedIncomeYield(
        investment.id,
        investment.interestRate || 100,
        investment.indexer
      ) || result.investment;
    }

    return { operation: result.operation, investment: finalInvestment };
  }

  /**
   * Parse operation date from input.
   */
  private parseOperationDate(date: Date | string): Date {
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
   * Validate that new operation date is valid.
   */
  private validateOperationDate(
    operationDate: Date,
    lastOperationDate?: Date | string | null
  ) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (operationDate > today) {
      throw new InvestmentOperationError(
        "A data da operação não pode ser futura",
        "INVALID_DATE"
      );
    }

    if (lastOperationDate) {
      const lastDate = new Date(lastOperationDate);
      lastDate.setHours(0, 0, 0, 0);
      const opDate = new Date(operationDate);
      opDate.setHours(0, 0, 0, 0);

      if (opDate < lastDate) {
        throw new InvestmentOperationError(
          `A data da operação não pode ser anterior a ${lastDate.toLocaleDateString("pt-BR")} (data da última operação)`,
          "INVALID_DATE"
        );
      }
    }
  }

  /**
   * Calculate new investment metrics after operation.
   */
  private calculateMetrics(
    investment: {
      quantity: number;
      averagePrice: number;
      currentPrice: number;
      totalInvested: number;
      currentValue: number;
    },
    operation: {
      type: string;
      quantity: number;
      price: number;
      fees: number;
      total: number;
    },
    isFixed: boolean
  ): InvestmentMetrics {
    const { type, quantity, price, total } = operation;

    let newQuantity: number;
    let newTotalInvested: number;
    let newAveragePrice: number;
    let currentPrice: number;
    let currentValue: number;

    if (isFixed) {
      if (type === "buy") {
        newTotalInvested = investment.totalInvested + total;
        currentValue = investment.currentValue + total;
      } else {
        const percentResgatado = total / investment.currentValue;
        const totalInvestidoResgatado = investment.totalInvested * percentResgatado;
        newTotalInvested = Math.max(0, investment.totalInvested - totalInvestidoResgatado);
        currentValue = Math.max(0, investment.currentValue - total);
      }

      newQuantity = 1;
      newAveragePrice = newTotalInvested;
      currentPrice = currentValue;
    } else {
      if (type === "buy") {
        newQuantity = investment.quantity + quantity;
        newTotalInvested = investment.totalInvested + total;
        newAveragePrice = newQuantity > 0 ? newTotalInvested / newQuantity : 0;
      } else {
        newQuantity = Math.max(0, investment.quantity - quantity);
        const soldValue = quantity * investment.averagePrice;
        newTotalInvested = Math.max(0, investment.totalInvested - soldValue);
        newAveragePrice = newQuantity > 0 ? newTotalInvested / newQuantity : 0;
      }

      currentPrice = investment.currentPrice || price;
      currentValue = newQuantity * currentPrice;
    }

    const profitLoss = currentValue - newTotalInvested;
    const profitLossPercent = newTotalInvested > 0 ? (profitLoss / newTotalInvested) * 100 : 0;

    return {
      quantity: newQuantity,
      averagePrice: newAveragePrice,
      currentPrice,
      totalInvested: newTotalInvested,
      currentValue,
      profitLoss,
      profitLossPercent,
    };
  }

  /**
   * Recalculate yield for fixed income investments based on CDI history.
   */
  private async recalculateFixedIncomeYield(
    investmentId: string,
    interestRate: number,
    indexer: string
  ) {
    try {
      const cdiHistory = await fetchCDIHistory(1500);
      if (!cdiHistory) return null;

      const allOperations = await prisma.operation.findMany({
        where: { investmentId },
        orderBy: { date: "asc" },
      });

      const deposits = allOperations.filter(op => op.type === "deposit" || op.type === "buy");
      const withdrawals = allOperations.filter(op => op.type === "sell" || op.type === "withdraw");

      let totalGrossValue = 0;
      let totalGrossYield = 0;
      let totalPrincipal = 0;

      for (const deposit of deposits) {
        const depositDate = new Date(deposit.date).toISOString().split("T")[0];
        const depositValue = deposit.price;

        const yieldResult = calculateFixedIncomeYield(
          depositValue,
          depositDate,
          interestRate,
          indexer,
          cdiHistory
        );

        if (yieldResult) {
          totalGrossValue += yieldResult.grossValue;
          totalGrossYield += yieldResult.grossYield;
          totalPrincipal += depositValue;
        } else {
          totalPrincipal += depositValue;
          totalGrossValue += depositValue;
        }
      }

      let totalWithdrawals = 0;
      for (const withdrawal of withdrawals) {
        totalWithdrawals += withdrawal.price;
      }

      const finalGrossValue = totalGrossValue - totalWithdrawals;
      const effectivePrincipal = totalPrincipal - totalWithdrawals;
      const finalProfitLoss = totalGrossYield;
      const finalProfitLossPercent = effectivePrincipal > 0
        ? (finalProfitLoss / effectivePrincipal) * 100
        : 0;

      return prisma.investment.update({
        where: { id: investmentId },
        data: {
          currentValue: finalGrossValue,
          currentPrice: finalGrossValue,
          profitLoss: finalProfitLoss,
          profitLossPercent: finalProfitLossPercent,
        },
        include: {
          operations: { orderBy: { date: "desc" } },
        },
      });
    } catch (error) {
      console.error("Erro ao recalcular rendimento:", error);
      return null;
    }
  }
}

// Singleton instance
export const investmentOperationService = new InvestmentOperationService();
