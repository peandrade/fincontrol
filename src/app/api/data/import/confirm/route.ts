import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { z } from "zod";
import { validateBody } from "@/lib/schemas";
import { encryptRecord } from "@/lib/encryption";

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
      let transactionsCreated = 0;
      if (transactions.length > 0) {
        const txData = transactions.map((t) => {
          const dateObj = new Date(t.date);
          // Encrypt sensitive fields before saving
          return encryptRecord(
            {
              type: t.type as "income" | "expense",
              value: t.value,
              category: t.category,
              description: t.description,
              date: dateObj,
              userId,
            } as Record<string, unknown>,
            "Transaction"
          );
        });

        const created = await tx.transaction.createMany({ data: txData as Parameters<typeof tx.transaction.createMany>[0]["data"] });
        transactionsCreated = created.count;
      }

      // ── Investments ──
      let investmentsCreated = 0;
      for (const inv of investments) {
        const profitLoss = inv.currentValue - inv.totalInvested;
        const profitLossPercent =
          inv.totalInvested > 0 ? (profitLoss / inv.totalInvested) * 100 : 0;

        // Encrypt sensitive fields before saving
        const encryptedInvData = encryptRecord(
          {
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
          } as Record<string, unknown>,
          "Investment"
        );

        await tx.investment.create({
          data: encryptedInvData as Parameters<typeof tx.investment.create>[0]["data"],
        });
        investmentsCreated++;
      }

      // ── Budgets (upsert) ──
      let budgetsCreated = 0;
      for (const b of budgets) {
        // Encrypt limit for create/update
        const encryptedCreateData = encryptRecord(
          {
            category: b.category,
            limit: b.limit,
            month: b.month,
            year: b.year,
            userId,
          } as Record<string, unknown>,
          "Budget"
        );

        const encryptedUpdateData = encryptRecord(
          { limit: b.limit } as Record<string, unknown>,
          "Budget"
        );

        await tx.budget.upsert({
          where: {
            category_month_year_userId: {
              category: b.category,
              month: b.month,
              year: b.year,
              userId,
            },
          },
          update: encryptedUpdateData,
          create: encryptedCreateData as Parameters<typeof tx.budget.create>[0]["data"],
        });
        budgetsCreated++;
      }

      // ── Goals ──
      let goalsCreated = 0;
      for (const g of goals) {
        // Encrypt sensitive fields before saving
        const encryptedGoalData = encryptRecord(
          {
            name: g.name,
            description: g.description,
            category: g.category as "emergency" | "travel" | "car" | "house" | "education" | "retirement" | "other",
            targetValue: g.targetValue,
            currentValue: g.currentValue,
            targetDate: g.targetDate ? new Date(g.targetDate) : null,
            color: g.color || "#8B5CF6",
            userId,
          } as Record<string, unknown>,
          "FinancialGoal"
        );

        const goal = await tx.financialGoal.create({
          data: encryptedGoalData as Parameters<typeof tx.financialGoal.create>[0]["data"],
        });

        if (g.currentValue > 0) {
          // Encrypt contribution data
          const encryptedContributionData = encryptRecord(
            {
              goalId: goal.id,
              value: g.currentValue,
              date: new Date(),
              notes: "Importado via planilha",
            } as Record<string, unknown>,
            "GoalContribution"
          );

          await tx.goalContribution.create({
            data: encryptedContributionData as Parameters<typeof tx.goalContribution.create>[0]["data"],
          });
        }
        goalsCreated++;
      }

      // ── Recurring Expenses ──
      let recurringExpensesCreated = 0;
      if (recurringExpenses.length > 0) {
        const recData = recurringExpenses.map((r) =>
          // Encrypt sensitive fields before saving
          encryptRecord(
            {
              description: r.description,
              value: r.value,
              category: r.category,
              dueDay: r.dueDay,
              isActive: r.isActive,
              notes: r.notes,
              userId,
            } as Record<string, unknown>,
            "RecurringExpense"
          )
        );

        const created = await tx.recurringExpense.createMany({
          data: recData as Parameters<typeof tx.recurringExpense.createMany>[0]["data"],
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
