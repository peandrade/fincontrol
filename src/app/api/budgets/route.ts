import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateBudgetCache } from "@/lib/api-utils";

export interface BudgetWithSpent {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
  spent: number;
  percentage: number;
  remaining: number;
}

export async function GET(request: NextRequest) {
  return withAuth(async (session, req) => {
    try {
      const searchParams = (req as NextRequest).nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { month: 0, year: 0 },
          { month, year },
        ],
      },
      orderBy: { category: "asc" },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId: session.user.id,
        type: "expense",
        category: {
          not: "Fatura Cartão",
        },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        value: true,
      },
    });

    const cardPurchases = await prisma.purchase.groupBy({
      by: ["category"],
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        invoice: {
          creditCard: {
            userId: session.user.id,
          },
        },
      },
      _sum: {
        value: true,
      },
    });

    const spentByCategory: Record<string, number> = {};

    for (const expense of expenses) {
      spentByCategory[expense.category] = (spentByCategory[expense.category] || 0) + (expense._sum.value || 0);
    }

    for (const purchase of cardPurchases) {
      spentByCategory[purchase.category] = (spentByCategory[purchase.category] || 0) + (purchase._sum.value || 0);
    }

    const budgetsWithSpent: BudgetWithSpent[] = budgets.map((budget) => {
      const spent = spentByCategory[budget.category] || 0;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      const remaining = budget.limit - spent;

      return {
        id: budget.id,
        category: budget.category,
        limit: budget.limit,
        month: budget.month,
        year: budget.year,
        spent,
        percentage,
        remaining,
      };
    });

    const totalLimit = budgetsWithSpent.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);

    return NextResponse.json({
      budgets: budgetsWithSpent,
      summary: {
        totalLimit,
        totalSpent,
        totalRemaining: totalLimit - totalSpent,
        totalPercentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
      },
      month,
      year,
    }, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      return errorResponse("Erro ao buscar orçamentos", 500, "BUDGETS_ERROR");
    }
  }, request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (session, req) => {
    try {
      const body = await req.json();
    const { category, limit, month, year, isFixed } = body;

    if (!category || limit === undefined) {
      return NextResponse.json(
        { error: "Categoria e limite são obrigatórios" },
        { status: 400 }
      );
    }

    const budgetMonth = isFixed ? 0 : (month || new Date().getMonth() + 1);
    const budgetYear = isFixed ? 0 : (year || new Date().getFullYear());

    const budget = await prisma.budget.upsert({
      where: {
        category_month_year_userId: {
          category,
          month: budgetMonth,
          year: budgetYear,
          userId: session.user.id,
        },
      },
      update: {
        limit,
      },
      create: {
        category,
        limit,
        month: budgetMonth,
        year: budgetYear,
        userId: session.user.id,
      },
    });

      // Invalidate related caches
      invalidateBudgetCache(session.user.id);

      return NextResponse.json(budget, { status: 201 });
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      return errorResponse("Erro ao criar orçamento", 500, "CREATE_BUDGET_ERROR");
    }
  }, request);
}
