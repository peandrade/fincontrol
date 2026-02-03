import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { startOfMonth, subMonths, addMonths, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { purchaseRepository, invoiceRepository, cardRepository } from "@/repositories";

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

    // All queries in parallel - using repositories for proper decryption of encrypted data
    const [
      creditCards,
      purchasesForCategory,
      purchasesForMonthly,
      futureInvoices,
      unpaidInvoicesForUsage,
      currentMonthInvoices,
    ] = await Promise.all([
      // Basic card info using repository (handles decryption)
      cardRepository.findByUser(userId, { isActive: true }),

      // Purchases for category spending (last 6 months) - using repository
      purchaseRepository.findByUser(userId, { startDate: sixMonthsAgo }),

      // Purchases for monthly spending (past 2 months + current) - using repository
      purchaseRepository.findByUserWithCardInfo(userId, { startDate: twoMonthsAgo }),

      // Future invoices (next 3 months) - using repository
      invoiceRepository.getFutureByUser(userId, currentMonth, currentYear),

      // Unpaid invoices for usage calculation - using repository
      invoiceRepository.getUnpaidByUser(userId),

      // Current month invoices for alerts - using repository
      invoiceRepository.getByMonthForUser(userId, currentMonth, currentYear),
    ]);

    // Aggregate purchases by category (values are decrypted by repository)
    const categoryAggregates: Record<string, { total: number; count: number }> = {};
    for (const p of purchasesForCategory) {
      const value = p.value as unknown as number;
      if (!categoryAggregates[p.category]) {
        categoryAggregates[p.category] = { total: 0, count: 0 };
      }
      categoryAggregates[p.category].total += value;
      categoryAggregates[p.category].count += 1;
    }

    // Convert to sorted array
    const categorySpending = Object.entries(categoryAggregates)
      .map(([category, data]) => ({ category, total: data.total, count: data.count }))
      .sort((a, b) => b.total - a.total);

    // Aggregate purchases by card and month (values are decrypted by repository)
    const monthlyCardAggregates: Record<string, Record<string, { total: number; name: string; color: string }>> = {};
    for (const p of purchasesForMonthly) {
      const value = p.value as unknown as number;
      const monthKey = format(new Date(p.date), "yyyy-MM");
      // Type assertion for nested invoice data
      const invoice = p.invoice as unknown as { creditCard: { id: string; name: string; color: string } };
      const cardId = invoice.creditCard.id;

      if (!monthlyCardAggregates[monthKey]) {
        monthlyCardAggregates[monthKey] = {};
      }
      if (!monthlyCardAggregates[monthKey][cardId]) {
        monthlyCardAggregates[monthKey][cardId] = {
          total: 0,
          name: invoice.creditCard.name,
          color: invoice.creditCard.color,
        };
      }
      monthlyCardAggregates[monthKey][cardId].total += value;
    }

    // Create card lookup map
    const cardMap = new Map(creditCards.map((c) => [c.id, c]));

    // === SPENDING BY CATEGORY ===
    const totalSpending = categorySpending.reduce((sum, cat) => sum + cat.total, 0);

    const spendingByCategory: CardSpendingByCategory[] = categorySpending.map((row) => ({
      category: row.category,
      total: row.total,
      percentage: totalSpending > 0 ? (row.total / totalSpending) * 100 : 0,
      transactionCount: row.count,
    }));

    // === MONTHLY SPENDING ===
    // Index monthly spending by card and month (already aggregated above)
    const monthlyIndex = monthlyCardAggregates;

    // Index future invoices (values are decrypted by repository)
    const futureInvoiceIndex: Record<string, Record<string, number>> = {};
    for (const inv of futureInvoices) {
      const total = inv.total as unknown as number;
      const monthKey = `${inv.year}-${String(inv.month).padStart(2, "0")}`;
      if (!futureInvoiceIndex[monthKey]) {
        futureInvoiceIndex[monthKey] = {};
      }
      futureInvoiceIndex[monthKey][inv.creditCardId] = total;
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
          cardTotal = monthlyIndex[monthKey]?.[card.id]?.total || 0;
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

    // Index unpaid invoices by card (values are decrypted by repository)
    const unpaidByCard: Record<string, number> = {};
    for (const inv of unpaidInvoicesForUsage) {
      const total = inv.total as unknown as number;
      const paidAmount = inv.paidAmount as unknown as number;
      const debt = total - paidAmount;
      unpaidByCard[inv.creditCardId] = (unpaidByCard[inv.creditCardId] || 0) + debt;
    }

    // Index current month invoices by card (values are decrypted by repository)
    const currentInvoiceByCard = new Map(
      currentMonthInvoices.map((inv) => [inv.creditCardId, {
        creditCardId: inv.creditCardId,
        status: inv.status,
        total: inv.total as unknown as number,
        paidAmount: inv.paidAmount as unknown as number,
        dueDate: inv.dueDate,
      }])
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
      const cardLimit = card.limit as unknown as number;
      const usagePercent = cardLimit > 0 ? (usedLimit / cardLimit) * 100 : 0;

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
    const totalLimit = creditCards.reduce((sum, card) => sum + (card.limit as unknown as number), 0);
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
