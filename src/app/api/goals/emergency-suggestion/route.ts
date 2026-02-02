import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";

export async function GET() {
  return withAuth(async (session) => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "expense",
        date: {
          gte: sixMonthsAgo,
        },
      },
    });

    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
        },
        invoice: {
          creditCard: {
            userId: session.user.id,
          },
        },
      },
    });

    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.value, 0);
    const totalRecurring = recurringExpenses.reduce((sum, r) => sum + r.value, 0);

    const monthsWithData = Math.max(
      Math.min(
        (now.getFullYear() - sixMonthsAgo.getFullYear()) * 12 +
          (now.getMonth() - sixMonthsAgo.getMonth()) + 1,
        6
      ),
      1
    );

    const averageMonthlyExpenses = (totalExpenses + totalPurchases) / monthsWithData;

    const estimatedMonthlyExpenses = Math.max(averageMonthlyExpenses, totalRecurring);

    const emergencyFundTarget = estimatedMonthlyExpenses * 6;

    const existingEmergencyGoal = await prisma.financialGoal.findFirst({
      where: {
        userId: session.user.id,
        category: "emergency",
      },
    });

    return NextResponse.json({
      averageMonthlyExpenses: Math.round(averageMonthlyExpenses * 100) / 100,
      recurringExpenses: totalRecurring,
      estimatedMonthlyExpenses: Math.round(estimatedMonthlyExpenses * 100) / 100,
      suggestedTarget: Math.round(emergencyFundTarget * 100) / 100,
      monthsAnalyzed: monthsWithData,
      existingGoal: existingEmergencyGoal
        ? {
            id: existingEmergencyGoal.id,
            currentValue: existingEmergencyGoal.currentValue,
            targetValue: existingEmergencyGoal.targetValue,
          }
        : null,
      breakdown: {
        transactionExpenses: Math.round(totalExpenses * 100) / 100,
        cardPurchases: Math.round(totalPurchases * 100) / 100,
        recurringMonthly: totalRecurring,
      },
    });
  });
}
