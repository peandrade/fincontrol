import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { startOfMonth, endOfMonth, subMonths, addMonths, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Prisma } from "@prisma/client";
import { toNumber } from "@/lib/decimal-utils";

interface CardSpendingByCategory {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

interface CardMonthlySpending {
  month: string;
  monthLabel: string;
  total: number;
  cardBreakdown: {
    cardId: string;
    cardName: string;
    cardColor: string;
    total: number;
  }[];
}

interface CardAlert {
  type: "payment_due" | "high_usage" | "closing_soon";
  cardId: string;
  cardName: string;
  cardColor: string;
  message: string;
  value?: number;
  daysUntil?: number;
}

interface CategoryAggregate {
  category: string;
  total: Prisma.Decimal;
  count: bigint;
}

interface MonthlyCardAggregate {
  card_id: string;
  card_name: string;
  card_color: string;
  month: Date;
  total: Prisma.Decimal;
}

interface InvoiceForFuture {
  creditCardId: string;
  month: number;
  year: number;
  total: number;
}

interface CurrentMonthInvoice {
  creditCardId: string;
  status: string;
  total: number;
  paidAmount: number;
  dueDate: Date;
}

export async function GET() {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const sixMonthsAgo = subMonths(now, 6);
    const twoMonthsAgo = startOfMonth(subMonths(now, 2));

    // All queries in parallel
    const [
      creditCards,
      categorySpending,
      monthlyCardSpending,
      futureInvoices,
      unpaidInvoicesForUsage,
      currentMonthInvoices,
    ] = await Promise.all([
      // Basic card info (without nested data)
      prisma.creditCard.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          color: true,
          limit: true,
          closingDay: true,
          dueDay: true,
        },
      }),

      // Category spending - aggregated with JOINs
      prisma.$queryRaw<CategoryAggregate[]>`
        SELECT
          p.category,
          SUM(p.value) as total,
          COUNT(*) as count
        FROM purchases p
        JOIN invoices i ON p."invoiceId" = i.id
        JOIN credit_cards c ON i."creditCardId" = c.id
        WHERE c."userId" = ${userId}
          AND c."isActive" = true
          AND p.date >= ${sixMonthsAgo}
        GROUP BY p.category
        ORDER BY total DESC
      `,

      // Monthly spending by card (past 2 months + current)
      prisma.$queryRaw<MonthlyCardAggregate[]>`
        SELECT
          c.id as card_id,
          c.name as card_name,
          c.color as card_color,
          DATE_TRUNC('month', p.date) as month,
          SUM(p.value) as total
        FROM purchases p
        JOIN invoices i ON p."invoiceId" = i.id
        JOIN credit_cards c ON i."creditCardId" = c.id
        WHERE c."userId" = ${userId}
          AND c."isActive" = true
          AND p.date >= ${twoMonthsAgo}
        GROUP BY c.id, c.name, c.color, DATE_TRUNC('month', p.date)
        ORDER BY month, c.name
      `,

      // Future invoices (next 3 months)
      prisma.invoice.findMany({
        where: {
          creditCard: { userId, isActive: true },
          OR: [
            { year: currentYear, month: { gt: currentMonth } },
            { year: { gt: currentYear } },
          ],
        },
        select: {
          creditCardId: true,
          month: true,
          year: true,
          total: true,
        },
        take: 50,
      }),

      // Unpaid invoices for usage calculation
      prisma.invoice.findMany({
        where: {
          creditCard: { userId, isActive: true },
          status: { not: "paid" },
        },
        select: {
          creditCardId: true,
          total: true,
          paidAmount: true,
        },
      }),

      // Current month invoices for alerts
      prisma.invoice.findMany({
        where: {
          creditCard: { userId, isActive: true },
          month: currentMonth,
          year: currentYear,
        },
        select: {
          creditCardId: true,
          status: true,
          total: true,
          paidAmount: true,
          dueDate: true,
        },
      }),
    ]);

    // Create card lookup map
    const cardMap = new Map(creditCards.map((c) => [c.id, c]));

    // === SPENDING BY CATEGORY ===
    const totalSpending = categorySpending.reduce((sum, cat) => sum + toNumber(cat.total), 0);

    const spendingByCategory: CardSpendingByCategory[] = categorySpending.map((row) => ({
      category: row.category,
      total: toNumber(row.total),
      percentage: totalSpending > 0 ? (toNumber(row.total) / totalSpending) * 100 : 0,
      transactionCount: toNumber(row.count),
    }));

    // === MONTHLY SPENDING ===
    // Index monthly spending by card and month
    const monthlyIndex: Record<string, Record<string, number>> = {};
    for (const row of monthlyCardSpending) {
      const monthKey = format(new Date(row.month), "yyyy-MM");
      if (!monthlyIndex[monthKey]) {
        monthlyIndex[monthKey] = {};
      }
      monthlyIndex[monthKey][row.card_id] = toNumber(row.total);
    }

    // Index future invoices
    const futureInvoiceIndex: Record<string, Record<string, number>> = {};
    for (const inv of futureInvoices as InvoiceForFuture[]) {
      const monthKey = `${inv.year}-${String(inv.month).padStart(2, "0")}`;
      if (!futureInvoiceIndex[monthKey]) {
        futureInvoiceIndex[monthKey] = {};
      }
      futureInvoiceIndex[monthKey][inv.creditCardId] = inv.total;
    }

    const monthlySpending: CardMonthlySpending[] = [];

    for (let i = -2; i <= 3; i++) {
      const monthDate = i < 0 ? subMonths(now, Math.abs(i)) : i > 0 ? addMonths(now, i) : now;
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM", { locale: ptBR });

      const cardBreakdown: CardMonthlySpending["cardBreakdown"] = [];

      for (const card of creditCards) {
        let cardTotal = 0;

        if (i <= 0) {
          // Past and current: use aggregated purchase data
          cardTotal = monthlyIndex[monthKey]?.[card.id] || 0;
        } else {
          // Future: use invoice total
          cardTotal = futureInvoiceIndex[monthKey]?.[card.id] || 0;
        }

        if (cardTotal > 0) {
          cardBreakdown.push({
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
            total: cardTotal,
          });
        }
      }

      monthlySpending.push({
        month: monthKey,
        monthLabel,
        total: cardBreakdown.reduce((sum, c) => sum + c.total, 0),
        cardBreakdown,
      });
    }

    // === ALERTS ===
    const alerts: CardAlert[] = [];

    // Index unpaid invoices by card
    const unpaidByCard: Record<string, number> = {};
    for (const inv of unpaidInvoicesForUsage) {
      const debt = inv.total - inv.paidAmount;
      unpaidByCard[inv.creditCardId] = (unpaidByCard[inv.creditCardId] || 0) + debt;
    }

    // Index current month invoices by card
    const currentInvoiceByCard = new Map<string, CurrentMonthInvoice>(
      (currentMonthInvoices as CurrentMonthInvoice[]).map((inv) => [inv.creditCardId, inv])
    );

    for (const card of creditCards) {
      // Check for payment due
      const currentInvoice = currentInvoiceByCard.get(card.id);

      if (currentInvoice) {
        const dueDate = new Date(currentInvoice.dueDate);
        const daysUntilDue = differenceInDays(dueDate, now);

        if (
          daysUntilDue >= 0 &&
          daysUntilDue <= 5 &&
          currentInvoice.status !== "paid" &&
          currentInvoice.total > currentInvoice.paidAmount
        ) {
          alerts.push({
            type: "payment_due",
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
            message:
              daysUntilDue === 0
                ? "Fatura vence HOJE!"
                : `Fatura vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? "s" : ""}`,
            value: currentInvoice.total - currentInvoice.paidAmount,
            daysUntil: daysUntilDue,
          });
        }
      }

      // Check for closing soon
      const daysUntilClosing =
        card.closingDay >= currentDay
          ? card.closingDay - currentDay
          : 30 - currentDay + card.closingDay;

      if (daysUntilClosing <= 3) {
        alerts.push({
          type: "closing_soon",
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color,
          message:
            daysUntilClosing === 0
              ? "Fatura fecha HOJE!"
              : `Fatura fecha em ${daysUntilClosing} dia${daysUntilClosing !== 1 ? "s" : ""}`,
          daysUntil: daysUntilClosing,
        });
      }

      // Check for high usage
      const usedLimit = unpaidByCard[card.id] || 0;
      const usagePercent = card.limit > 0 ? (usedLimit / card.limit) * 100 : 0;

      if (usagePercent >= 80) {
        alerts.push({
          type: "high_usage",
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color,
          message: `Uso do limite em ${usagePercent.toFixed(0)}%`,
          value: usedLimit,
        });
      }
    }

    // Sort alerts by priority
    alerts.sort((a, b) => {
      const priority = { payment_due: 0, closing_soon: 1, high_usage: 2 };
      return priority[a.type] - priority[b.type];
    });

    // === SUMMARY ===
    const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
    const totalUsed = Object.values(unpaidByCard).reduce((sum, debt) => sum + debt, 0);

    const averageMonthlySpending =
      monthlySpending.reduce((sum, m) => sum + m.total, 0) / monthlySpending.length;

    return NextResponse.json(
      {
        spendingByCategory,
        monthlySpending,
        alerts,
        summary: {
          totalCards: creditCards.length,
          totalLimit,
          totalUsed,
          usagePercentage: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
          averageMonthlySpending,
          totalSpendingLast6Months: totalSpending,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=120, stale-while-revalidate=300",
        },
      }
    );
    } catch (error) {
      console.error("Erro ao gerar analytics de cartões:", error);
      return errorResponse("Erro ao gerar analytics de cartões", 500, "CARDS_ANALYTICS_ERROR");
    }
  });
}
