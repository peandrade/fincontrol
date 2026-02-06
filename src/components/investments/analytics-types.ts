// Types for investment analytics

export interface PerformanceData {
  investmentId: string;
  name: string;
  type: string;
  ticker?: string;
  profitLoss: number;
  profitLossPercent: number;
  currentValue: number;
  totalInvested: number;
}

export interface AllocationTarget {
  type: string;
  typeName: string;
  currentPercent: number;
  targetPercent: number;
  difference: number;
  currentValue: number;
  suggestedAction: "buy" | "sell" | "hold";
}

export interface PortfolioInsight {
  type: "positive" | "negative" | "neutral" | "warning";
  titleKey: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
}

export interface InvestmentAnalyticsData {
  performance: {
    top: PerformanceData[];
    worst: PerformanceData[];
  };
  allocation: AllocationTarget[];
  insights: PortfolioInsight[];
  summary: {
    totalInvested: number;
    currentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    diversificationScore: number;
    investmentCount: number;
    typeCount: number;
  };
}

export const typeColors: Record<string, string> = {
  stock: "#8B5CF6",
  fii: "#10B981",
  etf: "#3B82F6",
  crypto: "#F59E0B",
  cdb: "#EC4899",
  treasury: "#14B8A6",
  lci_lca: "#6366F1",
  savings: "#84CC16",
  other: "#6B7280",
};
