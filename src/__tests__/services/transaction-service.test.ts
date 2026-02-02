import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionService, TransactionError } from "@/services/transaction-service";

// Mock the repository
vi.mock("@/repositories", () => ({
  transactionRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByUser: vi.fn(),
    findByUserPaginated: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getBalance: vi.fn(),
    getMonthlySummary: vi.fn(),
    getCategoryBreakdown: vi.fn(),
  },
}));

import { transactionRepository } from "@/repositories";

describe("TransactionService", () => {
  let service: TransactionService;

  beforeEach(() => {
    service = new TransactionService();
    vi.clearAllMocks();
  });

  describe("createTransaction", () => {
    it("should create a transaction with string date", async () => {
      const mockTransaction = {
        id: "1",
        type: "income",
        value: 1000,
        category: "Salário",
        description: "Monthly salary",
        date: new Date(2024, 0, 15, 12, 0, 0, 0),
        userId: "user-1",
      };

      vi.mocked(transactionRepository.create).mockResolvedValue(mockTransaction as never);

      const result = await service.createTransaction("user-1", {
        type: "income",
        value: 1000,
        category: "Salário",
        description: "Monthly salary",
        date: "2024-01-15",
      });

      expect(transactionRepository.create).toHaveBeenCalledWith({
        userId: "user-1",
        type: "income",
        value: 1000,
        category: "Salário",
        description: "Monthly salary",
        date: expect.any(Date),
      });

      expect(result).toEqual(mockTransaction);
    });

    it("should create a transaction with Date object", async () => {
      const mockTransaction = {
        id: "1",
        type: "expense",
        value: 50,
        category: "Alimentação",
        date: new Date(2024, 0, 15, 12, 0, 0, 0),
        userId: "user-1",
      };

      vi.mocked(transactionRepository.create).mockResolvedValue(mockTransaction as never);

      const result = await service.createTransaction("user-1", {
        type: "expense",
        value: 50,
        category: "Alimentação",
        date: new Date(2024, 0, 15),
      });

      expect(transactionRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it("should parse date to noon to avoid timezone issues", async () => {
      vi.mocked(transactionRepository.create).mockResolvedValue({} as never);

      await service.createTransaction("user-1", {
        type: "income",
        value: 100,
        category: "Test",
        date: "2024-06-20T00:00:00.000Z",
      });

      const createCall = vi.mocked(transactionRepository.create).mock.calls[0][0];
      const parsedDate = createCall.date;

      expect(parsedDate.getFullYear()).toBe(2024);
      expect(parsedDate.getMonth()).toBe(5); // June (0-indexed)
      expect(parsedDate.getDate()).toBe(20);
      expect(parsedDate.getHours()).toBe(12); // Noon
    });
  });

  describe("getTransaction", () => {
    it("should return transaction when found", async () => {
      const mockTransaction = {
        id: "1",
        type: "income",
        value: 1000,
        category: "Salário",
        userId: "user-1",
      };

      vi.mocked(transactionRepository.findById).mockResolvedValue(mockTransaction as never);

      const result = await service.getTransaction("user-1", "1");

      expect(transactionRepository.findById).toHaveBeenCalledWith("1", "user-1");
      expect(result).toEqual(mockTransaction);
    });

    it("should throw TransactionError when not found", async () => {
      vi.mocked(transactionRepository.findById).mockResolvedValue(null as never);

      await expect(service.getTransaction("user-1", "999")).rejects.toThrow(TransactionError);
      await expect(service.getTransaction("user-1", "999")).rejects.toThrow("Transação não encontrada");
    });

    it("should have NOT_FOUND error code when not found", async () => {
      vi.mocked(transactionRepository.findById).mockResolvedValue(null as never);

      try {
        await service.getTransaction("user-1", "999");
      } catch (error) {
        expect(error).toBeInstanceOf(TransactionError);
        expect((error as TransactionError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getTransactions", () => {
    it("should return all transactions with filters", async () => {
      const mockTransactions = [
        { id: "1", type: "income", value: 1000 },
        { id: "2", type: "expense", value: 50 },
      ];

      vi.mocked(transactionRepository.findByUser).mockResolvedValue(mockTransactions as never);

      const result = await service.getTransactions("user-1", { type: "income" });

      expect(transactionRepository.findByUser).toHaveBeenCalledWith("user-1", { type: "income" });
      expect(result).toEqual(mockTransactions);
    });
  });

  describe("getTransactionsPaginated", () => {
    it("should return paginated transactions", async () => {
      const mockResult = {
        data: [{ id: "1", type: "income", value: 1000 }],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 1,
          totalPages: 1,
          hasMore: false,
        },
      };

      vi.mocked(transactionRepository.findByUserPaginated).mockResolvedValue(mockResult as never);

      const result = await service.getTransactionsPaginated("user-1", { page: 1, pageSize: 50 });

      expect(transactionRepository.findByUserPaginated).toHaveBeenCalledWith("user-1", { page: 1, pageSize: 50 });
      expect(result).toEqual(mockResult);
    });
  });

  describe("updateTransaction", () => {
    it("should update transaction successfully", async () => {
      vi.mocked(transactionRepository.update).mockResolvedValue({ count: 1 } as never);
      vi.mocked(transactionRepository.findById).mockResolvedValue({
        id: "1",
        type: "expense",
        value: 200,
        category: "Updated",
      } as never);

      const result = await service.updateTransaction("user-1", "1", {
        value: 200,
        category: "Updated",
      });

      expect(transactionRepository.update).toHaveBeenCalledWith("1", "user-1", {
        value: 200,
        category: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should parse date string when updating", async () => {
      vi.mocked(transactionRepository.update).mockResolvedValue({ count: 1 } as never);
      vi.mocked(transactionRepository.findById).mockResolvedValue({ id: "1" } as never);

      await service.updateTransaction("user-1", "1", {
        date: "2024-03-15",
      });

      const updateCall = vi.mocked(transactionRepository.update).mock.calls[0][2];
      expect(updateCall.date).toBeInstanceOf(Date);
      expect(updateCall.date?.getFullYear()).toBe(2024);
      expect(updateCall.date?.getMonth()).toBe(2); // March
      expect(updateCall.date?.getDate()).toBe(15);
    });

    it("should throw TransactionError when not found", async () => {
      vi.mocked(transactionRepository.update).mockResolvedValue({ count: 0 } as never);

      await expect(service.updateTransaction("user-1", "999", { value: 100 })).rejects.toThrow(TransactionError);
    });
  });

  describe("deleteTransaction", () => {
    it("should delete transaction successfully", async () => {
      vi.mocked(transactionRepository.delete).mockResolvedValue({ count: 1 } as never);

      const result = await service.deleteTransaction("user-1", "1");

      expect(transactionRepository.delete).toHaveBeenCalledWith("1", "user-1");
      expect(result).toBe(true);
    });

    it("should throw TransactionError when not found", async () => {
      vi.mocked(transactionRepository.delete).mockResolvedValue({ count: 0 } as never);

      await expect(service.deleteTransaction("user-1", "999")).rejects.toThrow(TransactionError);
      await expect(service.deleteTransaction("user-1", "999")).rejects.toThrow("Transação não encontrada");
    });
  });

  describe("getBalance", () => {
    it("should return current balance", async () => {
      vi.mocked(transactionRepository.getBalance).mockResolvedValue(5000 as never);

      const result = await service.getBalance("user-1");

      expect(transactionRepository.getBalance).toHaveBeenCalledWith("user-1");
      expect(result).toBe(5000);
    });
  });

  describe("getMonthlySummaryWithComparison", () => {
    it("should return monthly comparison data", async () => {
      vi.mocked(transactionRepository.getMonthlySummary)
        .mockResolvedValueOnce({ income: 5000, expenses: 3000, balance: 2000, count: 10 } as never)
        .mockResolvedValueOnce({ income: 4000, expenses: 2500, balance: 1500, count: 8 } as never);

      const result = await service.getMonthlySummaryWithComparison("user-1", 2024, 2);

      expect(transactionRepository.getMonthlySummary).toHaveBeenCalledWith("user-1", 2024, 2);
      expect(transactionRepository.getMonthlySummary).toHaveBeenCalledWith("user-1", 2024, 1);

      expect(result.current).toEqual({ income: 5000, expenses: 3000, balance: 2000 });
      expect(result.previous).toEqual({ income: 4000, expenses: 2500, balance: 1500 });
      expect(result.change.income).toBe(1000);
      expect(result.change.expenses).toBe(500);
      expect(result.change.balance).toBe(500);
    });

    it("should handle year boundary (January)", async () => {
      vi.mocked(transactionRepository.getMonthlySummary)
        .mockResolvedValueOnce({ income: 5000, expenses: 3000, balance: 2000, count: 10 } as never)
        .mockResolvedValueOnce({ income: 4000, expenses: 2500, balance: 1500, count: 8 } as never);

      await service.getMonthlySummaryWithComparison("user-1", 2024, 1);

      // January should compare with December of previous year
      expect(transactionRepository.getMonthlySummary).toHaveBeenCalledWith("user-1", 2024, 1);
      expect(transactionRepository.getMonthlySummary).toHaveBeenCalledWith("user-1", 2023, 12);
    });

    it("should calculate percentage changes correctly", async () => {
      vi.mocked(transactionRepository.getMonthlySummary)
        .mockResolvedValueOnce({ income: 6000, expenses: 3000, balance: 3000, count: 10 } as never)
        .mockResolvedValueOnce({ income: 4000, expenses: 2000, balance: 2000, count: 8 } as never);

      const result = await service.getMonthlySummaryWithComparison("user-1", 2024, 2);

      expect(result.change.incomePercent).toBe(50); // (6000-4000)/4000 * 100 = 50%
      expect(result.change.expensePercent).toBe(50); // (3000-2000)/2000 * 100 = 50%
    });

    it("should handle zero previous values", async () => {
      vi.mocked(transactionRepository.getMonthlySummary)
        .mockResolvedValueOnce({ income: 5000, expenses: 3000, balance: 2000, count: 10 } as never)
        .mockResolvedValueOnce({ income: 0, expenses: 0, balance: 0, count: 0 } as never);

      const result = await service.getMonthlySummaryWithComparison("user-1", 2024, 2);

      expect(result.change.incomePercent).toBe(0);
      expect(result.change.expensePercent).toBe(0);
    });
  });

  describe("getCategoryBreakdown", () => {
    it("should return category breakdown with percentages", async () => {
      vi.mocked(transactionRepository.getCategoryBreakdown).mockResolvedValue([
        { category: "Alimentação", _sum: { value: 500 }, _count: 10 },
        { category: "Transporte", _sum: { value: 300 }, _count: 5 },
        { category: "Lazer", _sum: { value: 200 }, _count: 3 },
      ] as never);

      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 0, 31);

      const result = await service.getCategoryBreakdown("user-1", startDate, endDate, "expense");

      expect(transactionRepository.getCategoryBreakdown).toHaveBeenCalledWith(
        "user-1",
        "expense",
        startDate,
        endDate
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        category: "Alimentação",
        value: 500,
        count: 10,
        percentage: 50, // 500/1000 * 100
      });
      expect(result[1].percentage).toBe(30);
      expect(result[2].percentage).toBe(20);
    });
  });

  describe("getSavingsRate", () => {
    it("should calculate savings rate correctly", async () => {
      vi.mocked(transactionRepository.getMonthlySummary).mockResolvedValue({
        income: 5000,
        expenses: 3000,
        balance: 2000,
        count: 15,
      } as never);

      const result = await service.getSavingsRate("user-1", 2024, 2);

      expect(result.income).toBe(5000);
      expect(result.expenses).toBe(3000);
      expect(result.savings).toBe(2000);
      expect(result.rate).toBe(40); // (5000-3000)/5000 * 100 = 40%
    });

    it("should return 0% savings rate when no income", async () => {
      vi.mocked(transactionRepository.getMonthlySummary).mockResolvedValue({
        income: 0,
        expenses: 100,
        balance: -100,
        count: 2,
      } as never);

      const result = await service.getSavingsRate("user-1", 2024, 2);

      expect(result.rate).toBe(0);
    });
  });
});
