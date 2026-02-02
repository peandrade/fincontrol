import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { isFixedIncome } from "@/types";
import {
  fetchCDIHistory,
  calculateFixedIncomeYield,
  calculateIOF,
  calculateIR,
  type YieldCalculationResult,
} from "@/lib/cdi-history-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const investment = await prisma.investment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        operations: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!investment) {
      return errorResponse("Investimento não encontrado", 404, "NOT_FOUND");
    }

    if (!isFixedIncome(investment.type as Parameters<typeof isFixedIncome>[0])) {
      return errorResponse("Este investimento não é de renda fixa", 400, "NOT_FIXED_INCOME");
    }

    if (!investment.indexer || investment.indexer === "NA") {
      return NextResponse.json({
        investmentId: id,
        investmentName: investment.name,
        calculation: null,
        message: "Investimento sem indexador definido",
      });
    }

    const cdiHistory = await fetchCDIHistory(1500);

    if (!cdiHistory) {
      return errorResponse("Não foi possível buscar histórico do CDI", 503, "CDI_UNAVAILABLE");
    }

    const deposits = investment.operations.filter(op => op.type === "deposit" || op.type === "buy");
    const withdrawals = investment.operations.filter(op => op.type === "sell" || op.type === "withdraw");

    if (deposits.length === 0) {
      return NextResponse.json({
        investmentId: id,
        investmentName: investment.name,
        calculation: null,
        message: "Sem aporte registrado",
      });
    }

    const depositCalculations: {
      date: string;
      principal: number;
      result: YieldCalculationResult | null;
    }[] = [];

    let totalGrossValue = 0;
    let totalGrossYield = 0;
    let totalPrincipal = 0;
    let totalNetValue = 0;
    let totalNetYield = 0;
    let totalIofAmount = 0;
    let totalIrAmount = 0;
    let maxCalendarDays = 0;
    let totalBusinessDays = 0;

    for (const deposit of deposits) {
      const depositDate = new Date(deposit.date).toISOString().split("T")[0];

      const depositValue = deposit.price;

      const result = calculateFixedIncomeYield(
        depositValue,
        depositDate,
        investment.interestRate || 100,
        investment.indexer,
        cdiHistory
      );

      depositCalculations.push({
        date: depositDate,
        principal: depositValue,
        result,
      });

      if (result) {
        totalGrossValue += result.grossValue;
        totalGrossYield += result.grossYield;
        totalPrincipal += depositValue;
        totalNetYield += result.netYield;
        totalIofAmount += result.iofAmount;
        totalIrAmount += result.irAmount;

        if (result.calendarDays > maxCalendarDays) {
          maxCalendarDays = result.calendarDays;
          totalBusinessDays = result.businessDays;
        }
      } else {
        totalPrincipal += depositValue;
        totalGrossValue += depositValue;
      }
    }

    let totalWithdrawals = 0;
    for (const withdrawal of withdrawals) {
      totalWithdrawals += withdrawal.price;
    }

    totalNetValue = totalGrossValue - totalIofAmount - totalIrAmount - totalWithdrawals;

    const effectivePrincipal = totalPrincipal - totalWithdrawals;
    const grossYieldPercent = effectivePrincipal > 0 ? (totalGrossYield / effectivePrincipal) * 100 : 0;
    const netYieldPercent = effectivePrincipal > 0 ? (totalNetYield / effectivePrincipal) * 100 : 0;

    const avgIofPercent = totalGrossYield > 0 ? (totalIofAmount / totalGrossYield) * 100 : calculateIOF(maxCalendarDays);
    const avgIrPercent = calculateIR(maxCalendarDays);

    const calculation: YieldCalculationResult = {
      grossValue: totalGrossValue - totalWithdrawals,
      grossYield: totalGrossYield,
      grossYieldPercent,
      iofAmount: totalIofAmount,
      iofPercent: avgIofPercent,
      irAmount: totalIrAmount,
      irPercent: avgIrPercent,
      netValue: totalNetValue,
      netYield: totalNetYield,
      netYieldPercent,
      businessDays: totalBusinessDays,
      calendarDays: maxCalendarDays,
      dailyRates: [],
    };

    const startDate = new Date(deposits[0].date).toISOString().split("T")[0];

    return NextResponse.json({
      investmentId: id,
      investmentName: investment.name,
      type: investment.type,
      indexer: investment.indexer,
      contractedRate: investment.interestRate,
      totalInvested: investment.totalInvested,
      startDate,
      calculation,

      depositBreakdown: depositCalculations.map(d => ({
        date: d.date,
        principal: d.principal,
        grossValue: d.result?.grossValue || d.principal,
        grossYield: d.result?.grossYield || 0,
        netYield: d.result?.netYield || 0,
        calendarDays: d.result?.calendarDays || 0,
      })),
      totalDeposits: deposits.length,
      totalWithdrawals: withdrawals.length,
      cdiHistory: {
        startDate: cdiHistory.startDate,
        endDate: cdiHistory.endDate,
        totalDays: cdiHistory.entries.length,
      },
    });
  });
}
