/**
 * Credit Card DTOs
 *
 * Data Transfer Objects for credit card-related API operations.
 */

// ============================================
// Request DTOs
// ============================================

/**
 * Request body for creating a credit card.
 */
export interface CreateCardRequest {
  name: string;
  lastDigits: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

/**
 * Request body for updating a credit card.
 */
export interface UpdateCardRequest {
  name?: string;
  lastDigits?: string;
  brand?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  color?: string;
}

/**
 * Request body for creating a purchase.
 */
export interface CreatePurchaseRequest {
  description: string;
  value: number;
  category: string;
  date: string;
  installments?: number;
}

/**
 * Request body for updating an invoice.
 */
export interface UpdateInvoiceRequest {
  status?: "open" | "closed" | "paid" | "overdue";
  paidAmount?: number;
}

// ============================================
// Response DTOs
// ============================================

/**
 * Invoice status type.
 */
export type InvoiceStatus = "open" | "closed" | "paid" | "overdue";

/**
 * Purchase in API response.
 */
export interface PurchaseResponse {
  id: string;
  cardId: string;
  invoiceId: string;
  description: string;
  value: number;
  category: string;
  date: string;
  installments: number;
  currentInstallment: number;
  createdAt: string;
}

/**
 * Invoice in API response.
 */
export interface InvoiceResponse {
  id: string;
  cardId: string;
  month: number;
  year: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  closingDate: string;
  purchases?: PurchaseResponse[];
}

/**
 * Credit card in API response.
 */
export interface CardResponse {
  id: string;
  name: string;
  lastDigits: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  currentInvoice?: InvoiceResponse;
  invoices?: InvoiceResponse[];
}

/**
 * Card summary for list view.
 */
export interface CardSummaryResponse {
  totalLimit: number;
  totalUsed: number;
  available: number;
  usagePercent: number;
  currentInvoiceTotal: number;
  nextInvoiceTotal: number;
}

/**
 * Card list with summary.
 */
export interface CardListResponse {
  data: CardResponse[];
  summary: CardSummaryResponse;
}

/**
 * Invoice preview for chart.
 */
export interface InvoicePreviewItem {
  month: string;
  year: number;
  monthNum: number;
  total: number;
  status: InvoiceStatus;
  isPast: boolean;
  isCurrent: boolean;
}

// ============================================
// Transformers
// ============================================

/**
 * Transform a database purchase to API response format.
 */
export function toPurchaseResponse(purchase: {
  id: string;
  cardId: string;
  invoiceId: string;
  description: string;
  value: number;
  category: string;
  date: Date;
  installments: number;
  currentInstallment: number;
  createdAt: Date;
}): PurchaseResponse {
  return {
    id: purchase.id,
    cardId: purchase.cardId,
    invoiceId: purchase.invoiceId,
    description: purchase.description,
    value: purchase.value,
    category: purchase.category,
    date: purchase.date.toISOString(),
    installments: purchase.installments,
    currentInstallment: purchase.currentInstallment,
    createdAt: purchase.createdAt.toISOString(),
  };
}

/**
 * Transform a database invoice to API response format.
 */
export function toInvoiceResponse(invoice: {
  id: string;
  cardId: string;
  month: number;
  year: number;
  total: number;
  paidAmount: number;
  status: string;
  dueDate: Date;
  closingDate: Date;
  purchases?: Parameters<typeof toPurchaseResponse>[0][];
}): InvoiceResponse {
  return {
    id: invoice.id,
    cardId: invoice.cardId,
    month: invoice.month,
    year: invoice.year,
    total: invoice.total,
    paidAmount: invoice.paidAmount,
    status: invoice.status as InvoiceStatus,
    dueDate: invoice.dueDate.toISOString(),
    closingDate: invoice.closingDate.toISOString(),
    purchases: invoice.purchases?.map(toPurchaseResponse),
  };
}

/**
 * Transform a database card to API response format.
 */
export function toCardResponse(card: {
  id: string;
  name: string;
  lastDigits: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  invoices?: Parameters<typeof toInvoiceResponse>[0][];
}): CardResponse {
  const currentInvoice = card.invoices?.find(
    (inv) => inv.status === "open" || inv.status === "closed"
  );

  return {
    id: card.id,
    name: card.name,
    lastDigits: card.lastDigits,
    brand: card.brand,
    limit: card.limit,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    color: card.color,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    currentInvoice: currentInvoice ? toInvoiceResponse(currentInvoice) : undefined,
    invoices: card.invoices?.map(toInvoiceResponse),
  };
}
