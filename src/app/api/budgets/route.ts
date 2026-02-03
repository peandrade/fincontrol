import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateBudgetCache } from "@/lib/api-utils";
import { budgetRepository, transactionRepository, purchaseRepository } from "@/repositories";

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

      // Get budgets using repository (handles decryption)
      const budgets = await budgetRepository.getActiveBudgets(session.user.id, month, year);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);

      // Fetch expenses using repository (handles decryption)
      const expenses = await transactionRepository.findByUser(session.user.id, {
        type: "expense",
        startDate: startOfMonth,
        endDate: endOfMonth,
      });

      // Filter out "Fatura Cartão" category
      const filteredExpenses = expenses.filter(e => e.category !== "Fatura Cartão");

      // Fetch card purchases using repository (handles decryption)
      const cardPurchases = await purchaseRepository.getCategoryBreakdownByUser(
        session.user.id,
        startOfMonth,
        endOfMonth
      );

      const spentByCategory: Record<string, number> = {};

      // Aggregate expenses by category
      for (const expense of filteredExpenses) {
        const value = expense.value as unknown as number;
        spentByCategory[expense.category] = (spentByCategory[expense.category] || 0) + value;
      }

      // Aggregate purchases by category
      for (const purchase of cardPurchases) {
        spentByCategory[purchase.category] = (spentByCategory[purchase.category] || 0) + purchase.total;
      }

      const budgetsWithSpent: BudgetWithSpent[] = budgets.map((budget) => {
        const limit = budget.limit as unknown as number;
        const spent = spentByCategory[budget.category] || 0;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;
        const remaining = limit - spent;

        return {
          id: budget.id,
          category: budget.category,
          limit,
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

      // Check if budget already exists for this category/period
      const existing = await budgetRepository.findByCategoryAndPeriod(
        session.user.id,
        category,
        budgetMonth,
        budgetYear
      );

      let budget;
      if (existing) {
        // Update existing budget
        await budgetRepository.update(existing.id, session.user.id, { limit });
        budget = await budgetRepository.findById(existing.id, session.user.id);
      } else {
        // Create new budget
        budget = await budgetRepository.create({
          userId: session.user.id,
          category,
          limit,
          month: budgetMonth,
          year: budgetYear,
        });
      }

      // Invalidate related caches
      invalidateBudgetCache(session.user.id);

      return NextResponse.json(budget, { status: 201 });
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      return errorResponse("Erro ao criar orçamento", 500, "CREATE_BUDGET_ERROR");
    }
  }, request);
}
