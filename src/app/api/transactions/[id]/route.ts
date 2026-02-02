import { NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateTransactionCache } from "@/lib/api-utils";
import { updateTransactionSchema, validateBody } from "@/lib/schemas";
import { transactionService, TransactionError } from "@/services";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/transactions/[id]
 *
 * Get a single transaction by ID.
 */
export async function GET(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    try {
      const transaction = await transactionService.getTransaction(
        session.user.id,
        id
      );
      return NextResponse.json(transaction);
    } catch (error) {
      if (error instanceof TransactionError && error.code === "NOT_FOUND") {
        return errorResponse("Transação não encontrada", 404, "NOT_FOUND");
      }
      throw error;
    }
  });
}

/**
 * DELETE /api/transactions/[id]
 *
 * Delete a transaction by ID.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    try {
      await transactionService.deleteTransaction(session.user.id, id);

      // Invalidate related caches
      invalidateTransactionCache(session.user.id);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      if (error instanceof TransactionError && error.code === "NOT_FOUND") {
        return errorResponse("Transação não encontrada", 404, "NOT_FOUND");
      }
      throw error;
    }
  });
}

/**
 * PATCH /api/transactions/[id]
 *
 * Update a transaction by ID.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateTransactionSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { type, value, category, description, date } = validation.data;

    try {
      // Delegate to service (handles date parsing internally)
      const transaction = await transactionService.updateTransaction(
        session.user.id,
        id,
        {
          type,
          value,
          category,
          description: description !== undefined ? (description || null) : undefined,
          date,
        }
      );

      // Invalidate related caches
      invalidateTransactionCache(session.user.id);

      return NextResponse.json(transaction);
    } catch (error) {
      if (error instanceof TransactionError && error.code === "NOT_FOUND") {
        return errorResponse("Transação não encontrada", 404, "NOT_FOUND");
      }
      throw error;
    }
  }, request);
}
