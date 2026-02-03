import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { transactionRepository, purchaseRepository, recurringRepository, goalRepository } from "@/repositories";

export async function GET() {
  return withAuth(async (session) => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Fetch data using repositories (handles decryption)
    const [expenses, purchases, recurringExpenses] = await Promise.all([
      transactionRepository.findByUser(session.user.id, {
        type: "expense",
        startDate: sixMonthsAgo,
      }),
      purchaseRepository.findByUser(session.user.id, {
        startDate: sixMonthsAgo,
      }),
      recurringRepository.findByUser(session.user.id, {
        activeOnly: true,
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.value as unknown as number), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + (p.value as unknown as number), 0);
    const totalRecurring = recurringExpenses.reduce((sum, r) => sum + (r.value as unknown as number), 0);

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

    // Check existing emergency goal using repository (handles decryption)
    const existingEmergencyGoal = await goalRepository.findEmergencyGoal(session.user.id);

    return NextResponse.json({
      averageMonthlyExpenses: Math.round(averageMonthlyExpenses * 100) / 100,
      recurringExpenses: totalRecurring,
      estimatedMonthlyExpenses: Math.round(estimatedMonthlyExpenses * 100) / 100,
      suggestedTarget: Math.round(emergencyFundTarget * 100) / 100,
      monthsAnalyzed: monthsWithData,
      existingGoal: existingEmergencyGoal
        ? {
            id: existingEmergencyGoal.id,
            currentValue: existingEmergencyGoal.currentValue as unknown as number,
            targetValue: existingEmergencyGoal.targetValue as unknown as number,
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
