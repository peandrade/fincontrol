import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Currency Types & Constants
// ============================================

export type DisplayCurrency = "BRL" | "USD" | "EUR" | "GBP";

const CURRENCY_CONFIG: Record<DisplayCurrency, { locale: string; symbol: string }> = {
  BRL: { locale: "pt-BR", symbol: "R$" },
  USD: { locale: "en-US", symbol: "$" },
  EUR: { locale: "de-DE", symbol: "€" },
  GBP: { locale: "en-GB", symbol: "£" },
};

export interface FormatCurrencyOptions {
  currency?: DisplayCurrency;
  rate?: number;
  locale?: string;
}

// ============================================
// Currency Formatting
// ============================================

export function formatCurrency(value: number, options?: FormatCurrencyOptions): string {
  const currency = options?.currency ?? "BRL";
  const rate = options?.rate ?? 1;
  const locale = options?.locale ?? CURRENCY_CONFIG[currency].locale;

  const converted = currency === "BRL" ? value : value * rate;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(converted);
}

/**
 * Format currency in compact form for mobile displays
 * e.g., R$ 1.234,56 -> R$ 1,2k
 */
export function formatCurrencyCompact(value: number, options?: FormatCurrencyOptions): string {
  const currency = options?.currency ?? "BRL";
  const rate = options?.rate ?? 1;
  const symbol = CURRENCY_CONFIG[currency].symbol;

  const converted = currency === "BRL" ? value : value * rate;
  const absValue = Math.abs(converted);
  const sign = converted < 0 ? "-" : "";

  if (absValue >= 1000000) {
    return `${sign}${symbol} ${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}${symbol} ${(absValue / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value, options);
}

// ============================================
// Currency Helpers
// ============================================

/**
 * Get the symbol for a display currency
 */
export function getCurrencySymbol(currency: DisplayCurrency): string {
  return CURRENCY_CONFIG[currency].symbol;
}

/**
 * Convert a value from display currency back to BRL
 * Used in forms: user enters value in display currency, we save in BRL
 */
export function convertToBRL(value: number, rate: number): number {
  if (rate === 0 || rate === 1) return value;
  return value / rate;
}

/**
 * Convert a BRL value to display currency
 */
export function convertFromBRL(value: number, rate: number): number {
  if (rate === 0 || rate === 1) return value;
  return value * rate;
}

export function formatDate(date: Date | string, locale?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale ?? "pt-BR").format(d);
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateFromDB(date: Date | string): string {
  const dateStr = typeof date === "string" ? date : date.toISOString();

  return dateStr.split("T")[0];
}

export function formatDateFromDB(date: Date | string): string {
  const dateStr = parseDateFromDB(date);
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Safely extract error message from unknown error type.
 * Use this instead of `error instanceof Error ? error.message : "Erro desconhecido"`
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Erro desconhecido";
}

/**
 * Format date to YYYY-MM-DD string (ISO format for keys/comparisons)
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date to YYYY-MM string (for monthly aggregations)
 */
export function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Format date to DD/MM string (for display in charts)
 */
export function formatDayMonth(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}