import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateInvestmentCache, invalidateTransactionCache } from "@/lib/api-utils";
import { getAvailableBalance } from "@/lib/transaction-aggregations";
import {
  investmentOperationService,
  InvestmentOperationError,
} from "@/services";
import type { CreateOperationInput } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/investments/[id]/operations
 *
 * Add a new operation (buy, sell, dividend) to an investment.
 * Creates corresponding transaction records (expense/income).
 * Recalculates fixed income yield if applicable.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id: investmentId } = await params;
    const body: Omit<CreateOperationInput, "investmentId"> = await req.json();

    // Basic validation
    if (!body.type || !body.date) {
      return errorResponse("Tipo e data são obrigatórios", 400, "VALIDATION_ERROR");
    }

    try {
      // Get available balance for buy operations (unless skipping check)
      let availableBalance: number | undefined;
      if (body.type === "buy" && !body.skipBalanceCheck) {
        availableBalance = await getAvailableBalance(session.user.id);
      }

      // Delegate to service
      const result = await investmentOperationService.addOperation(
        session.user.id,
        investmentId,
        { ...body, investmentId } as CreateOperationInput,
        {
          availableBalance,
          skipBalanceCheck: body.skipBalanceCheck,
        }
      );

      // Invalidate related caches
      invalidateInvestmentCache(session.user.id);
      // Operations create transactions, so invalidate transaction cache too
      invalidateTransactionCache(session.user.id);

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      // Handle service errors
      if (error instanceof InvestmentOperationError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          FORBIDDEN: 403,
          VALIDATION_ERROR: 400,
          INSUFFICIENT_BALANCE: 400,
          INSUFFICIENT_QUANTITY: 400,
          INVALID_DATE: 400,
          INVALID_OPERATION: 400,
        };

        const status = statusMap[error.code] || 400;

        // Include details for INSUFFICIENT_BALANCE to maintain API compatibility
        if (error.code === "INSUFFICIENT_BALANCE" && error.details) {
          return NextResponse.json(
            {
              error: error.message,
              code: error.code,
              ...error.details,
            },
            { status }
          );
        }

        return errorResponse(error.message, status, error.code);
      }

      // Re-throw unexpected errors
      throw error;
    }
  }, request);
}
