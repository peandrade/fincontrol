import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateGoalCache, invalidateTransactionCache } from "@/lib/api-utils";
import { createGoalContributionSchema, validateBody } from "@/lib/schemas";
import { z } from "zod";
import { goalRepository } from "@/repositories";
import { transactionService } from "@/services";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const deleteContributionSchema = z.object({
  contributionId: z.string().min(1, "ID da contribuição é obrigatório"),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    const operationType = body.operationType || "deposit";
    const isWithdraw = operationType === "withdraw";

    // For withdrawals, we receive negative value from frontend, convert to positive for validation
    const absoluteValue = Math.abs(body.value || 0);

    // Override goalId with the one from params
    const validation = validateBody(createGoalContributionSchema, {
      ...body,
      goalId: id,
      value: absoluteValue,
    });
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    // Verify goal exists and belongs to user
    const goal = await goalRepository.findById(id, session.user.id);

    if (!goal) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    const { value, date, notes } = validation.data;
    const contributionDate = date ? new Date(date) : new Date();

    // For withdrawals, check if there's enough balance
    const currentGoalValue = (goal.currentValue as unknown as number) || 0;
    if (isWithdraw && value > currentGoalValue) {
      return errorResponse("Saldo insuficiente na meta", 400, "INSUFFICIENT_BALANCE");
    }

    // Add or subtract contribution using repository (handles encryption)
    // For withdrawals, we pass negative value
    const contributionValue = isWithdraw ? -value : value;
    const contribution = await goalRepository.addContribution(id, session.user.id, {
      value: contributionValue,
      date: contributionDate,
      notes: notes || undefined,
    });

    // Create automatic transaction
    // Deposit = expense (money leaving main balance to goal)
    // Withdraw = income (money returning from goal to main balance)
    const transactionType = isWithdraw ? "income" : "expense";
    const transactionDescription = isWithdraw
      ? `Resgate da meta: ${goal.name}${notes ? ` - ${notes}` : ""}`
      : `Aporte na meta: ${goal.name}${notes ? ` - ${notes}` : ""}`;

    await transactionService.createTransaction(session.user.id, {
      type: transactionType,
      value: value, // Always positive
      category: "savings", // Use savings category
      description: transactionDescription,
      date: contributionDate,
    });

    // Get updated goal values
    const updatedGoal = await goalRepository.findById(id, session.user.id);
    const newCurrentValue = (updatedGoal?.currentValue as unknown as number) || 0;
    const isCompleted = updatedGoal?.isCompleted || false;

    // Invalidate related caches
    invalidateGoalCache(session.user.id);
    invalidateTransactionCache(session.user.id);

    return NextResponse.json({
      contribution,
      newCurrentValue,
      isCompleted,
      transactionCreated: true,
    });
  }, request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    const validation = validateBody(deleteContributionSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { contributionId } = validation.data;

    // Verify goal exists and belongs to user
    const goal = await goalRepository.findById(id, session.user.id);

    if (!goal) {
      return errorResponse("Meta não encontrada", 404, "NOT_FOUND");
    }

    try {
      // Delete contribution using repository (handles encryption and goal update)
      await goalRepository.deleteContribution(contributionId, session.user.id);

      // Invalidate related caches
      invalidateGoalCache(session.user.id);

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "Contribution not found") {
        return errorResponse("Contribuição não encontrada", 404, "NOT_FOUND");
      }
      throw error;
    }
  }, request);
}
