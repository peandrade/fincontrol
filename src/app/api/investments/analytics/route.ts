import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";

interface PerformanceData {
  investmentId: string;
  name: string;
  type: string;
  ticker?: string;
  profitLoss: number;
  profitLossPercent: number;
  currentValue: number;
  totalInvested: number;
}

interface AllocationTarget {
  type: string;
  typeName: string;
  currentPercent: number;
  targetPercent: number;
  difference: number;
  currentValue: number;
  suggestedAction: "buy" | "sell" | "hold";
}

interface PortfolioInsight {
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
}

const typeNames: Record<string, string> = {
  stock: "Ações",
  fii: "FIIs",
  etf: "ETFs",
  crypto: "Criptomoedas",
  cdb: "CDB",
  treasury: "Tesouro",
  lci_lca: "LCI/LCA",
  savings: "Poupança",
  other: "Outros",
};

// Default allocation targets (can be customized)
const defaultTargets: Record<string, number> = {
  stock: 30,
  fii: 20,
  etf: 15,
  crypto: 5,
  cdb: 10,
  treasury: 10,
  lci_lca: 5,
  savings: 5,
  other: 0,
};

export async function GET() {
  return withAuth(async (session) => {
    const userId = session.user.id;

    // Fetch investments with operations
    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        operations: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (investments.length === 0) {
      return NextResponse.json({
        performance: { top: [], worst: [] },
        allocation: [],
        insights: [],
        summary: {
          totalInvested: 0,
          currentValue: 0,
          totalProfitLoss: 0,
          totalProfitLossPercent: 0,
          diversificationScore: 0,
        },
      });
    }

    // === PERFORMANCE ANALYSIS ===
    const performanceData: PerformanceData[] = investments.map((inv) => ({
      investmentId: inv.id,
      name: inv.name,
      type: inv.type,
      ticker: inv.ticker || undefined,
      profitLoss: inv.profitLoss,
      profitLossPercent: inv.profitLossPercent,
      currentValue: inv.currentValue,
      totalInvested: inv.totalInvested,
    }));

    // Sort by profit/loss percent
    const sortedByPerformance = [...performanceData].sort(
      (a, b) => b.profitLossPercent - a.profitLossPercent
    );

    const topPerformers = sortedByPerformance.filter((p) => p.profitLossPercent > 0).slice(0, 5);
    const worstPerformers = sortedByPerformance
      .filter((p) => p.profitLossPercent < 0)
      .sort((a, b) => a.profitLossPercent - b.profitLossPercent)
      .slice(0, 5);

    // === ALLOCATION ANALYSIS ===
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

    const allocationByType: Record<string, number> = {};
    for (const inv of investments) {
      allocationByType[inv.type] = (allocationByType[inv.type] || 0) + inv.currentValue;
    }

    const allocationTargets: AllocationTarget[] = Object.entries(defaultTargets)
      .filter(([type]) => allocationByType[type] || defaultTargets[type] > 0)
      .map(([type, targetPercent]) => {
        const currentValue = allocationByType[type] || 0;
        const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
        const difference = currentPercent - targetPercent;

        let suggestedAction: "buy" | "sell" | "hold" = "hold";
        if (difference < -5) suggestedAction = "buy";
        else if (difference > 5) suggestedAction = "sell";

        return {
          type,
          typeName: typeNames[type] || type,
          currentPercent,
          targetPercent,
          difference,
          currentValue,
          suggestedAction,
        };
      })
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    // === INSIGHTS ===
    const insights: PortfolioInsight[] = [];

    // Calculate totals
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const totalProfitLoss = investments.reduce((sum, inv) => sum + inv.profitLoss, 0);
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    // Diversification score
    const uniqueTypes = new Set(investments.map((inv) => inv.type)).size;
    const diversificationScore = Math.min((uniqueTypes / 5) * 100, 100);

    // Overall performance insight
    if (totalProfitLossPercent > 10) {
      insights.push({
        type: "positive",
        title: "Excelente retorno",
        description: `Sua carteira está com ${totalProfitLossPercent.toFixed(1)}% de valorização`,
      });
    } else if (totalProfitLossPercent < -10) {
      insights.push({
        type: "negative",
        title: "Carteira em baixa",
        description: `Sua carteira está com ${totalProfitLossPercent.toFixed(1)}% de desvalorização`,
      });
    }

    // Concentration risk
    const maxAllocation = Math.max(...Object.values(allocationByType));
    const maxAllocationPercent = totalValue > 0 ? (maxAllocation / totalValue) * 100 : 0;
    if (maxAllocationPercent > 50) {
      const concentratedType = Object.entries(allocationByType).find(
        ([, value]) => value === maxAllocation
      )?.[0];
      insights.push({
        type: "warning",
        title: "Concentração elevada",
        description: `${typeNames[concentratedType || ""] || "Uma classe"} representa ${maxAllocationPercent.toFixed(0)}% da carteira`,
      });
    }

    // Diversification insight
    if (diversificationScore < 40) {
      insights.push({
        type: "neutral",
        title: "Baixa diversificação",
        description: "Considere investir em mais classes de ativos para reduzir risco",
      });
    } else if (diversificationScore >= 80) {
      insights.push({
        type: "positive",
        title: "Boa diversificação",
        description: "Sua carteira está bem distribuída entre diferentes classes",
      });
    }

    // Top performer insight
    if (topPerformers.length > 0 && topPerformers[0].profitLossPercent > 20) {
      insights.push({
        type: "positive",
        title: "Destaque positivo",
        description: `${topPerformers[0].name} valorizou ${topPerformers[0].profitLossPercent.toFixed(1)}%`,
      });
    }

    // Worst performer insight
    if (worstPerformers.length > 0 && worstPerformers[0].profitLossPercent < -20) {
      insights.push({
        type: "negative",
        title: "Atenção necessária",
        description: `${worstPerformers[0].name} desvalorizou ${Math.abs(worstPerformers[0].profitLossPercent).toFixed(1)}%`,
      });
    }

    // Rebalancing suggestion
    const needsRebalancing = allocationTargets.some((a) => Math.abs(a.difference) > 10);
    if (needsRebalancing) {
      insights.push({
        type: "neutral",
        title: "Rebalanceamento sugerido",
        description: "Alguns ativos estão fora da alocação alvo",
      });
    }

    return NextResponse.json({
      performance: {
        top: topPerformers,
        worst: worstPerformers,
      },
      allocation: allocationTargets,
      insights,
      summary: {
        totalInvested,
        currentValue: totalValue,
        totalProfitLoss,
        totalProfitLossPercent,
        diversificationScore,
        investmentCount: investments.length,
        typeCount: uniqueTypes,
      },
    }, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  });
}
