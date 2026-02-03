import { z } from "zod";

// ============================================
// Enums e Constantes
// ============================================

export const transactionTypeSchema = z.enum(["income", "expense"]);

export const investmentTypeSchema = z.enum([
  "stock",
  "fii",
  "etf",
  "crypto",
  "cdb",
  "treasury",
  "lci_lca",
  "savings",
  "other",
]);

export const operationTypeSchema = z.enum([
  "buy",
  "sell",
  "deposit",
  "withdraw",
  "dividend",
]);

export const indexerTypeSchema = z.enum([
  "CDI",
  "IPCA",
  "SELIC",
  "PREFIXADO",
  "NA",
]);

export const goalTypeSchema = z.enum([
  "emergency",
  "travel",
  "car",
  "house",
  "education",
  "retirement",
  "other",
]);

// ============================================
// Transaction Schemas
// ============================================

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  value: z.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  date: z.string().min(1, "Data é obrigatória"),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// ============================================
// Category Schemas
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: transactionTypeSchema,
  icon: z.string().min(1, "Ícone é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// Investment Schemas
// ============================================

export const createInvestmentSchema = z.object({
  type: investmentTypeSchema,
  name: z.string().min(1, "Nome é obrigatório"),
  ticker: z.string().optional(),
  institution: z.string().optional(),
  goalValue: z.number().positive().optional(),
  notes: z.string().optional(),
  interestRate: z.number().optional(),
  indexer: indexerTypeSchema.optional(),
  maturityDate: z.string().optional(),
  initialDeposit: z.number().positive().optional(),
  depositDate: z.string().optional(),
  skipBalanceCheck: z.boolean().optional(),
});

export const updateInvestmentSchema = z.object({
  name: z.string().min(1).optional(),
  ticker: z.string().optional(),
  institution: z.string().optional(),
  currentPrice: z.number().optional(),
  currentValue: z.number().optional(),
  totalInvested: z.number().optional(),
  goalValue: z.number().positive().nullable().optional(),
  notes: z.string().optional(),
  interestRate: z.number().nullable().optional(),
  indexer: indexerTypeSchema.nullable().optional(),
  maturityDate: z.string().nullable().optional(),
  noMaturity: z.boolean().optional(),
});

// ============================================
// Operation Schemas
// ============================================

export const createOperationSchema = z.object({
  investmentId: z.string().min(1, "ID do investimento é obrigatório"),
  type: operationTypeSchema,
  quantity: z.number().positive().optional(),
  price: z.number().positive().optional(),
  total: z.number().positive().optional(),
  date: z.string().min(1, "Data é obrigatória"),
  fees: z.number().min(0).optional(),
  notes: z.string().optional(),
  skipBalanceCheck: z.boolean().optional(),
});

// ============================================
// Goal Schemas
// ============================================

export const createGoalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: goalTypeSchema,
  targetValue: z.number().positive("Valor alvo deve ser positivo"),
  currentValue: z.number().min(0).optional().default(0),
  deadline: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const createGoalContributionSchema = z.object({
  goalId: z.string().min(1, "ID da meta é obrigatório"),
  value: z.number().positive("Valor deve ser positivo"),
  date: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// Budget Schemas
// ============================================

export const createBudgetSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  limit: z.number().positive("Limite deve ser positivo"),
  period: z.enum(["monthly", "fixed"]).optional().default("monthly"),
});

export const updateBudgetSchema = createBudgetSchema.partial();

// ============================================
// Recurring Expense Schemas
// ============================================

export const createRecurringExpenseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  value: z.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  dueDay: z.number().min(1).max(31, "Dia deve estar entre 1 e 31"),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial();

// ============================================
// Credit Card Schemas
// ============================================

export const createCreditCardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  lastDigits: z.string().length(4, "Últimos 4 dígitos são obrigatórios"),
  brand: z.string().min(1, "Bandeira é obrigatória"),
  limit: z.number().positive("Limite deve ser positivo"),
  closingDay: z.number().min(1).max(31, "Dia de fechamento deve estar entre 1 e 31"),
  dueDay: z.number().min(1).max(31, "Dia de vencimento deve estar entre 1 e 31"),
  color: z.string().optional(),
});

export const updateCreditCardSchema = createCreditCardSchema.partial();

export const createPurchaseSchema = z.object({
  cardId: z.string().min(1, "ID do cartão é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  installments: z.number().min(1).max(48).optional().default(1),
});

// ============================================
// Type Exports (inferidos dos schemas)
// ============================================

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export type InvestmentType = z.infer<typeof investmentTypeSchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;

export type OperationType = z.infer<typeof operationTypeSchema>;
export type CreateOperationInput = z.infer<typeof createOperationSchema>;

export type GoalType = z.infer<typeof goalTypeSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateGoalContributionInput = z.infer<typeof createGoalContributionSchema>;

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ============================================
// Template Schemas
// ============================================

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: transactionTypeSchema,
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// ============================================
// User Profile & Preferences Schemas
// ============================================

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  image: z.string().nullable().optional(),
});

export const updatePreferencesSchema = z.object({
  general: z.object({
    defaultPage: z.enum(["dashboard", "cards", "investments"]).optional(),
    defaultPeriod: z.enum(["week", "month", "quarter", "year"]).optional(),
    defaultSort: z.enum(["recent", "oldest", "highest", "lowest"]).optional(),
    confirmBeforeDelete: z.boolean().optional(),
  }).optional(),
  notifications: z.object({
    budgetAlerts: z.boolean().optional(),
    budgetThreshold: z.number().min(0).max(100).optional(),
    billReminders: z.boolean().optional(),
    reminderDays: z.number().min(1).max(30).optional(),
    weeklyReport: z.boolean().optional(),
    monthlyReport: z.boolean().optional(),
    sounds: z.boolean().optional(),
    vibration: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    hideValues: z.boolean().optional(),
    autoLock: z.boolean().optional(),
    autoLockTime: z.number().min(1).max(60).optional(),
  }).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ============================================
// Invoice Schemas
// ============================================

export const invoiceStatusSchema = z.enum(["open", "closed", "paid", "overdue"]);

export const updateInvoiceSchema = z.object({
  status: invoiceStatusSchema.optional(),
  paidAmount: z.number().min(0).optional(),
});

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// ============================================
// Helpers para validação em API routes
// ============================================

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodIssue[] } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || "Dados inválidos",
      details: result.error.issues,
    };
  }

  return { success: true, data: result.data };
}
