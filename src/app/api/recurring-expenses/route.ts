import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateRecurringCache } from "@/lib/api-utils";
import { createRecurringExpenseSchema, validateBody } from "@/lib/schemas";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";

export interface RecurringExpenseWithStatus {
  id: string;
  description: string;
  value: number;
  category: string;
  dueDay: number;
  isActive: boolean;
  lastLaunchedAt: string | null;
  notes: string | null;

  isLaunchedThisMonth: boolean;
  dueDate: string;
  isPastDue: boolean;
}

export async function GET() {
  return withAuth(async (session) => {
    const expenses = await prisma.recurringExpense.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isActive: "desc" },
        { dueDay: "asc" },
      ],
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    const expensesWithStatus: RecurringExpenseWithStatus[] = expenses.map((expense) => {

      const lastLaunched = expense.lastLaunchedAt
        ? new Date(expense.lastLaunchedAt)
        : null;
      const isLaunchedThisMonth = lastLaunched
        ? lastLaunched.getMonth() === currentMonth &&
          lastLaunched.getFullYear() === currentYear
        : false;

      const dueDate = new Date(currentYear, currentMonth, expense.dueDay);
      const isPastDue = today > expense.dueDay && !isLaunchedThisMonth;

      return {
        id: expense.id,
        description: expense.description,
        value: expense.value,
        category: expense.category,
        dueDay: expense.dueDay,
        isActive: expense.isActive,
        lastLaunchedAt: expense.lastLaunchedAt?.toISOString() || null,
        notes: expense.notes,
        isLaunchedThisMonth,
        dueDate: dueDate.toISOString(),
        isPastDue,
      };
    });

    const activeExpenses = expensesWithStatus.filter((e) => e.isActive);
    const totalMonthly = activeExpenses.reduce((sum, e) => sum + e.value, 0);
    const totalLaunched = activeExpenses
      .filter((e) => e.isLaunchedThisMonth)
      .reduce((sum, e) => sum + e.value, 0);
    const totalPending = activeExpenses
      .filter((e) => !e.isLaunchedThisMonth)
      .reduce((sum, e) => sum + e.value, 0);
    const pendingCount = activeExpenses.filter((e) => !e.isLaunchedThisMonth).length;

    return NextResponse.json({
      expenses: expensesWithStatus,
      summary: {
        totalMonthly,
        totalLaunched,
        totalPending,
        launchedCount: activeExpenses.length - pendingCount,
        pendingCount,
        totalCount: activeExpenses.length,
      },
      currentMonth: currentMonth + 1,
      currentYear,
    }, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  });
}

export async function POST(request: NextRequest) {
  // Rate limit: 30 mutations per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.mutation,
    identifier: "recurring-expenses-create",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async (session, req) => {
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createRecurringExpenseSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { name, value, category, dueDay, description } = validation.data;

    const expense = await prisma.recurringExpense.create({
      data: {
        description: name,
        value,
        category,
        dueDay,
        notes: description || null,
        isActive: true,
        userId: session.user.id,
      },
    });

    // Invalidate related caches
    invalidateRecurringCache(session.user.id);

    return NextResponse.json(expense, { status: 201 });
  }, request);
}
