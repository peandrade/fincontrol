import { describe, it, expect } from "vitest";
import {
  createTransactionSchema,
  createInvestmentSchema,
  createCreditCardSchema,
  validateBody,
} from "@/lib/schemas";

describe("Schemas Validation", () => {
  describe("createTransactionSchema", () => {
    it("should validate valid income transaction", () => {
      const data = {
        type: "income",
        value: 1000,
        category: "Salário",
        date: "2024-01-15",
      };

      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate valid expense transaction", () => {
      const data = {
        type: "expense",
        value: 50.5,
        category: "Alimentação",
        description: "Almoço",
        date: "2024-01-15",
      };

      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const data = {
        type: "invalid",
        value: 100,
        category: "Test",
        date: "2024-01-15",
      };

      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject negative value", () => {
      const data = {
        type: "income",
        value: -100,
        category: "Test",
        date: "2024-01-15",
      };

      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject zero value", () => {
      const data = {
        type: "income",
        value: 0,
        category: "Test",
        date: "2024-01-15",
      };

      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty category", () => {
      const data = {
        type: "income",
        value: 100,
        category: "",
        date: "2024-01-15",
      };

      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty date", () => {
      const data = {
        type: "income",
        value: 100,
        category: "Test",
        date: "",
      };

      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("createInvestmentSchema", () => {
    it("should validate valid stock investment", () => {
      const data = {
        type: "stock",
        name: "Petrobras",
        ticker: "PETR4",
      };

      const result = createInvestmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate valid CDB investment", () => {
      const data = {
        type: "cdb",
        name: "CDB Banco XYZ",
        institution: "Banco XYZ",
        interestRate: 110,
        indexer: "CDI",
        initialDeposit: 5000,
        depositDate: "2024-01-15",
      };

      const result = createInvestmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid investment type", () => {
      const data = {
        type: "invalid",
        name: "Test",
      };

      const result = createInvestmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const data = {
        type: "stock",
        name: "",
      };

      const result = createInvestmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("createCreditCardSchema", () => {
    it("should validate valid credit card", () => {
      const data = {
        name: "Nubank",
        closingDay: 15,
        dueDay: 22,
        limit: 5000,
        lastDigits: "1234",
        brand: "Mastercard",
        color: "#8B5CF6",
      };

      const result = createCreditCardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate credit card without optional fields", () => {
      const data = {
        name: "Itaú",
        closingDay: 10,
        dueDay: 17,
        limit: 3000,
        lastDigits: "5678",
        brand: "Visa",
      };

      const result = createCreditCardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid closing day (< 1)", () => {
      const data = {
        name: "Test",
        closingDay: 0,
        dueDay: 15,
        limit: 1000,
        lastDigits: "1234",
        brand: "Mastercard",
      };

      const result = createCreditCardSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid closing day (> 31)", () => {
      const data = {
        name: "Test",
        closingDay: 32,
        dueDay: 15,
        limit: 1000,
        lastDigits: "1234",
        brand: "Mastercard",
      };

      const result = createCreditCardSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject negative limit", () => {
      const data = {
        name: "Test",
        closingDay: 10,
        dueDay: 17,
        limit: -1000,
        lastDigits: "1234",
        brand: "Mastercard",
      };

      const result = createCreditCardSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("validateBody", () => {
    it("should return success with parsed data on valid input", () => {
      const result = validateBody(createTransactionSchema, {
        type: "income",
        value: 1000,
        category: "Salário",
        date: "2024-01-15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("income");
        expect(result.data.value).toBe(1000);
      }
    });

    it("should return error message on invalid input", () => {
      const result = validateBody(createTransactionSchema, {
        type: "invalid",
        value: -100,
        category: "",
        date: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe("string");
      }
    });
  });
});
