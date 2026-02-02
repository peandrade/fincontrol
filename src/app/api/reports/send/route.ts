import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateWeeklyReportEmail, generateMonthlyReportEmail } from "@/lib/email-reports";
import { MONTH_NAMES } from "@/lib/constants";

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

  const [weekTransactions, allTransactions, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: weekStart, lte: now },
      },
      select: { type: true, value: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: { type: true, value: true },
    }),
    prisma.budget.findMany({
      where: {
        userId,
        OR: [
          { month: now.getMonth() + 1, year: now.getFullYear() },
          { month: 0, year: 0 },
        ],
      },
    }),
  ]);

  const income = weekTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);
  const expenses = weekTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const currentBalance = allTransactions.reduce(
    (acc, t) => (t.type === "income" ? acc + t.value : acc - t.value),
    0
  );

  const categoryTotals = new Map<string, number>();
  weekTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + t.value);
    });
  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({
      name,
      total,
      percentage: expenses > 0 ? (total / expenses) * 100 : 0,
    }));

  const monthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
      type: "expense",
    },
    select: { value: true, category: true },
  });

  const monthCategorySpent = new Map<string, number>();
  monthTransactions.forEach((t) => {
    monthCategorySpent.set(t.category, (monthCategorySpent.get(t.category) || 0) + t.value);
  });

  const budgetData = budgets.map((b) => ({
    category: b.category,
    spent: monthCategorySpent.get(b.category) || 0,
    limit: b.limit,
    percentage: b.limit > 0 ? ((monthCategorySpent.get(b.category) || 0) / b.limit) * 100 : 0,
  }));

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

  const [
    monthTransactions,
    prevTransactions,
    allTransactions,
    budgets,
    goals,
    investments,
    creditCards,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      select: { type: true, value: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: prevStart, lte: prevEnd } },
      select: { type: true, value: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: { type: true, value: true },
    }),
    prisma.budget.findMany({
      where: {
        userId,
        OR: [
          { month: currentMonth + 1, year: currentYear },
          { month: 0, year: 0 },
        ],
      },
    }),
    prisma.financialGoal.findMany({
      where: { userId },
      select: { name: true, currentValue: true, targetValue: true, isCompleted: true },
    }),
    prisma.investment.findMany({
      where: { userId },
      select: { totalInvested: true, currentValue: true, profitLoss: true },
    }),
    prisma.creditCard.findMany({
      where: { userId, isActive: true },
      include: {
        invoices: {
          where: {
            status: { in: ["open", "closed"] },
          },
        },
      },
    }),
  ]);

  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);
  const expenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const previousIncome = prevTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);
  const previousExpenses = prevTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const currentBalance = allTransactions.reduce(
    (acc, t) => (t.type === "income" ? acc + t.value : acc - t.value),
    0
  );

  const categoryTotals = new Map<string, number>();
  monthTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + t.value);
    });
  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({
      name,
      total,
      percentage: expenses > 0 ? (total / expenses) * 100 : 0,
    }));

  const monthCategorySpent = new Map<string, number>();
  monthTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      monthCategorySpent.set(t.category, (monthCategorySpent.get(t.category) || 0) + t.value);
    });

  const budgetData = budgets.map((b) => ({
    category: b.category,
    spent: monthCategorySpent.get(b.category) || 0,
    limit: b.limit,
    percentage: b.limit > 0 ? ((monthCategorySpent.get(b.category) || 0) / b.limit) * 100 : 0,
  }));

  const goalData = goals.map((g) => ({
    name: g.name,
    current: g.currentValue,
    target: g.targetValue,
    percentage: g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0,
  }));

  const totalInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
  const currentInvestmentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const investmentProfitLoss = investments.reduce((sum, i) => sum + i.profitLoss, 0);

  const cardInvoices = creditCards.flatMap((card) =>
    card.invoices
      .filter((inv) => inv.total > inv.paidAmount)
      .map((inv) => ({
        cardName: card.name,
        total: inv.total - inv.paidAmount,
        dueDate: new Date(inv.dueDate).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
      }))
  );

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
