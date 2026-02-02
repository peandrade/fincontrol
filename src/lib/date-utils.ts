/**
 * Centralized date formatting utilities for the application.
 * All date formatting should go through these functions for consistency.
 */

/**
 * Format date for display in pt-BR locale.
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", options);
}

/**
 * Format date as "DD/MM/YYYY".
 */
export function formatDateShort(date: Date | string): string {
  return formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Format date as "DD de mês de YYYY" (e.g., "15 de janeiro de 2024").
 */
export function formatDateLong(date: Date | string): string {
  return formatDate(date, { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Format date as "mês de YYYY" (e.g., "janeiro de 2024").
 */
export function formatMonthYear(date: Date | string): string {
  return formatDate(date, { month: "long", year: "numeric" });
}

/**
 * Format date as "DD/MM" (e.g., "15/01").
 */
export function formatDayMonth(date: Date | string): string {
  return formatDate(date, { day: "2-digit", month: "2-digit" });
}

/**
 * Format date for input fields (YYYY-MM-DD).
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Format date relative to now (e.g., "hoje", "ontem", "há 3 dias").
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
}

/**
 * Get the start of the current month.
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of the current month.
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get the start of a specific period ago.
 */
export function getStartOfPeriod(period: "1w" | "1m" | "3m" | "6m" | "1y"): Date {
  const now = new Date();
  switch (period) {
    case "1w":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "1m":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6m":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return now;
  }
}

/**
 * Check if two dates are on the same day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is in the current month.
 */
export function isCurrentMonth(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/**
 * Get month name in Portuguese.
 */
export function getMonthName(month: number, short = false): string {
  const date = new Date(2024, month, 1);
  return date.toLocaleDateString("pt-BR", { month: short ? "short" : "long" });
}

/**
 * Get day of week name in Portuguese.
 */
export function getDayOfWeekName(date: Date | string, short = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { weekday: short ? "short" : "long" });
}
