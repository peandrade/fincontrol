import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface BillEvent {
  id: string;
  type: "recurring" | "invoice";
  description: string;
  value: number;
  category: string;
  dueDate: string;
  day: number;
  isPaid: boolean;
  isPastDue: boolean;
  cardName?: string;
  cardColor?: string;
}

export interface DayBills {
  day: number;
  date: string;
  bills: BillEvent[];
  total: number;
  isToday: boolean;
  isPast: boolean;
}

export interface CashFlowProjection {
  month: string;
  monthLabel: string;
  expectedIncome: number;
  expectedExpenses: number;
  recurringExpenses: number;
  cardInvoices: number;
  netFlow: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const todayDate = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();

    // Accept month/year query params for navigation
    const searchParams = request.nextUrl.searchParams;
    const reqMonth = parseInt(searchParams.get("month") || String(todayMonth + 1));
    const reqYear = parseInt(searchParams.get("year") || String(todayYear));

    // Target date for the requested month
    const targetDate = new Date(reqYear, reqMonth - 1, 1);
    const targetMonth = targetDate.getMonth(); // 0-based
    const targetYear = targetDate.getFullYear();

    const isCurrentMonth = targetMonth === todayMonth && targetYear === todayYear;

    const endDate = endOfMonth(targetDate);

    // Get recurring expenses
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Get credit cards with invoices for the target month and surrounding months
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        invoices: {
          where: {
            OR: [
              { status: "open" },
              { status: "closed" },
              {
                month: reqMonth,
                year: reqYear,
              },
            ],
          },
        },
      },
    });

    // Build bill events for the requested month
    const billEvents: BillEvent[] = [];

    // Add recurring expenses
    for (const expense of recurringExpenses) {
      const lastLaunched = expense.lastLaunchedAt
        ? new Date(expense.lastLaunchedAt)
        : null;
      const isLaunchedThisMonth = lastLaunched
        ? lastLaunched.getMonth() === targetMonth &&
          lastLaunched.getFullYear() === targetYear
        : false;

      // Past due only makes sense for the current month
      const isPastDue = isCurrentMonth
        ? todayDate > expense.dueDay && !isLaunchedThisMonth
        : false;

      // For future months, nothing is paid yet
      const isPaid = isCurrentMonth ? isLaunchedThisMonth : false;

      billEvents.push({
        id: expense.id,
        type: "recurring",
        description: expense.description,
        value: expense.value,
        category: expense.category,
        dueDate: new Date(targetYear, targetMonth, expense.dueDay).toISOString(),
        day: expense.dueDay,
        isPaid,
        isPastDue,
      });
    }

    // Add credit card invoices
    for (const card of creditCards) {
      const invoice = card.invoices.find(
        (inv) => inv.month === reqMonth && inv.year === reqYear
      );

      if (invoice && invoice.total > 0) {
        const isPaid = invoice.status === "paid" || invoice.paidAmount >= invoice.total;
        const isPastDue = isCurrentMonth
          ? todayDate > card.dueDay && !isPaid
          : false;

        billEvents.push({
          id: invoice.id,
          type: "invoice",
          description: `Fatura ${card.name}`,
          value: invoice.total - invoice.paidAmount,
          category: "Fatura Cartão",
          dueDate: invoice.dueDate.toISOString(),
          day: card.dueDay,
          isPaid,
          isPastDue,
          cardName: card.name,
          cardColor: card.color,
        });
      } else if (!invoice) {
        // For future months without an invoice yet, show with estimated value 0
        // but still mark the due day on the calendar
        billEvents.push({
          id: `${card.id}-${reqMonth}-${reqYear}`,
          type: "invoice",
          description: `Fatura ${card.name}`,
          value: 0,
          category: "Fatura Cartão",
          dueDate: new Date(targetYear, targetMonth, card.dueDay).toISOString(),
          day: card.dueDay,
          isPaid: false,
          isPastDue: false,
          cardName: card.name,
          cardColor: card.color,
        });
      }
    }

    // Group bills by day
    const daysInMonth = endDate.getDate();
    const calendar: DayBills[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBills = billEvents.filter((bill) => bill.day === day);
      const dayDate = new Date(targetYear, targetMonth, day);

      calendar.push({
        day,
        date: dayDate.toISOString(),
        bills: dayBills,
        total: dayBills.reduce((sum, bill) => sum + bill.value, 0),
        isToday: isCurrentMonth && day === todayDate,
        isPast: isCurrentMonth ? day < todayDate : targetDate < now,
      });
    }

    // Calculate cash flow projection for next 3 months (from current date)
    const cashFlowProjection: CashFlowProjection[] = [];

    const threeMonthsAgo = addMonths(now, -3);
    const incomeTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "income",
        date: { gte: threeMonthsAgo, lte: now },
      },
    });
    const avgIncome = incomeTransactions.length > 0
      ? incomeTransactions.reduce((sum, t) => sum + t.value, 0) / 3
      : 0;

    const expenseTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        category: { not: "Fatura Cartão" },
        date: { gte: threeMonthsAgo, lte: now },
      },
    });
    const avgExpenses = expenseTransactions.length > 0
      ? expenseTransactions.reduce((sum, t) => sum + t.value, 0) / 3
      : 0;

    const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.value, 0);

    for (let i = 0; i < 3; i++) {
      const projectionDate = addMonths(now, i);
      const projectionMonth = projectionDate.getMonth() + 1;
      const projectionYear = projectionDate.getFullYear();

      let cardTotal = 0;
      for (const card of creditCards) {
        const inv = card.invoices.find(
          (inv) => inv.month === projectionMonth && inv.year === projectionYear
        );
        if (inv) {
          cardTotal += inv.total - inv.paidAmount;
        }
      }

      const expectedExpenses = avgExpenses + totalRecurring + cardTotal;

      cashFlowProjection.push({
        month: format(projectionDate, "yyyy-MM"),
        monthLabel: format(projectionDate, "MMM yyyy", { locale: ptBR }),
        expectedIncome: avgIncome,
        expectedExpenses,
        recurringExpenses: totalRecurring,
        cardInvoices: cardTotal,
        netFlow: avgIncome - expectedExpenses,
      });
    }

    // Calculate summary
    const totalPendingBills = billEvents.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.value, 0);
    const totalPaidBills = billEvents.filter((b) => b.isPaid).reduce((sum, b) => sum + b.value, 0);
    const overdueBills = billEvents.filter((b) => b.isPastDue);

    // Upcoming: not paid, not overdue, and (future day in current month OR future month)
    const upcomingBills = isCurrentMonth
      ? billEvents.filter((b) => !b.isPaid && !b.isPastDue && b.day >= todayDate)
      : billEvents.filter((b) => !b.isPaid);

    // Invoice summary: total of all card invoices for the month
    const invoiceBills = billEvents.filter((b) => b.type === "invoice");
    const totalInvoices = invoiceBills.reduce((sum, b) => sum + b.value, 0);

    return NextResponse.json({
      calendar,
      bills: billEvents,
      cashFlowProjection,
      summary: {
        totalBills: billEvents.length,
        totalValue: billEvents.reduce((sum, b) => sum + b.value, 0),
        totalPending: totalPendingBills,
        totalPaid: totalPaidBills,
        overdueCount: overdueBills.length,
        overdueValue: overdueBills.reduce((sum, b) => sum + b.value, 0),
        upcomingCount: upcomingBills.length,
        upcomingValue: upcomingBills.reduce((sum, b) => sum + b.value, 0),
        totalInvoices,
        invoiceCount: invoiceBills.length,
        nextDue: upcomingBills.length > 0
          ? upcomingBills.sort((a, b) => a.day - b.day)[0]
          : null,
      },
      currentMonth: reqMonth,
      currentYear: reqYear,
    });
  } catch (error) {
    console.error("Erro ao buscar calendário de contas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar calendário de contas" },
      { status: 500 }
    );
  }
}
