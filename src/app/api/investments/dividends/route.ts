import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";

export interface DividendData {
  id: string;
  investmentId: string;
  investmentName: string;
  ticker?: string;
  type: string;
  value: number;
  date: string;
  notes?: string;
}

export interface DividendsSummary {
  thisMonth: number;
  thisYear: number;
  lastMonth: number;
  last12Months: number;
  averageMonthly: number;
  yieldOnCost: number; // Yield baseado no valor investido
}

export interface UpcomingDividend {
  investmentName: string;
  ticker?: string;
  estimatedValue: number;
  estimatedDate: string;
}

export interface DividendsResponse {
  summary: DividendsSummary;
  recent: DividendData[];
  byInvestment: {
    investmentId: string;
    investmentName: string;
    ticker?: string;
    total: number;
    count: number;
  }[];
  monthlyHistory: {
    month: string;
    value: number;
  }[];
}

export async function GET() {
  return withAuth(async (session) => {
    const userId = session.user.id;

    // Buscar todos os investimentos do usuário com operações de dividendo
    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        operations: {
          where: { type: "dividend" },
          orderBy: { date: "desc" },
        },
      },
    });

    // Datas de referência
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Coletar todas as operações de dividendo
    const allDividends: DividendData[] = [];
    let thisMonth = 0;
    let lastMonth = 0;
    let thisYear = 0;
    let last12Months = 0;
    let totalInvested = 0;

    const byInvestmentMap = new Map<string, {
      investmentId: string;
      investmentName: string;
      ticker?: string;
      total: number;
      count: number;
    }>();

    const monthlyMap = new Map<string, number>();

    for (const inv of investments) {
      totalInvested += inv.totalInvested;

      if (!byInvestmentMap.has(inv.id)) {
        byInvestmentMap.set(inv.id, {
          investmentId: inv.id,
          investmentName: inv.name,
          ticker: inv.ticker || undefined,
          total: 0,
          count: 0,
        });
      }

      for (const op of inv.operations) {
        const opDate = new Date(op.date);
        const monthKey = `${opDate.getFullYear()}-${String(opDate.getMonth() + 1).padStart(2, "0")}`;

        allDividends.push({
          id: op.id,
          investmentId: inv.id,
          investmentName: inv.name,
          ticker: inv.ticker || undefined,
          type: inv.type,
          value: op.total,
          date: op.date.toISOString(),
          notes: op.notes || undefined,
        });

        // Acumular por período
        if (opDate >= startOfThisMonth) {
          thisMonth += op.total;
        }
        if (opDate >= startOfLastMonth && opDate <= endOfLastMonth) {
          lastMonth += op.total;
        }
        if (opDate >= startOfThisYear) {
          thisYear += op.total;
        }
        if (opDate >= twelveMonthsAgo) {
          last12Months += op.total;
        }

        // Acumular por investimento
        const invData = byInvestmentMap.get(inv.id)!;
        invData.total += op.total;
        invData.count += 1;

        // Acumular por mês
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + op.total);
      }
    }

    // Calcular média mensal (últimos 12 meses)
    const averageMonthly = last12Months / 12;

    // Calcular yield on cost
    const yieldOnCost = totalInvested > 0 ? (last12Months / totalInvested) * 100 : 0;

    // Ordenar dividendos recentes (últimos 10)
    const recentDividends = allDividends
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Converter byInvestment para array e ordenar por total
    const byInvestment = Array.from(byInvestmentMap.values())
      .filter((inv) => inv.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Gerar histórico mensal (últimos 6 meses)
    const monthlyHistory: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      monthlyHistory.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        value: monthlyMap.get(monthKey) || 0,
      });
    }

    const response: DividendsResponse = {
      summary: {
        thisMonth,
        thisYear,
        lastMonth,
        last12Months,
        averageMonthly,
        yieldOnCost,
      },
      recent: recentDividends,
      byInvestment,
      monthlyHistory,
    };

    return NextResponse.json(response);
  });
}
