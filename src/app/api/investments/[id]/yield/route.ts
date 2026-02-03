import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { isFixedIncome } from "@/types";
import {
  fetchCDIHistory,
  calculateFixedIncomeYield,
  calculateIOF,
  calculateIR,
  type YieldCalculationResult,
} from "@/lib/cdi-history-service";
import { investmentRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    // Use repository for proper decryption of encrypted fields
    const investmentRaw = await investmentRepository.findById(id, session.user.id, true);

    if (!investmentRaw) {
      return errorResponse("Investimento não encontrado", 404, "NOT_FOUND");
    }

    // Type assertion for included operations
    const investment = investmentRaw as typeof investmentRaw & {
      operations?: Array<{
        id: string;
        type: string;
        quantity: number;
        price: number;
        total: number;
        date: Date;
        fees: number;
        notes: string | null;
      }>;
    };

    // Sort operations by date ascending for yield calculation
    const sortedOperations = [...(investment.operations || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

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

    const deposits = sortedOperations.filter(op => op.type === "deposit" || op.type === "buy");
    const withdrawals = sortedOperations.filter(op => op.type === "sell" || op.type === "withdraw");

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

      const depositValue = deposit.price as unknown as number;

      const result = calculateFixedIncomeYield(
        depositValue,
        depositDate,
        (investment.interestRate as unknown as number) || 100,
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
      totalWithdrawals += withdrawal.price as unknown as number;
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
