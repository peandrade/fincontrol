import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";
import { budgetRepository, transactionRepository, purchaseRepository } from "@/repositories";

export interface BudgetAlert {
  id: string;
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  remaining: number;
  alertLevel: "warning" | "danger" | "exceeded";
  message: string;
}

export async function GET() {
  return withAuth(async (session) => {
    const userId = session.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get user preferences for threshold
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });
    const notifSettings = user?.notificationSettings as Record<string, unknown> | null;
    const budgetThreshold = typeof notifSettings?.budgetThreshold === "number"
      ? notifSettings.budgetThreshold
      : 80;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Get budgets using repository (handles decryption)
    const budgets = await budgetRepository.getActiveBudgets(userId, month, year);

    if (budgets.length === 0) {
      return NextResponse.json({
        alerts: [],
        summary: {
          totalAlerts: 0,
          warningCount: 0,
          dangerCount: 0,
          exceededCount: 0,
        },
      });
    }

    // Get expenses using repository (handles decryption)
    const expenses = await transactionRepository.findByUser(userId, {
      type: "expense",
      startDate: startOfMonth,
      endDate: endOfMonth,
    });

    // Filter out "Fatura Cartão" category
    const filteredExpenses = expenses.filter(e => e.category !== "Fatura Cartão");

    // Get card purchases by category using repository (handles decryption)
    const cardPurchases = await purchaseRepository.getCategoryBreakdownByUser(
      userId,
      startOfMonth,
      endOfMonth
    );

    // Combine expenses
    const spentByCategory: Record<string, number> = {};

    for (const expense of filteredExpenses) {
      const value = expense.value as unknown as number;
      spentByCategory[expense.category] = (spentByCategory[expense.category] || 0) + value;
    }

    for (const purchase of cardPurchases) {
      spentByCategory[purchase.category] = (spentByCategory[purchase.category] || 0) + purchase.total;
    }

    // Generate alerts
    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const limit = budget.limit as unknown as number;
      const spent = spentByCategory[budget.category] || 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      const remaining = limit - spent;

      let alertLevel: "warning" | "danger" | "exceeded" | null = null;
      let message = "";

      const dangerThreshold = budgetThreshold + (100 - budgetThreshold) / 2;

      if (percentage >= 100) {
        alertLevel = "exceeded";
        message = `Orçamento excedido em ${Math.round(percentage - 100)}%`;
      } else if (percentage >= dangerThreshold) {
        alertLevel = "danger";
        message = `Atenção! ${Math.round(100 - percentage)}% restante`;
      } else if (percentage >= budgetThreshold) {
        alertLevel = "warning";
        message = `${Math.round(100 - percentage)}% restante do orçamento`;
      }

      if (alertLevel) {
        alerts.push({
          id: budget.id,
          category: budget.category,
          limit,
          spent,
          percentage,
          remaining,
          alertLevel,
          message,
        });
      }
    }

    // Sort by severity and percentage
    alerts.sort((a, b) => {
      const severityOrder = { exceeded: 0, danger: 1, warning: 2 };
      if (severityOrder[a.alertLevel] !== severityOrder[b.alertLevel]) {
        return severityOrder[a.alertLevel] - severityOrder[b.alertLevel];
      }
      return b.percentage - a.percentage;
    });

    const summary = {
      totalAlerts: alerts.length,
      warningCount: alerts.filter((a) => a.alertLevel === "warning").length,
      dangerCount: alerts.filter((a) => a.alertLevel === "danger").length,
      exceededCount: alerts.filter((a) => a.alertLevel === "exceeded").length,
    };

    return NextResponse.json({ alerts, summary });
  });
}
