import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  value: z.number().positive(),
  category: z.string().min(1),
  description: z.string().nullable(),
  date: z.string().min(1),
});

const investmentSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  ticker: z.string().nullable(),
  institution: z.string().nullable(),
  quantity: z.number().min(0),
  averagePrice: z.number().min(0),
  totalInvested: z.number().min(0),
  currentValue: z.number().min(0),
  interestRate: z.number().nullable(),
  indexer: z.string().nullable(),
  maturityDate: z.string().nullable(),
});

const budgetSchema = z.object({
  category: z.string().min(1),
  limit: z.number().positive(),
  month: z.number().int().min(0).max(12),
  year: z.number().int().min(0),
});

const goalSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().min(1),
  targetValue: z.number().positive(),
  currentValue: z.number().min(0),
  targetDate: z.string().nullable(),
  color: z.string().nullable(),
});

const recurringExpenseSchema = z.object({
  description: z.string().min(1),
  value: z.number().positive(),
  category: z.string().min(1),
  dueDay: z.number().int().min(1).max(31),
  isActive: z.boolean(),
  notes: z.string().nullable(),
});

const confirmSchema = z.object({
  transactions: z.array(transactionSchema).default([]),
  investments: z.array(investmentSchema).default([]),
  budgets: z.array(budgetSchema).default([]),
  goals: z.array(goalSchema).default([]),
  recurringExpenses: z.array(recurringExpenseSchema).default([]),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { transactions, investments, budgets, goals, recurringExpenses } = parsed.data;
    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // ── Transactions ──
      let transactionsCreated = 0;
      if (transactions.length > 0) {
        const txData = transactions.map((t) => {
          const dateObj = new Date(t.date);
          return {
            type: t.type as "income" | "expense",
            value: t.value,
            category: t.category,
            description: t.description,
            date: dateObj,
            userId,
          };
        });

        const created = await tx.transaction.createMany({ data: txData });
        transactionsCreated = created.count;
      }

      // ── Investments ──
      let investmentsCreated = 0;
      for (const inv of investments) {
        const profitLoss = inv.currentValue - inv.totalInvested;
        const profitLossPercent =
          inv.totalInvested > 0 ? (profitLoss / inv.totalInvested) * 100 : 0;

        await tx.investment.create({
          data: {
            type: inv.type as "stock" | "fii" | "etf" | "crypto" | "cdb" | "treasury" | "lci_lca" | "savings" | "other",
            name: inv.name,
            ticker: inv.ticker,
            institution: inv.institution,
            quantity: inv.quantity,
            averagePrice: inv.averagePrice,
            currentPrice: inv.averagePrice,
            totalInvested: inv.totalInvested,
            currentValue: inv.currentValue,
            profitLoss,
            profitLossPercent,
            interestRate: inv.interestRate,
            indexer: inv.indexer,
            maturityDate: inv.maturityDate ? new Date(inv.maturityDate) : null,
            userId,
          },
        });
        investmentsCreated++;
      }

      // ── Budgets (upsert) ──
      let budgetsCreated = 0;
      for (const b of budgets) {
        await tx.budget.upsert({
          where: {
            category_month_year_userId: {
              category: b.category,
              month: b.month,
              year: b.year,
              userId,
            },
          },
          update: { limit: b.limit },
          create: {
            category: b.category,
            limit: b.limit,
            month: b.month,
            year: b.year,
            userId,
          },
        });
        budgetsCreated++;
      }

      // ── Goals ──
      let goalsCreated = 0;
      for (const g of goals) {
        const goal = await tx.financialGoal.create({
          data: {
            name: g.name,
            description: g.description,
            category: g.category as "emergency" | "travel" | "car" | "house" | "education" | "retirement" | "other",
            targetValue: g.targetValue,
            currentValue: g.currentValue,
            targetDate: g.targetDate ? new Date(g.targetDate) : null,
            color: g.color || "#8B5CF6",
            userId,
          },
        });

        if (g.currentValue > 0) {
          await tx.goalContribution.create({
            data: {
              goalId: goal.id,
              value: g.currentValue,
              date: new Date(),
              notes: "Importado via planilha",
            },
          });
        }
        goalsCreated++;
      }

      // ── Recurring Expenses ──
      let recurringExpensesCreated = 0;
      if (recurringExpenses.length > 0) {
        const recData = recurringExpenses.map((r) => ({
          description: r.description,
          value: r.value,
          category: r.category,
          dueDay: r.dueDay,
          isActive: r.isActive,
          notes: r.notes,
          userId,
        }));

        const created = await tx.recurringExpense.createMany({ data: recData });
        recurringExpensesCreated = created.count;
      }

      return {
        transactionsCreated,
        investmentsCreated,
        budgetsCreated,
        goalsCreated,
        recurringExpensesCreated,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao importar dados:", error);
    return NextResponse.json(
      { error: "Erro ao salvar dados. Nenhum dado foi importado." },
      { status: 500 }
    );
  }
}
