import { NextRequest, NextResponse } from "next/server";
import { withAuth, invalidateRecurringCache, invalidateTransactionCache } from "@/lib/api-utils";
import { z } from "zod";
import { validateBody } from "@/lib/schemas";
import { recurringRepository, transactionRepository } from "@/repositories";

const launchExpensesSchema = z.object({
  expenseIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(async (session, req) => {
    const body = await req.json().catch(() => ({}));

    const validation = validateBody(launchExpensesSchema, body);
    if (!validation.success) {
      // For backwards compatibility, allow empty body
    }

    const expenseIds = validation.success ? validation.data.expenseIds : undefined;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Use repository for proper decryption
    let expenses = await recurringRepository.findByUser(session.user.id, { activeOnly: true });

    // Filter by IDs if provided
    if (expenseIds && expenseIds.length > 0) {
      expenses = expenses.filter(e => expenseIds.includes(e.id));
    }

    // Filter out already launched this month
    expenses = expenses.filter((expense) => {
      if (!expense.lastLaunchedAt) return true;
      const lastLaunched = new Date(expense.lastLaunchedAt);
      return !(
        lastLaunched.getMonth() === currentMonth &&
        lastLaunched.getFullYear() === currentYear
      );
    });

    if (expenses.length === 0) {
      return NextResponse.json({
        launched: 0,
        message: "Nenhuma despesa pendente para lançar",
      });
    }

    const transactions = [];
    const updatedExpenses = [];

    for (const expense of expenses) {
      const dueDay = Math.min(expense.dueDay, new Date(currentYear, currentMonth + 1, 0).getDate());
      const transactionDate = new Date(currentYear, currentMonth, dueDay, 12, 0, 0);

      // Use repository to create transaction with encryption
      const transaction = await transactionRepository.create({
        type: "expense",
        value: expense.value as unknown as number,
        category: expense.category,
        description: expense.description as unknown as string,
        date: transactionDate,
        userId: session.user.id,
      });
      transactions.push(transaction);

      // Update recurring expense using repository
      await recurringRepository.markAsLaunched(expense.id, session.user.id);
      updatedExpenses.push(expense);
    }

    // Invalidate related caches
    invalidateRecurringCache(session.user.id);
    invalidateTransactionCache(session.user.id);

    return NextResponse.json({
      launched: transactions.length,
      transactions,
      message: `${transactions.length} despesa(s) lançada(s) com sucesso`,
    });
  }, request);
}
