import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsService } from "@/services/analytics-service";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    investment: {
      findMany: vi.fn(),
    },
    creditCard: {
      findMany: vi.fn(),
    },
    financialGoal: {
      findMany: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe("getPeriodTotals", () => {
    it("should calculate period totals correctly", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { type: "income", value: 5000 },
        { type: "income", value: 1000 },
        { type: "expense", value: 2000 },
        { type: "expense", value: 500 },
      ] as never);

      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 0, 31);

      const result = await service.getPeriodTotals("user-1", startDate, endDate);

      expect(result.income).toBe(6000);
      expect(result.expense).toBe(2500);
      expect(result.balance).toBe(3500);
      expect(result.count).toBe(4);
    });

    it("should return zeros when no transactions", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never);

      const result = await service.getPeriodTotals(
        "user-1",
        new Date(),
        new Date()
      );

      expect(result.income).toBe(0);
      expect(result.expense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.count).toBe(0);
    });
  });

  describe("getCategoryBreakdown", () => {
    it("should calculate category breakdown with percentages", async () => {
      vi.mocked(prisma.transaction.groupBy).mockResolvedValue([
        { category: "Alimentação", _sum: { value: 500 }, _count: 10 },
        { category: "Transporte", _sum: { value: 300 }, _count: 5 },
        { category: "Lazer", _sum: { value: 200 }, _count: 3 },
      ] as never);

      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 0, 31);

      const result = await service.getCategoryBreakdown(
        "user-1",
        startDate,
        endDate,
        "expense"
      );

      expect(result).toHaveLength(3);
      expect(result[0].category).toBe("Alimentação");
      expect(result[0].total).toBe(500);
      expect(result[0].percentage).toBe(50); // 500/1000 * 100
      expect(result[1].percentage).toBe(30);
      expect(result[2].percentage).toBe(20);
    });
  });

  describe("getMonthlyTrend", () => {
    it("should aggregate transactions by month", async () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);

      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { type: "income", value: 5000, date: thisMonth },
        { type: "expense", value: 2000, date: thisMonth },
        { type: "income", value: 4000, date: lastMonth },
        { type: "expense", value: 1500, date: lastMonth },
      ] as never);

      const result = await service.getMonthlyTrend("user-1", 2);

      expect(result).toHaveLength(2);
      // Results are ordered from oldest to newest
      expect(result[0].income).toBe(4000);
      expect(result[0].expense).toBe(1500);
      expect(result[0].balance).toBe(2500);
      expect(result[1].income).toBe(5000);
      expect(result[1].expense).toBe(2000);
      expect(result[1].balance).toBe(3000);
    });
  });

  describe("getSpendingTrend", () => {
    it("should calculate spending trend percentage", async () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);

      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { type: "expense", value: 3000, date: thisMonth },
        { type: "expense", value: 2000, date: lastMonth },
      ] as never);

      const result = await service.getSpendingTrend("user-1", 2);

      expect(result.current).toBe(3000);
      expect(result.trend).toBe(50); // (3000 - 2000) / 2000 * 100 = 50%
    });

    it("should return zero trend when insufficient data", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never);

      const result = await service.getSpendingTrend("user-1", 2);

      expect(result.trend).toBe(0);
      expect(result.average).toBe(0);
      expect(result.current).toBe(0);
    });
  });

  describe("getDashboardSummary", () => {
    it("should return complete dashboard summary", async () => {
      vi.mocked(prisma.transaction.findMany)
        .mockResolvedValueOnce([
          { type: "income", value: 10000 },
          { type: "expense", value: 5000 },
        ] as never)
        .mockResolvedValueOnce([
          { type: "income", value: 6000 },
          { type: "expense", value: 3000 },
        ] as never);

      vi.mocked(prisma.investment.findMany).mockResolvedValue([
        { currentValue: 20000, totalInvested: 15000, profitLoss: 5000 },
      ] as never);

      vi.mocked(prisma.creditCard.findMany).mockResolvedValue([
        { limit: 10000, invoices: [{ total: 2000, paidAmount: 0, status: "open" }] },
      ] as never);

      vi.mocked(prisma.financialGoal.findMany).mockResolvedValue([
        { targetValue: 10000, currentValue: 5000, isCompleted: false },
      ] as never);

      const result = await service.getDashboardSummary("user-1");

      expect(result.balance.current).toBe(5000); // 10000 - 5000
      expect(result.balance.monthlyIncome).toBe(6000);
      expect(result.balance.monthlyExpenses).toBe(3000);
      expect(result.investments.currentValue).toBe(20000);
      expect(result.investments.profitLoss).toBe(5000);
      expect(result.cards.totalLimit).toBe(10000);
      expect(result.cards.usedLimit).toBe(2000);
      expect(result.goals.progress).toBe(50);
    });
  });

  describe("calculateHealthScore", () => {
    beforeEach(() => {
      // Setup default mocks for health score calculation
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { type: "income", value: 5000 },
        { type: "expense", value: 3000 },
      ] as never);

      vi.mocked(prisma.transaction.groupBy).mockResolvedValue([
        { category: "Alimentação", _sum: { value: 1000 }, _count: 10 },
      ] as never);

      vi.mocked(prisma.investment.findMany).mockResolvedValue([
        { type: "stock", currentValue: 10000 },
        { type: "fii", currentValue: 5000 },
        { type: "cdb", currentValue: 5000 },
      ] as never);

      vi.mocked(prisma.creditCard.findMany).mockResolvedValue([
        { limit: 10000, invoices: [{ total: 1000, paidAmount: 0, status: "open" }] },
      ] as never);

      vi.mocked(prisma.financialGoal.findMany).mockResolvedValue([
        { category: "emergency", currentValue: 18000, targetValue: 20000 },
      ] as never);

      vi.mocked(prisma.budget.findMany).mockResolvedValue([
        { category: "Alimentação", limit: 1500 },
      ] as never);
    });

    it("should calculate health score with all components", async () => {
      const result = await service.calculateHealthScore("user-1");

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.level).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.componentScores).toBeDefined();
    });

    it("should return excellent level for high scores", async () => {
      // Mock high savings, low credit usage, good emergency fund, diversified investments
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { type: "income", value: 10000 },
        { type: "expense", value: 3000 },
      ] as never);

      vi.mocked(prisma.creditCard.findMany).mockResolvedValue([
        { limit: 10000, invoices: [] },
      ] as never);

      const result = await service.calculateHealthScore("user-1");

      expect(result.level).toBe("excellent");
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it("should return poor level for low scores", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { type: "income", value: 3000 },
        { type: "expense", value: 3000 },
      ] as never);

      vi.mocked(prisma.creditCard.findMany).mockResolvedValue([
        { limit: 10000, invoices: [{ total: 5000, paidAmount: 0, status: "open" }] },
      ] as never);

      vi.mocked(prisma.financialGoal.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.investment.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.budget.findMany).mockResolvedValue([] as never);

      const result = await service.calculateHealthScore("user-1");

      expect(result.level).toBe("poor");
      expect(result.score).toBeLessThan(40);
    });

    it("should generate appropriate tips", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { type: "income", value: 5000 },
        { type: "expense", value: 4500 }, // Low savings rate
      ] as never);

      vi.mocked(prisma.creditCard.findMany).mockResolvedValue([
        { limit: 10000, invoices: [{ total: 4000, paidAmount: 0, status: "open" }] }, // High credit usage
      ] as never);

      vi.mocked(prisma.financialGoal.findMany).mockResolvedValue([] as never); // No emergency fund

      const result = await service.calculateHealthScore("user-1");

      expect(result.tips.length).toBeGreaterThan(0);
      expect(result.tips.some((tip) => tip.includes("poupança"))).toBe(true);
      expect(result.tips.some((tip) => tip.includes("cartão de crédito"))).toBe(true);
      expect(result.tips.some((tip) => tip.includes("emergência"))).toBe(true);
    });
  });
});
