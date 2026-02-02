import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  InvestmentOperationService,
  InvestmentOperationError,
} from "@/services/investment-operation-service";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    investment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    operation: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      investment: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      operation: {
        create: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
      },
    })),
  },
}));

// Mock CDI history service
vi.mock("@/lib/cdi-history-service", () => ({
  fetchCDIHistory: vi.fn(),
  calculateFixedIncomeYield: vi.fn(),
}));

import { prisma } from "@/lib/prisma";

describe("InvestmentOperationService", () => {
  let service: InvestmentOperationService;

  beforeEach(() => {
    service = new InvestmentOperationService();
    vi.clearAllMocks();
  });

  describe("addOperation - validation", () => {
    it("should throw NOT_FOUND when investment does not exist", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue(null);

      await expect(
        service.addOperation("user-1", "inv-999", {
          investmentId: "inv-999",
          type: "buy",
          quantity: 10,
          price: 100,
          date: "2024-01-15",
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-999", {
          investmentId: "inv-999",
          type: "buy",
          quantity: 10,
          price: 100,
          date: "2024-01-15",
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("NOT_FOUND");
      }
    });

    it("should throw FORBIDDEN when user does not own investment", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "other-user",
        operations: [],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 100,
          date: "2024-01-15",
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 100,
          date: "2024-01-15",
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("FORBIDDEN");
      }
    });

    it("should throw INVALID_DATE for future dates", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        operations: [],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 100,
          date: futureDate.toISOString(),
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 100,
          date: futureDate.toISOString(),
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("INVALID_DATE");
      }
    });

    it("should throw INVALID_DATE for date before last operation", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        operations: [{ date: new Date("2024-02-01") }],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 100,
          date: "2024-01-15", // Before last operation
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 100,
          date: "2024-01-15",
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("INVALID_DATE");
      }
    });
  });

  describe("addOperation - dividend", () => {
    it("should throw VALIDATION_ERROR when dividend total is missing", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        name: "PETR4",
        ticker: "PETR4",
        operations: [],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "dividend",
          date: "2024-01-15",
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "dividend",
          date: "2024-01-15",
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("VALIDATION_ERROR");
        expect((error as InvestmentOperationError).message).toContain("dividendo");
      }
    });

    it("should throw VALIDATION_ERROR when dividend total is zero or negative", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        name: "PETR4",
        ticker: "PETR4",
        operations: [],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "dividend",
          total: 0,
          date: "2024-01-15",
        })
      ).rejects.toThrow(InvestmentOperationError);
    });
  });

  describe("addOperation - buy/sell validation", () => {
    it("should throw VALIDATION_ERROR when price is missing for buy", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        quantity: 0,
        operations: [],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 0,
          date: "2024-01-15",
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 0,
          date: "2024-01-15",
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw INSUFFICIENT_QUANTITY when selling more than available", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        quantity: 5,
        averagePrice: 100,
        currentPrice: 110,
        totalInvested: 500,
        currentValue: 550,
        operations: [],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "sell",
          quantity: 10, // More than available (5)
          price: 110,
          date: "2024-01-15",
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "sell",
          quantity: 10,
          price: 110,
          date: "2024-01-15",
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("INSUFFICIENT_QUANTITY");
      }
    });

    it("should throw INSUFFICIENT_BALANCE when balance is not enough for buy", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        quantity: 0,
        averagePrice: 0,
        currentPrice: 0,
        totalInvested: 0,
        currentValue: 0,
        operations: [],
      } as never);

      await expect(
        service.addOperation(
          "user-1",
          "inv-1",
          {
            investmentId: "inv-1",
            type: "buy",
            quantity: 10,
            price: 100,
            date: "2024-01-15",
          },
          {
            availableBalance: 500, // Less than needed (10 * 100 = 1000)
            skipBalanceCheck: false,
          }
        )
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation(
          "user-1",
          "inv-1",
          {
            investmentId: "inv-1",
            type: "buy",
            quantity: 10,
            price: 100,
            date: "2024-01-15",
          },
          { availableBalance: 500 }
        );
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("INSUFFICIENT_BALANCE");
        expect((error as InvestmentOperationError).details).toEqual({
          availableBalance: 500,
          required: 1000,
        });
      }
    });

    it("should skip balance check when skipBalanceCheck is true", async () => {
      const mockOperation = { id: "op-1", type: "buy" };
      const mockInvestment = {
        id: "inv-1",
        userId: "user-1",
        type: "stock",
        quantity: 0,
        averagePrice: 0,
        currentPrice: 0,
        totalInvested: 0,
        currentValue: 0,
        operations: [],
      };

      vi.mocked(prisma.investment.findUnique).mockResolvedValue(mockInvestment as never);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          operation: { create: vi.fn().mockResolvedValue(mockOperation) },
          transaction: { create: vi.fn() },
          investment: {
            update: vi.fn().mockResolvedValue({ ...mockInvestment, quantity: 10 }),
            findUnique: vi.fn().mockResolvedValue({ ...mockInvestment, quantity: 10 }),
          },
        };
        // Cast to unknown first to avoid type checking the partial mock
        return callback(tx as unknown as Parameters<typeof callback>[0]);
      });

      // Should not throw even with low balance when skipBalanceCheck is true
      const result = await service.addOperation(
        "user-1",
        "inv-1",
        {
          investmentId: "inv-1",
          type: "buy",
          quantity: 10,
          price: 100,
          date: "2024-01-15",
          skipBalanceCheck: true,
        },
        { availableBalance: 0, skipBalanceCheck: true }
      );

      expect(result).toBeDefined();
    });
  });

  describe("addOperation - fixed income", () => {
    it("should throw INSUFFICIENT_BALANCE for fixed income sell exceeding current value", async () => {
      vi.mocked(prisma.investment.findUnique).mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
        type: "cdb",
        quantity: 1,
        averagePrice: 5000,
        currentPrice: 5200,
        totalInvested: 5000,
        currentValue: 5200,
        indexer: "CDI",
        interestRate: 100,
        operations: [],
      } as never);

      await expect(
        service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "sell",
          price: 6000, // More than currentValue (5200)
          date: "2024-01-15",
        })
      ).rejects.toThrow(InvestmentOperationError);

      try {
        await service.addOperation("user-1", "inv-1", {
          investmentId: "inv-1",
          type: "sell",
          price: 6000,
          date: "2024-01-15",
        });
      } catch (error) {
        expect((error as InvestmentOperationError).code).toBe("INSUFFICIENT_BALANCE");
      }
    });
  });
});

describe("InvestmentOperationError", () => {
  it("should create error with message and code", () => {
    const error = new InvestmentOperationError("Test error", "NOT_FOUND");

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("InvestmentOperationError");
  });

  it("should create error with details", () => {
    const error = new InvestmentOperationError("Balance error", "INSUFFICIENT_BALANCE", {
      availableBalance: 100,
      required: 500,
    });

    expect(error.code).toBe("INSUFFICIENT_BALANCE");
    expect(error.details).toEqual({
      availableBalance: 100,
      required: 500,
    });
  });
});
