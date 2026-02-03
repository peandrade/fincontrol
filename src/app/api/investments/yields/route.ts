import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import {
  fetchCDIHistory,
  calculateFixedIncomeYield,
  calculateIOF,
  calculateIR,
  type YieldCalculationResult,
} from "@/lib/cdi-history-service";
import { investmentRepository } from "@/repositories";

export interface InvestmentYield {
  investmentId: string;
  investmentName: string;
  type: string;
  indexer: string | null;
  contractedRate: number | null;
  totalInvested: number;
  calculation: YieldCalculationResult | null;
  depositCount?: number;
  error?: string;
}

export interface YieldsResponse {
  yields: InvestmentYield[];
  cdiHistory: {
    startDate: string;
    endDate: string;
    totalDays: number;
  } | null;
  lastUpdate: string;
}

const FIXED_INCOME_TYPES = ["cdb", "treasury", "lci_lca", "savings", "other"];

export async function GET() {
  return withAuth(async (session) => {
    const cdiHistory = await fetchCDIHistory(1500);

    if (!cdiHistory) {
      return errorResponse("Não foi possível buscar histórico do CDI", 503, "CDI_UNAVAILABLE");
    }

    // Use repository for proper decryption of encrypted fields
    const investmentsRaw = await investmentRepository.findByType(
      session.user.id,
      FIXED_INCOME_TYPES,
      { includeOperations: true }
    );

    // Type assertion for operations
    type OperationType = {
      id: string;
      type: string;
      quantity: number;
      price: number;
      total: number;
      date: Date;
      fees: number;
      notes: string | null;
    };

    const investments = investmentsRaw as Array<typeof investmentsRaw[number] & { operations?: OperationType[] }>;

    const yields: InvestmentYield[] = [];

    for (const inv of investments) {
      const operations = inv.operations || [];

      if (!inv.indexer || inv.indexer === "NA") {
        yields.push({
          investmentId: inv.id,
          investmentName: inv.name,
          type: inv.type,
          indexer: inv.indexer,
          contractedRate: inv.interestRate as unknown as number | null,
          totalInvested: inv.totalInvested as unknown as number,
          calculation: null,
          error: "Investimento sem indexador definido",
        });
        continue;
      }

      if (operations.length === 0) {
        yields.push({
          investmentId: inv.id,
          investmentName: inv.name,
          type: inv.type,
          indexer: inv.indexer,
          contractedRate: inv.interestRate as unknown as number | null,
          totalInvested: inv.totalInvested as unknown as number,
          calculation: null,
          error: "Sem operações registradas",
        });
        continue;
      }

      const deposits = operations.filter(op => op.type === "deposit" || op.type === "buy");
      const withdrawals = operations.filter(op => op.type === "sell" || op.type === "withdraw");

      if (deposits.length === 0) {
        yields.push({
          investmentId: inv.id,
          investmentName: inv.name,
          type: inv.type,
          indexer: inv.indexer,
          contractedRate: inv.interestRate as unknown as number | null,
          totalInvested: inv.totalInvested as unknown as number,
          calculation: null,
          error: "Sem aporte registrado",
        });
        continue;
      }

      let totalGrossValue = 0;
      let totalGrossYield = 0;
      let totalPrincipal = 0;
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
          (inv.interestRate as unknown as number) || 100,
          inv.indexer,
          cdiHistory
        );

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

      const totalNetValue = totalGrossValue - totalIofAmount - totalIrAmount - totalWithdrawals;

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

      yields.push({
        investmentId: inv.id,
        investmentName: inv.name,
        type: inv.type,
        indexer: inv.indexer,
        contractedRate: inv.interestRate as unknown as number | null,
        totalInvested: inv.totalInvested as unknown as number,
        calculation,
        depositCount: deposits.length,
      });
    }

    // Update investments with calculated yields using repository
    for (const yieldData of yields) {
      if (yieldData.calculation) {
        await investmentRepository.updateById(yieldData.investmentId, {
          currentValue: yieldData.calculation.grossValue,
          profitLoss: yieldData.calculation.grossYield,
          profitLossPercent: yieldData.calculation.grossYieldPercent,
        });
      }
    }

    const response: YieldsResponse = {
      yields,
      cdiHistory: {
        startDate: cdiHistory.startDate,
        endDate: cdiHistory.endDate,
        totalDays: cdiHistory.entries.length,
      },
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(response);
  });
}
