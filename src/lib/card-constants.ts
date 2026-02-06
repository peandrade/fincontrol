import type { InvoiceStatus } from "@/types/credit-card";

export const CARD_COLORS = [
  "#8B5CF6",
  "#F97316",
  "#000000",
  "#1E40AF",
  "#059669",
  "#DC2626",
  "#0891B2",
  "#CA8A04",
  "#7C3AED",
  "#64748B",
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  open: "Aberta",
  closed: "Fechada",
  paid: "Paga",
  overdue: "Vencida",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  open: "#3B82F6",
  closed: "#F59E0B",
  paid: "#10B981",
  overdue: "#EF4444",
};

export const PURCHASE_CATEGORIES = [
  "Alimentação",
  "Supermercado",
  "Restaurante",
  "Delivery",
  "Transporte",
  "Combustível",
  "Uber/99",
  "Streaming",
  "Assinaturas",
  "Compras Online",
  "Roupas",
  "Eletrônicos",
  "Saúde",
  "Farmácia",
  "Educação",
  "Lazer",
  "Viagem",
  "Casa",
  "Pets",
  "Outros",
] as const;

// Keys for translation (used for i18n)
export const PURCHASE_CATEGORY_KEYS = [
  "food",
  "supermarket",
  "restaurant",
  "delivery",
  "transport",
  "fuel",
  "rideshare",
  "streaming",
  "subscriptions",
  "onlineShopping",
  "clothing",
  "electronics",
  "health",
  "pharmacy",
  "education",
  "leisure",
  "travel",
  "home",
  "pets",
  "other",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#F59E0B",
  Supermercado: "#10B981",
  Restaurante: "#EC4899",
  Delivery: "#EF4444",
  Transporte: "#3B82F6",
  Combustível: "#6366F1",
  "Uber/99": "#8B5CF6",
  Streaming: "#A855F7",
  Assinaturas: "#7C3AED",
  "Compras Online": "#F97316",
  Roupas: "#E879F9",
  Eletrônicos: "#06B6D4",
  Saúde: "#14B8A6",
  Farmácia: "#22C55E",
  Educação: "#0EA5E9",
  Lazer: "#F472B6",
  Viagem: "#38BDF8",
  Casa: "#84CC16",
  Pets: "#FBBF24",
  Outros: "#64748B",
};

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const SHORT_MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || "";
}

export function getShortMonthName(month: number): string {
  return SHORT_MONTH_NAMES[month - 1] || "";
}

export function formatMonthYear(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`;
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  return INVOICE_STATUS_LABELS[status] || "Aberta";
}

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  return INVOICE_STATUS_COLORS[status] || INVOICE_STATUS_COLORS.open;
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS["Outros"];
}