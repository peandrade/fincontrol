import ExcelJS from "exceljs";
import { z } from "zod";
import {
  TRANSACTION_TYPE_MAP,
  INVESTMENT_TYPE_MAP,
  GOAL_CATEGORY_MAP,
  INDEXER_OPTIONS,
} from "./excel-template";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./constants";
import type { InvestmentType, IndexerType } from "@/types";
import type { GoalCategoryType } from "./constants";

// ── Types ──

export interface ParsedRow<T> {
  rowNumber: number;
  data: T | null;
  errors: string[];
  raw: Record<string, unknown>;
}

export interface SheetResult<T> {
  valid: ParsedRow<T>[];
  invalid: ParsedRow<T>[];
  total: number;
}

export interface ImportPreview {
  transactions: SheetResult<ParsedTransaction>;
  investments: SheetResult<ParsedInvestment>;
  budgets: SheetResult<ParsedBudget>;
  goals: SheetResult<ParsedGoal>;
  recurringExpenses: SheetResult<ParsedRecurringExpense>;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    hasErrors: boolean;
  };
}

export interface ParsedTransaction {
  type: "income" | "expense";
  value: number;
  category: string;
  description: string | null;
  date: string; // ISO string
}

export interface ParsedInvestment {
  type: InvestmentType;
  name: string;
  ticker: string | null;
  institution: string | null;
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  currentValue: number;
  interestRate: number | null;
  indexer: string | null;
  maturityDate: string | null; // ISO string
}

export interface ParsedBudget {
  category: string;
  limit: number;
  month: number;
  year: number;
}

export interface ParsedGoal {
  name: string;
  description: string | null;
  category: GoalCategoryType;
  targetValue: number;
  currentValue: number;
  targetDate: string | null; // ISO string
  color: string | null;
}

export interface ParsedRecurringExpense {
  description: string;
  value: number;
  category: string;
  dueDay: number;
  isActive: boolean;
  notes: string | null;
}

// ── Helpers ──

const allCategories: string[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES.filter(
    (c) => !(EXPENSE_CATEGORIES as readonly string[]).includes(c)
  ),
];

function parseBRNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return val;
  const str = String(val).trim();
  // Brazilian format: 1.500,50 → 1500.50
  const normalized = str.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function parseDateValue(val: unknown): Date | null {
  if (val === null || val === undefined || val === "") return null;

  // Excel serial number
  if (typeof val === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }

  // Date object from exceljs
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // String DD/MM/YYYY
  const str = String(val).trim();
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // Try ISO format
  const isoDate = new Date(str);
  return isNaN(isoDate.getTime()) ? null : isoDate;
}

function cellValue(row: ExcelJS.Row, col: number): unknown {
  const cell = row.getCell(col);
  if (cell.value === null || cell.value === undefined) return null;
  // Handle rich text
  if (typeof cell.value === "object" && "richText" in cell.value) {
    return (cell.value as ExcelJS.CellRichTextValue).richText
      .map((rt) => rt.text)
      .join("");
  }
  // Handle formula results
  if (typeof cell.value === "object" && "result" in cell.value) {
    return (cell.value as ExcelJS.CellFormulaValue).result;
  }
  return cell.value;
}

function isRowEmpty(row: ExcelJS.Row, colCount: number): boolean {
  for (let i = 1; i <= colCount; i++) {
    const val = cellValue(row, i);
    if (val !== null && val !== undefined && String(val).trim() !== "") return false;
  }
  return true;
}

function strVal(val: unknown): string | null {
  if (val === null || val === undefined || String(val).trim() === "") return null;
  return String(val).trim();
}

// ── Zod Schemas ──

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  value: z.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().nullable(),
  date: z.string().min(1, "Data é obrigatória"),
});

const investmentSchema = z.object({
  type: z.string().min(1, "Tipo é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  ticker: z.string().nullable(),
  institution: z.string().nullable(),
  quantity: z.number().min(0, "Quantidade deve ser >= 0"),
  averagePrice: z.number().min(0, "Preço médio deve ser >= 0"),
  totalInvested: z.number().min(0, "Total investido deve ser >= 0"),
  currentValue: z.number().min(0, "Valor atual deve ser >= 0"),
  interestRate: z.number().nullable(),
  indexer: z.string().nullable(),
  maturityDate: z.string().nullable(),
});

const budgetSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  limit: z.number().positive("Limite deve ser positivo"),
  month: z.number().int().min(0).max(12),
  year: z.number().int().min(0),
});

const goalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().nullable(),
  category: z.string().min(1, "Categoria é obrigatória"),
  targetValue: z.number().positive("Valor alvo deve ser positivo"),
  currentValue: z.number().min(0, "Valor atual deve ser >= 0"),
  targetDate: z.string().nullable(),
  color: z.string().nullable(),
});

const recurringExpenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  dueDay: z.number().int().min(1).max(31),
  isActive: z.boolean(),
  notes: z.string().nullable(),
});

// ── Sheet Parsers ──

function parseTransactionsSheet(sheet: ExcelJS.Worksheet): SheetResult<ParsedTransaction> {
  const valid: ParsedRow<ParsedTransaction>[] = [];
  const invalid: ParsedRow<ParsedTransaction>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    if (isRowEmpty(row, 5)) return;

    const raw: Record<string, unknown> = {
      tipo: cellValue(row, 1),
      valor: cellValue(row, 2),
      categoria: cellValue(row, 3),
      descricao: cellValue(row, 4),
      data: cellValue(row, 5),
    };

    const errors: string[] = [];

    // Map type
    const tipoStr = strVal(raw.tipo)?.toLowerCase();
    const type = tipoStr ? TRANSACTION_TYPE_MAP[tipoStr] : null;
    if (!type) errors.push(`Tipo inválido: "${raw.tipo}". Use: receita ou despesa`);

    // Parse value
    const value = parseBRNumber(raw.valor);
    if (value === null) errors.push(`Valor inválido: "${raw.valor}"`);

    // Category
    const category = strVal(raw.categoria);
    if (category && !allCategories.includes(category)) {
      errors.push(`Categoria desconhecida: "${category}"`);
    }

    // Date
    const dateObj = parseDateValue(raw.data);
    if (!dateObj) errors.push(`Data inválida: "${raw.data}". Use DD/MM/AAAA`);

    const parsed = {
      type: (type as "income" | "expense") || "expense",
      value: value ?? 0,
      category: category || "",
      description: strVal(raw.descricao),
      date: dateObj?.toISOString() || "",
    };

    const result = transactionSchema.safeParse(parsed);
    if (errors.length === 0 && result.success) {
      valid.push({ rowNumber, data: parsed, errors: [], raw });
    } else {
      const zodErrors = !result.success
        ? result.error.issues.map((i) => i.message)
        : [];
      invalid.push({
        rowNumber,
        data: null,
        errors: [...errors, ...zodErrors],
        raw,
      });
    }
  });

  return { valid, invalid, total: valid.length + invalid.length };
}

function parseInvestmentsSheet(sheet: ExcelJS.Worksheet): SheetResult<ParsedInvestment> {
  const valid: ParsedRow<ParsedInvestment>[] = [];
  const invalid: ParsedRow<ParsedInvestment>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (isRowEmpty(row, 11)) return;

    const raw: Record<string, unknown> = {
      tipo: cellValue(row, 1),
      nome: cellValue(row, 2),
      ticker: cellValue(row, 3),
      instituicao: cellValue(row, 4),
      quantidade: cellValue(row, 5),
      precoMedio: cellValue(row, 6),
      totalInvestido: cellValue(row, 7),
      valorAtual: cellValue(row, 8),
      taxaJuros: cellValue(row, 9),
      indexador: cellValue(row, 10),
      vencimento: cellValue(row, 11),
    };

    const errors: string[] = [];

    // Map investment type
    const tipoStr = strVal(raw.tipo);
    const type = tipoStr ? INVESTMENT_TYPE_MAP[tipoStr] : null;
    if (!type) errors.push(`Tipo inválido: "${raw.tipo}"`);

    const name = strVal(raw.nome);
    if (!name) errors.push("Nome é obrigatório");

    const quantity = parseBRNumber(raw.quantidade) ?? 0;
    const averagePrice = parseBRNumber(raw.precoMedio) ?? 0;
    const totalInvested = parseBRNumber(raw.totalInvestido) ?? 0;
    const currentValue = parseBRNumber(raw.valorAtual) ?? 0;
    const interestRate = parseBRNumber(raw.taxaJuros);

    const indexerStr = strVal(raw.indexador);
    if (indexerStr && !INDEXER_OPTIONS.includes(indexerStr)) {
      errors.push(`Indexador inválido: "${indexerStr}". Use: ${INDEXER_OPTIONS.join(", ")}`);
    }

    const maturityDateObj = parseDateValue(raw.vencimento);

    const parsed: ParsedInvestment = {
      type: (type as InvestmentType) || "other",
      name: name || "",
      ticker: strVal(raw.ticker),
      institution: strVal(raw.instituicao),
      quantity,
      averagePrice,
      totalInvested,
      currentValue,
      interestRate,
      indexer: indexerStr as IndexerType | null,
      maturityDate: maturityDateObj?.toISOString() || null,
    };

    const result = investmentSchema.safeParse(parsed);
    if (errors.length === 0 && result.success) {
      valid.push({ rowNumber, data: parsed, errors: [], raw });
    } else {
      const zodErrors = !result.success
        ? result.error.issues.map((i) => i.message)
        : [];
      invalid.push({ rowNumber, data: null, errors: [...errors, ...zodErrors], raw });
    }
  });

  return { valid, invalid, total: valid.length + invalid.length };
}

function parseBudgetsSheet(sheet: ExcelJS.Worksheet): SheetResult<ParsedBudget> {
  const valid: ParsedRow<ParsedBudget>[] = [];
  const invalid: ParsedRow<ParsedBudget>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (isRowEmpty(row, 4)) return;

    const raw: Record<string, unknown> = {
      categoria: cellValue(row, 1),
      limite: cellValue(row, 2),
      mes: cellValue(row, 3),
      ano: cellValue(row, 4),
    };

    const errors: string[] = [];

    const category = strVal(raw.categoria);
    if (category && !(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
      errors.push(`Categoria desconhecida: "${category}"`);
    }

    const limit = parseBRNumber(raw.limite);
    if (limit === null) errors.push(`Limite inválido: "${raw.limite}"`);

    const month = parseBRNumber(raw.mes) ?? 0;
    const year = parseBRNumber(raw.ano) ?? 0;

    const parsed: ParsedBudget = {
      category: category || "",
      limit: limit ?? 0,
      month: Math.round(month),
      year: Math.round(year),
    };

    const result = budgetSchema.safeParse(parsed);
    if (errors.length === 0 && result.success) {
      valid.push({ rowNumber, data: parsed, errors: [], raw });
    } else {
      const zodErrors = !result.success
        ? result.error.issues.map((i) => i.message)
        : [];
      invalid.push({ rowNumber, data: null, errors: [...errors, ...zodErrors], raw });
    }
  });

  return { valid, invalid, total: valid.length + invalid.length };
}

function parseGoalsSheet(sheet: ExcelJS.Worksheet): SheetResult<ParsedGoal> {
  const valid: ParsedRow<ParsedGoal>[] = [];
  const invalid: ParsedRow<ParsedGoal>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (isRowEmpty(row, 7)) return;

    const raw: Record<string, unknown> = {
      nome: cellValue(row, 1),
      descricao: cellValue(row, 2),
      categoria: cellValue(row, 3),
      valorAlvo: cellValue(row, 4),
      valorAtual: cellValue(row, 5),
      dataAlvo: cellValue(row, 6),
      cor: cellValue(row, 7),
    };

    const errors: string[] = [];

    const name = strVal(raw.nome);
    if (!name) errors.push("Nome é obrigatório");

    const catStr = strVal(raw.categoria);
    const category = catStr ? GOAL_CATEGORY_MAP[catStr] : null;
    if (catStr && !category) errors.push(`Categoria inválida: "${catStr}"`);

    const targetValue = parseBRNumber(raw.valorAlvo);
    if (targetValue === null) errors.push(`Valor alvo inválido: "${raw.valorAlvo}"`);

    const currentValue = parseBRNumber(raw.valorAtual) ?? 0;

    const targetDateObj = parseDateValue(raw.dataAlvo);

    const color = strVal(raw.cor);
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errors.push(`Cor inválida: "${color}". Use formato hex (#RRGGBB)`);
    }

    const parsed: ParsedGoal = {
      name: name || "",
      description: strVal(raw.descricao),
      category: (category as GoalCategoryType) || "other",
      targetValue: targetValue ?? 0,
      currentValue,
      targetDate: targetDateObj?.toISOString() || null,
      color,
    };

    const result = goalSchema.safeParse(parsed);
    if (errors.length === 0 && result.success) {
      valid.push({ rowNumber, data: parsed, errors: [], raw });
    } else {
      const zodErrors = !result.success
        ? result.error.issues.map((i) => i.message)
        : [];
      invalid.push({ rowNumber, data: null, errors: [...errors, ...zodErrors], raw });
    }
  });

  return { valid, invalid, total: valid.length + invalid.length };
}

function parseRecurringExpensesSheet(sheet: ExcelJS.Worksheet): SheetResult<ParsedRecurringExpense> {
  const valid: ParsedRow<ParsedRecurringExpense>[] = [];
  const invalid: ParsedRow<ParsedRecurringExpense>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (isRowEmpty(row, 6)) return;

    const raw: Record<string, unknown> = {
      descricao: cellValue(row, 1),
      valor: cellValue(row, 2),
      categoria: cellValue(row, 3),
      diaVencimento: cellValue(row, 4),
      ativa: cellValue(row, 5),
      observacoes: cellValue(row, 6),
    };

    const errors: string[] = [];

    const description = strVal(raw.descricao);
    if (!description) errors.push("Descrição é obrigatória");

    const value = parseBRNumber(raw.valor);
    if (value === null) errors.push(`Valor inválido: "${raw.valor}"`);

    const category = strVal(raw.categoria);
    if (category && !(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
      errors.push(`Categoria desconhecida: "${category}"`);
    }

    const dueDay = parseBRNumber(raw.diaVencimento);
    if (dueDay === null || dueDay < 1 || dueDay > 31) {
      errors.push(`Dia vencimento inválido: "${raw.diaVencimento}". Use 1–31`);
    }

    const ativaStr = strVal(raw.ativa)?.toLowerCase();
    const isActive = ativaStr === "não" || ativaStr === "nao" ? false : true;

    const parsed: ParsedRecurringExpense = {
      description: description || "",
      value: value ?? 0,
      category: category || "",
      dueDay: Math.round(dueDay ?? 1),
      isActive,
      notes: strVal(raw.observacoes),
    };

    const result = recurringExpenseSchema.safeParse(parsed);
    if (errors.length === 0 && result.success) {
      valid.push({ rowNumber, data: parsed, errors: [], raw });
    } else {
      const zodErrors = !result.success
        ? result.error.issues.map((i) => i.message)
        : [];
      invalid.push({ rowNumber, data: null, errors: [...errors, ...zodErrors], raw });
    }
  });

  return { valid, invalid, total: valid.length + invalid.length };
}

// ── Main Parser ──

export async function parseImportFile(buffer: ArrayBuffer | Buffer): Promise<ImportPreview> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ArrayBuffer);

  const txSheet = workbook.getWorksheet("Transações");
  const invSheet = workbook.getWorksheet("Investimentos");
  const budgetSheet = workbook.getWorksheet("Orçamentos");
  const goalSheet = workbook.getWorksheet("Metas");
  const recSheet = workbook.getWorksheet("Despesas Recorrentes");

  const emptyResult = <T>(): SheetResult<T> => ({ valid: [], invalid: [], total: 0 });

  const transactions = txSheet ? parseTransactionsSheet(txSheet) : emptyResult<ParsedTransaction>();
  const investments = invSheet ? parseInvestmentsSheet(invSheet) : emptyResult<ParsedInvestment>();
  const budgets = budgetSheet ? parseBudgetsSheet(budgetSheet) : emptyResult<ParsedBudget>();
  const goals = goalSheet ? parseGoalsSheet(goalSheet) : emptyResult<ParsedGoal>();
  const recurringExpenses = recSheet ? parseRecurringExpensesSheet(recSheet) : emptyResult<ParsedRecurringExpense>();

  const totalRows =
    transactions.total + investments.total + budgets.total + goals.total + recurringExpenses.total;
  const validRows =
    transactions.valid.length +
    investments.valid.length +
    budgets.valid.length +
    goals.valid.length +
    recurringExpenses.valid.length;
  const invalidRows = totalRows - validRows;

  return {
    transactions,
    investments,
    budgets,
    goals,
    recurringExpenses,
    summary: {
      totalRows,
      validRows,
      invalidRows,
      hasErrors: invalidRows > 0,
    },
  };
}
