import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateInvestmentCache } from "@/lib/api-utils";
import { updateInvestmentSchema, validateBody } from "@/lib/schemas";

const VARIABLE_INCOME_TYPES = ["stock", "fii", "etf", "crypto"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: {
        operations: { orderBy: { date: "desc" } },
      },
    });

    if (!investment) {
      return errorResponse("Investimento não encontrado", 404, "NOT_FOUND");
    }

    if (investment.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    return NextResponse.json(investment);
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateInvestmentSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const existing = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Investimento não encontrado", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    const validatedData = validation.data;
    const isVariable = VARIABLE_INCOME_TYPES.includes(existing.type);
    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.ticker !== undefined) updateData.ticker = validatedData.ticker;
    if (validatedData.institution !== undefined) updateData.institution = validatedData.institution;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.goalValue !== undefined) updateData.goalValue = validatedData.goalValue;

    if (validatedData.interestRate !== undefined) updateData.interestRate = validatedData.interestRate;
    if (validatedData.indexer !== undefined) updateData.indexer = validatedData.indexer;
    if (validatedData.maturityDate !== undefined) {
      updateData.maturityDate = validatedData.maturityDate ? new Date(validatedData.maturityDate) : null;
    }

    if (isVariable) {
      if (validatedData.currentPrice !== undefined) {
        const currentPrice = Number(validatedData.currentPrice);
        const currentValue = existing.quantity * currentPrice;
        const profitLoss = currentValue - existing.totalInvested;
        const profitLossPercent = existing.totalInvested > 0
          ? (profitLoss / existing.totalInvested) * 100
          : 0;

        updateData.currentPrice = currentPrice;
        updateData.currentValue = currentValue;
        updateData.profitLoss = profitLoss;
        updateData.profitLossPercent = profitLossPercent;
      }
    } else {
      const newTotalInvested = validatedData.totalInvested !== undefined
        ? Number(validatedData.totalInvested)
        : existing.totalInvested;
      const newCurrentValue = validatedData.currentValue !== undefined
        ? Number(validatedData.currentValue)
        : existing.currentValue;

      if (validatedData.totalInvested !== undefined) {
        updateData.totalInvested = newTotalInvested;
      }

      if (validatedData.currentValue !== undefined) {
        updateData.currentValue = newCurrentValue;
      }

      if (validatedData.totalInvested !== undefined || validatedData.currentValue !== undefined) {
        const profitLoss = newCurrentValue - newTotalInvested;
        const profitLossPercent = newTotalInvested > 0
          ? (profitLoss / newTotalInvested) * 100
          : 0;

        updateData.profitLoss = profitLoss;
        updateData.profitLossPercent = profitLossPercent;
      }
    }

    const investment = await prisma.investment.update({
      where: { id },
      data: updateData,
      include: {
        operations: { orderBy: { date: "desc" } },
      },
    });

    // Invalidate related caches
    invalidateInvestmentCache(session.user.id);

    return NextResponse.json(investment);
  }, request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Investimento não encontrado", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    await prisma.investment.delete({
      where: { id },
    });

    // Invalidate related caches
    invalidateInvestmentCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
