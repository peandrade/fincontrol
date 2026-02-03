import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateWeeklyReportEmail, generateMonthlyReportEmail } from "@/lib/email-reports";
import { MONTH_NAMES } from "@/lib/constants";
import { transactionRepository, budgetRepository, goalRepository, investmentRepository, invoiceRepository, cardRepository } from "@/repositories";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    // Security: CRON_SECRET must be configured to use this endpoint
    if (!expectedSecret) {
      console.error("[Reports] CRON_SECRET not configured - endpoint disabled");
      return NextResponse.json(
        { error: "Endpoint não configurado" },
        { status: 503 }
      );
    }

    // Validate the authorization header
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body as { type: "weekly" | "monthly" };

    if (type !== "weekly" && type !== "monthly") {
      return NextResponse.json(
        { error: "Tipo inválido. Use 'weekly' ou 'monthly'." },
        { status: 400 }
      );
    }

    const preferenceField = type === "weekly" ? "weeklyReport" : "monthlyReport";

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        notificationSettings: true,
      },
    });

    const eligibleUsers = users.filter((user) => {
      const settings = user.notificationSettings as Record<string, unknown> | null;
      return settings?.[preferenceField] === true;
    });

    let sentCount = 0;

    for (const user of eligibleUsers) {
      try {
        const html = type === "weekly"
          ? await buildWeeklyReport(user.id, user.name)
          : await buildMonthlyReport(user.id, user.name);

        const subject = type === "weekly"
          ? "📊 Seu Resumo Semanal — FinControl"
          : "📊 Seu Resumo Mensal — FinControl";

        await sendEmail({ to: user.email, subject, html });
        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar relatório para ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      type,
      eligible: eligibleUsers.length,
      sent: sentCount,
    });
  } catch (error) {
    console.error("Erro ao processar envio de relatórios:", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar relatórios" },
      { status: 500 }
    );
  }
}

async function buildWeeklyReport(userId: string, userName: string | null): Promise<string> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Use repositories for proper decryption
  const [weekTransactions, allTransactions, budgets] = await Promise.all([
    transactionRepository.findByUser(userId, {
      startDate: weekStart,
      endDate: now,
    }),
    transactionRepository.findByUser(userId),
    budgetRepository.getActiveBudgets(userId, now.getMonth() + 1, now.getFullYear()),
  ]);

  const income = weekTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.value as unknown as number), 0);
  const expenses = weekTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.value as unknown as number), 0);

  const currentBalance = allTransactions.reduce(
    (acc, t) => (t.type === "income" ? acc + (t.value as unknown as number) : acc - (t.value as unknown as number)),
    0
  );

  const categoryTotals = new Map<string, number>();
  weekTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + (t.value as unknown as number));
    });
  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({
      name,
      total,
      percentage: expenses > 0 ? (total / expenses) * 100 : 0,
    }));

  // Use repository for month transactions
  const monthTransactions = await transactionRepository.findByUser(userId, {
    type: "expense",
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const monthCategorySpent = new Map<string, number>();
  monthTransactions.forEach((t) => {
    monthCategorySpent.set(t.category, (monthCategorySpent.get(t.category) || 0) + (t.value as unknown as number));
  });

  const budgetData = budgets.map((b) => {
    const limit = b.limit as unknown as number;
    return {
      category: b.category,
      spent: monthCategorySpent.get(b.category) || 0,
      limit: limit,
      percentage: limit > 0 ? ((monthCategorySpent.get(b.category) || 0) / limit) * 100 : 0,
    };
  });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return generateWeeklyReportEmail({
    userName: userName || undefined,
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(now),
    income,
    expenses,
    balance: income - expenses,
    currentBalance,
    topCategories,
    budgets: budgetData,
  });
}

async function buildMonthlyReport(userId: string, userName: string | null): Promise<string> {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const prevStart = new Date(currentYear, currentMonth - 1, 1);
  const prevEnd = new Date(currentYear, currentMonth, 0);

  // Use repositories for proper decryption
  const [
    monthTransactions,
    prevTransactions,
    allTransactions,
    budgets,
    goals,
    investments,
    unpaidInvoices,
    creditCards,
  ] = await Promise.all([
    transactionRepository.findByUser(userId, {
      startDate: startOfMonth,
      endDate: endOfMonth,
    }),
    transactionRepository.findByUser(userId, {
      startDate: prevStart,
      endDate: prevEnd,
    }),
    transactionRepository.findByUser(userId),
    budgetRepository.getActiveBudgets(userId, currentMonth + 1, currentYear),
    goalRepository.findByUser(userId),
    investmentRepository.findByUser(userId),
    invoiceRepository.getUnpaidByUser(userId),
    cardRepository.findByUser(userId, { isActive: true }),
  ]);

  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.value as unknown as number), 0);
  const expenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.value as unknown as number), 0);

  const previousIncome = prevTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.value as unknown as number), 0);
  const previousExpenses = prevTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.value as unknown as number), 0);

  const currentBalance = allTransactions.reduce(
    (acc, t) => (t.type === "income" ? acc + (t.value as unknown as number) : acc - (t.value as unknown as number)),
    0
  );

  const categoryTotalsMonthly = new Map<string, number>();
  monthTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotalsMonthly.set(t.category, (categoryTotalsMonthly.get(t.category) || 0) + (t.value as unknown as number));
    });
  const topCategories = [...categoryTotalsMonthly.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({
      name,
      total,
      percentage: expenses > 0 ? (total / expenses) * 100 : 0,
    }));

  const monthCategorySpentMonthly = new Map<string, number>();
  monthTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      monthCategorySpentMonthly.set(t.category, (monthCategorySpentMonthly.get(t.category) || 0) + (t.value as unknown as number));
    });

  const budgetData = budgets.map((b) => {
    const limit = b.limit as unknown as number;
    return {
      category: b.category,
      spent: monthCategorySpentMonthly.get(b.category) || 0,
      limit: limit,
      percentage: limit > 0 ? ((monthCategorySpentMonthly.get(b.category) || 0) / limit) * 100 : 0,
    };
  });

  const goalData = goals.map((g) => {
    const currentValue = g.currentValue as unknown as number;
    const targetValue = g.targetValue as unknown as number;
    return {
      name: g.name,
      current: currentValue,
      target: targetValue,
      percentage: targetValue > 0 ? (currentValue / targetValue) * 100 : 0,
    };
  });

  const totalInvested = investments.reduce((sum, i) => sum + (i.totalInvested as unknown as number), 0);
  const currentInvestmentValue = investments.reduce((sum, i) => sum + (i.currentValue as unknown as number), 0);
  const investmentProfitLoss = investments.reduce((sum, i) => sum + (i.profitLoss as unknown as number), 0);

  // Map credit card IDs to names
  const cardNameMap = new Map(creditCards.map(c => [c.id, c.name]));

  const cardInvoices = unpaidInvoices
    .filter((inv) => (inv.total as unknown as number) > (inv.paidAmount as unknown as number))
    .map((inv) => {
      const total = inv.total as unknown as number;
      const paidAmount = inv.paidAmount as unknown as number;
      return {
        cardName: cardNameMap.get(inv.creditCardId) || "Cartão",
        total: total - paidAmount,
        dueDate: new Date(inv.dueDate).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
      };
    });

  return generateMonthlyReportEmail({
    userName: userName || undefined,
    month: MONTH_NAMES[currentMonth],
    year: currentYear,
    income,
    expenses,
    balance: income - expenses,
    currentBalance,
    previousIncome,
    previousExpenses,
    topCategories,
    budgets: budgetData,
    goals: goalData,
    investments: {
      totalInvested,
      currentValue: currentInvestmentValue,
      profitLoss: investmentProfitLoss,
      profitLossPercent: totalInvested > 0 ? (investmentProfitLoss / totalInvested) * 100 : 0,
    },
    cardInvoices,
  });
}
