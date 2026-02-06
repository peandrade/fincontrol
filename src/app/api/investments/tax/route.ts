import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { investmentRepository } from "@/repositories";
import {
  isTaxableType,
  calculateMonthTax,
  computeAccumulatedLosses,
  type InvestmentWithOps,
  type RawOperation,
  type TaxCalculationResult,
} from "@/lib/tax-calculator";

type DbOperation = {
  id: string;
  investmentId: string;
  type: string;
  date: Date;
  quantity: string | number | null;
  price: string | number | null;
  total: string | number | null;
  fees: string | number | null;
  notes: string | null;
};

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    let month = searchParams.get("month") || getCurrentMonth();
    if (!isValidMonth(month)) {
      month = getCurrentMonth();
    }

    // Don't allow future months beyond current
    const currentMonth = getCurrentMonth();
    if (month > currentMonth) {
      month = currentMonth;
    }

    // Fetch all investments with operations (repository handles decryption)
    const investmentsRaw = await investmentRepository.findByUser(userId, {
      includeOperations: true,
    });

    // Convert to the format expected by tax-calculator
    const investments: InvestmentWithOps[] = investmentsRaw
      .filter((inv) => isTaxableType(inv.type))
      .map((inv) => {
        const invWithOps = inv as typeof inv & { operations?: DbOperation[] };
        const operations: RawOperation[] = (invWithOps.operations || []).map(
          (op) => ({
            id: op.id,
            investmentId: op.investmentId,
            type: op.type,
            date: op.date,
            quantity: toNumber(op.quantity as unknown as number),
            price: toNumber(op.price as unknown as number),
            total: toNumber(op.total as unknown as number),
            fees: toNumber(op.fees as unknown as number),
            notes: op.notes,
          })
        );

        return {
          id: inv.id,
          name: inv.name,
          ticker: inv.ticker,
          type: inv.type,
          operations,
        };
      });

    // Compute accumulated losses from all prior months
    const accumulatedLosses = computeAccumulatedLosses(investments, month);

    // Calculate tax for the target month
    const result: TaxCalculationResult = calculateMonthTax(
      investments,
      month,
      accumulatedLosses
    );

    return NextResponse.json(result);
  }, request);
}
