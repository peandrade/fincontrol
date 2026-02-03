import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { z } from "zod";
import { validateBody } from "@/lib/schemas";

// NOTE: Prisma extension handles encryption/decryption automatically.
// Do NOT call encryptRecord/decryptRecord manually - it causes double encryption.

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
  return withAuth(async (session, req) => {
    const body = await req.json();

    const validation = validateBody(confirmSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { transactions, investments, budgets, goals, recurringExpenses } = validation.data;
    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // ── Transactions ──
      // Prisma extension handles encryption automatically
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

        const created = await tx.transaction.createMany({ data: txData as any });
        transactionsCreated = created.count;
      }

      // ── Investments ──
      // Prisma extension handles encryption automatically
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
            profitLoss: profitLoss,
            profitLossPercent: profitLossPercent,
            interestRate: inv.interestRate,
            indexer: inv.indexer,
            maturityDate: inv.maturityDate ? new Date(inv.maturityDate) : null,
            userId,
          } as any,
        });
        investmentsCreated++;
      }

      // ── Budgets (upsert) ──
      // Prisma extension handles encryption automatically
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
          update: { limit: b.limit } as any,
          create: {
            category: b.category,
            limit: b.limit,
            month: b.month,
            year: b.year,
            userId,
          } as any,
        });
        budgetsCreated++;
      }

      // ── Goals ──
      // Prisma extension handles encryption automatically
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
          } as any,
        });

        if (g.currentValue > 0) {
          await tx.goalContribution.create({
            data: {
              goalId: goal.id,
              value: g.currentValue,
              date: new Date(),
              notes: "Importado via planilha",
            } as any,
          });
        }
        goalsCreated++;
      }

      // ── Recurring Expenses ──
      // Prisma extension handles encryption automatically
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

        const created = await tx.recurringExpense.createMany({
          data: recData as any,
        });
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
  }, request);
}
