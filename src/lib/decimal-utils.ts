import { Prisma } from "@prisma/client";

/**
 * Safely convert a Prisma Decimal or any numeric value to a JavaScript number.
 *
 * @param value - The value to convert (Decimal, number, string, bigint, null, undefined)
 * @returns The numeric value, or 0 if conversion fails
 *
 * @example
 * // In API routes with raw SQL results
 * const total = toNumber(row.total); // Prisma.Decimal -> number
 *
 * // With null values
 * const balance = toNumber(result._sum.value); // null -> 0
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Handle Prisma Decimal
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  // Handle object with toNumber method (like Decimal.js)
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    const num = (value as { toNumber: () => number }).toNumber();
    return isNaN(num) ? 0 : num;
  }

  // Fallback: try to coerce to number
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Sum an array of values, converting each to a number first.
 *
 * @param values - Array of values to sum
 * @returns The sum of all values
 *
 * @example
 * const total = sumNumbers([row1.total, row2.total, row3.total]);
 */
export function sumNumbers(values: unknown[]): number {
  return values.reduce<number>((acc, val) => acc + toNumber(val), 0);
}

/**
 * Safely get the maximum value from an array, returning 0 for empty arrays.
 *
 * @param values - Array of numeric values
 * @returns The maximum value, or 0 if array is empty
 *
 * @example
 * const max = safeMax([100, 200, 50]); // 200
 * const empty = safeMax([]); // 0
 */
export function safeMax(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Safely get the minimum value from an array, returning 0 for empty arrays.
 *
 * @param values - Array of numeric values
 * @returns The minimum value, or 0 if array is empty
 */
export function safeMin(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}
