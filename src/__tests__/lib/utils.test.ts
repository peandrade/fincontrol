import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatCurrencyCompact,
  getCurrencySymbol,
  convertToBRL,
  convertFromBRL,
  formatDate,
  formatDateForInput,
  parseDateFromDB,
  formatDateFromDB,
  calculatePercentage,
  generateId,
  getErrorMessage,
  formatDateKey,
  formatMonthKey,
  formatDayMonth,
} from "@/lib/utils";

describe("Utils", () => {
  describe("cn (className merger)", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("should merge tailwind classes correctly", () => {
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should handle arrays", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });
  });

  describe("formatCurrency", () => {
    it("should format BRL currency by default", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("R$");
      expect(result).toContain("1.234,56");
    });

    it("should format USD currency", () => {
      const result = formatCurrency(1234.56, { currency: "USD", rate: 0.2 });
      expect(result).toContain("$");
    });

    it("should format EUR currency", () => {
      const result = formatCurrency(1234.56, { currency: "EUR", rate: 0.18 });
      expect(result).toContain("€");
    });

    it("should format GBP currency", () => {
      const result = formatCurrency(1234.56, { currency: "GBP", rate: 0.15 });
      expect(result).toContain("£");
    });

    it("should handle zero value", () => {
      const result = formatCurrency(0);
      expect(result).toContain("R$");
      expect(result).toContain("0,00");
    });

    it("should handle negative values", () => {
      const result = formatCurrency(-500);
      expect(result).toContain("-");
      expect(result).toContain("500");
    });

    it("should apply rate conversion for non-BRL", () => {
      // 1000 BRL * 0.2 rate = 200 USD
      const result = formatCurrency(1000, { currency: "USD", rate: 0.2 });
      expect(result).toContain("200");
    });
  });

  describe("formatCurrencyCompact", () => {
    it("should format values >= 1M with M suffix", () => {
      const result = formatCurrencyCompact(1500000);
      expect(result).toBe("R$ 1.5M");
    });

    it("should format values >= 1000 with k suffix", () => {
      const result = formatCurrencyCompact(1500);
      expect(result).toBe("R$ 1.5k");
    });

    it("should format values < 1000 normally", () => {
      const result = formatCurrencyCompact(500);
      expect(result).toContain("R$");
      expect(result).toContain("500");
    });

    it("should handle negative values with M suffix", () => {
      const result = formatCurrencyCompact(-2000000);
      expect(result).toBe("-R$ 2.0M");
    });

    it("should handle negative values with k suffix", () => {
      const result = formatCurrencyCompact(-2500);
      expect(result).toBe("-R$ 2.5k");
    });
  });

  describe("getCurrencySymbol", () => {
    it("should return R$ for BRL", () => {
      expect(getCurrencySymbol("BRL")).toBe("R$");
    });

    it("should return $ for USD", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
    });

    it("should return € for EUR", () => {
      expect(getCurrencySymbol("EUR")).toBe("€");
    });

    it("should return £ for GBP", () => {
      expect(getCurrencySymbol("GBP")).toBe("£");
    });
  });

  describe("convertToBRL", () => {
    it("should convert value using rate", () => {
      // 200 USD / 0.2 rate = 1000 BRL
      expect(convertToBRL(200, 0.2)).toBe(1000);
    });

    it("should return same value when rate is 1", () => {
      expect(convertToBRL(100, 1)).toBe(100);
    });

    it("should return same value when rate is 0", () => {
      expect(convertToBRL(100, 0)).toBe(100);
    });
  });

  describe("convertFromBRL", () => {
    it("should convert value using rate", () => {
      // 1000 BRL * 0.2 rate = 200 USD
      expect(convertFromBRL(1000, 0.2)).toBe(200);
    });

    it("should return same value when rate is 1", () => {
      expect(convertFromBRL(100, 1)).toBe(100);
    });

    it("should return same value when rate is 0", () => {
      expect(convertFromBRL(100, 0)).toBe(100);
    });
  });

  describe("formatDate", () => {
    it("should format Date object to pt-BR format", () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      const result = formatDate(date);
      expect(result).toBe("15/01/2024");
    });

    it("should format date string to pt-BR format", () => {
      // Note: "2024-01-15" without time is interpreted as UTC midnight,
      // which may show as 14/01 in negative timezone offsets
      const result = formatDate("2024-01-15T12:00:00");
      expect(result).toContain("15");
      expect(result).toContain("01");
      expect(result).toContain("2024");
    });

    it("should use custom locale", () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, "en-US");
      expect(result).toBe("1/15/2024");
    });
  });

  describe("formatDateForInput", () => {
    it("should format date to YYYY-MM-DD for input fields", () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDateForInput(date)).toBe("2024-01-15");
    });

    it("should pad single digit months and days", () => {
      const date = new Date(2024, 0, 5); // Jan 5, 2024
      expect(formatDateForInput(date)).toBe("2024-01-05");
    });
  });

  describe("parseDateFromDB", () => {
    it("should extract date part from ISO string", () => {
      expect(parseDateFromDB("2024-01-15T10:30:00.000Z")).toBe("2024-01-15");
    });

    it("should handle Date object", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(parseDateFromDB(date)).toBe("2024-01-15");
    });
  });

  describe("formatDateFromDB", () => {
    it("should format ISO date to DD/MM/YYYY", () => {
      expect(formatDateFromDB("2024-01-15T10:30:00.000Z")).toBe("15/01/2024");
    });

    it("should handle Date object", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(formatDateFromDB(date)).toBe("15/01/2024");
    });
  });

  describe("calculatePercentage", () => {
    it("should calculate percentage correctly", () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33); // rounded
      expect(calculatePercentage(2, 3)).toBe(67); // rounded
    });

    it("should return 0 when total is 0", () => {
      expect(calculatePercentage(100, 0)).toBe(0);
    });

    it("should handle 100% case", () => {
      expect(calculatePercentage(100, 100)).toBe(100);
    });

    it("should handle values > 100%", () => {
      expect(calculatePercentage(150, 100)).toBe(150);
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should contain timestamp", () => {
      const id = generateId();
      const timestamp = id.split("-")[0];
      expect(Number(timestamp)).toBeGreaterThan(0);
    });

    it("should have expected format", () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error instance", () => {
      const error = new Error("Something went wrong");
      expect(getErrorMessage(error)).toBe("Something went wrong");
    });

    it("should return string error as-is", () => {
      expect(getErrorMessage("Direct error message")).toBe("Direct error message");
    });

    it("should return default message for unknown types", () => {
      expect(getErrorMessage(null)).toBe("Erro desconhecido");
      expect(getErrorMessage(undefined)).toBe("Erro desconhecido");
      expect(getErrorMessage(123)).toBe("Erro desconhecido");
      expect(getErrorMessage({})).toBe("Erro desconhecido");
    });
  });

  describe("formatDateKey", () => {
    it("should format date to YYYY-MM-DD", () => {
      const date = new Date(2024, 0, 15);
      expect(formatDateKey(date)).toBe("2024-01-15");
    });

    it("should pad single digits", () => {
      const date = new Date(2024, 5, 5);
      expect(formatDateKey(date)).toBe("2024-06-05");
    });
  });

  describe("formatMonthKey", () => {
    it("should format date to YYYY-MM", () => {
      const date = new Date(2024, 0, 15);
      expect(formatMonthKey(date)).toBe("2024-01");
    });

    it("should pad single digit months", () => {
      const date = new Date(2024, 5, 15);
      expect(formatMonthKey(date)).toBe("2024-06");
    });
  });

  describe("formatDayMonth", () => {
    it("should format date to DD/MM", () => {
      const date = new Date(2024, 0, 15);
      expect(formatDayMonth(date)).toBe("15/01");
    });

    it("should pad single digits", () => {
      const date = new Date(2024, 5, 5);
      expect(formatDayMonth(date)).toBe("05/06");
    });
  });
});
