import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateInvestmentCache, invalidateTransactionCache } from "@/lib/api-utils";
import { fetchSingleQuote } from "@/lib/quotes-service";
import { isFixedIncome } from "@/types";
import type { InvestmentType } from "@/types";
import { createInvestmentSchema, validateBody } from "@/lib/schemas";
import { getAvailableBalance } from "@/lib/transaction-aggregations";
import { investmentRepository, transactionRepository } from "@/repositories";

const QUOTABLE_TYPES = ["stock", "fii", "etf", "crypto"];

export async function GET() {
  return withAuth(async (session) => {
    // Get investments using repository (handles decryption)
    const investments = await investmentRepository.findByUser(session.user.id, {
      includeOperations: true,
    });

    return NextResponse.json(investments);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (session, req) => {
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createInvestmentSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const validatedBody = validation.data;
    const isFixed = isFixedIncome(validatedBody.type as InvestmentType);

    if (isFixed) {
      if (!validatedBody.initialDeposit || validatedBody.initialDeposit < 1) {
        return NextResponse.json(
          { error: "Depósito inicial deve ser de pelo menos R$ 1,00" },
          { status: 400 }
        );
      }
      if (!validatedBody.depositDate) {
        return NextResponse.json(
          { error: "Data do depósito inicial é obrigatória" },
          { status: 400 }
        );
      }

      if (!validatedBody.skipBalanceCheck) {
        const availableBalance = await getAvailableBalance(session.user.id);
        if (availableBalance < validatedBody.initialDeposit) {
          return NextResponse.json(
            {
              error: "Saldo insuficiente",
              code: "INSUFFICIENT_BALANCE",
              availableBalance,
              required: validatedBody.initialDeposit,
            },
            { status: 400 }
          );
        }
      }
    }

    let currentPrice = 0;
    if (validatedBody.ticker && QUOTABLE_TYPES.includes(validatedBody.type)) {
      try {
        console.log(`[Investments API] Buscando cotação para ${validatedBody.ticker}...`);
        const quote = await fetchSingleQuote(validatedBody.ticker, validatedBody.type);
        if (quote.source !== "error" && quote.price > 0) {
          currentPrice = quote.price;
          console.log(`[Investments API] Cotação encontrada: ${currentPrice}`);
        } else {
          console.log(`[Investments API] Cotação não encontrada: ${quote.error}`);
        }
      } catch (error) {
        console.error("[Investments API] Erro ao buscar cotação:", error);
      }
    }

    const initialDeposit = isFixed ? validatedBody.initialDeposit! : 0;
    const depositDate = isFixed ? new Date(validatedBody.depositDate!) : new Date();

    // Create investment using repository (handles encryption)
    const investment = await investmentRepository.create({
      type: validatedBody.type,
      name: validatedBody.name,
      ticker: validatedBody.ticker || undefined,
      institution: validatedBody.institution || undefined,
      notes: validatedBody.notes || undefined,
      quantity: isFixed ? 1 : 0,
      averagePrice: isFixed ? initialDeposit : 0,
      currentPrice: isFixed ? initialDeposit : currentPrice,
      totalInvested: isFixed ? initialDeposit : 0,
      currentValue: isFixed ? initialDeposit : 0,
      profitLoss: 0,
      profitLossPercent: 0,
      interestRate: validatedBody.interestRate || undefined,
      indexer: validatedBody.indexer || undefined,
      maturityDate: validatedBody.maturityDate ? new Date(validatedBody.maturityDate) : undefined,
      userId: session.user.id,
    });

    if (isFixed) {
      // Add initial operation using repository (handles encryption)
      await investmentRepository.addOperation(investment.id, session.user.id, {
        type: "buy",
        quantity: 1,
        price: initialDeposit,
        total: initialDeposit,
        date: depositDate,
        fees: 0,
        notes: "Depósito inicial",
      });

      if (!validatedBody.skipBalanceCheck) {
        // Create transaction using repository (handles encryption)
        await transactionRepository.create({
          type: "expense",
          value: initialDeposit,
          category: "Investimento",
          description: `Aplicação: ${validatedBody.name}`,
          date: depositDate,
          userId: session.user.id,
        });
      }
    }

    // Fetch updated investment with operations
    const investmentWithOperations = await investmentRepository.findById(
      investment.id,
      session.user.id,
      true
    );

    // Invalidate related caches
    invalidateInvestmentCache(session.user.id);
    if (isFixed && !validatedBody.skipBalanceCheck) {
      invalidateTransactionCache(session.user.id);
    }

    return NextResponse.json(investmentWithOperations, { status: 201 });
  }, request);
}
