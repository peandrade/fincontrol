import ExcelJS from "exceljs";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  INVESTMENT_TYPE_LABELS,
  GOAL_CATEGORY_LABELS,
} from "./constants";
import type { InvestmentType } from "@/types";
import type { GoalCategoryType } from "./constants";

// ── PT → EN Mapping Dictionaries ──

export const TRANSACTION_TYPE_MAP: Record<string, string> = {
  receita: "income",
  despesa: "expense",
};

export const INVESTMENT_TYPE_MAP: Record<string, InvestmentType> = Object.fromEntries(
  Object.entries(INVESTMENT_TYPE_LABELS).map(([key, label]) => [label, key as InvestmentType])
) as Record<string, InvestmentType>;

export const GOAL_CATEGORY_MAP: Record<string, GoalCategoryType> = Object.fromEntries(
  Object.entries(GOAL_CATEGORY_LABELS).map(([key, label]) => [label, key as GoalCategoryType])
) as Record<string, GoalCategoryType>;

export const INDEXER_OPTIONS = ["CDI", "IPCA", "SELIC", "PREFIXADO"];

// ── Header Style ──

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF10B981" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  bottom: { style: "thin", color: { argb: "FF0D9668" } },
};

function styleHeaders(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = HEADER_BORDER;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  headerRow.height = 30;
}

function autoWidth(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach((col) => {
    let maxLen = 12;
    if (col.eachCell) {
      col.eachCell({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > maxLen) maxLen = len;
      });
    }
    col.width = Math.min(maxLen + 4, 40);
  });
}

function addDropdown(
  sheet: ExcelJS.Worksheet,
  col: string,
  options: readonly string[] | string[],
  startRow: number,
  endRow: number
) {
  for (let r = startRow; r <= endRow; r++) {
    sheet.getCell(`${col}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${options.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Valor inválido",
      error: `Escolha uma das opções: ${options.join(", ")}`,
    };
  }
}

// ── Template Generator ──

export async function generateImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FinControl";
  workbook.created = new Date();

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES.filter(
    (c) => !EXPENSE_CATEGORIES.includes(c as typeof EXPENSE_CATEGORIES[number])
  )];
  const investmentTypeLabels = Object.values(INVESTMENT_TYPE_LABELS);
  const goalCategoryLabels = Object.values(GOAL_CATEGORY_LABELS);

  // ── Aba: Instruções ──
  const instrSheet = workbook.addWorksheet("Instruções");
  instrSheet.getColumn(1).width = 80;

  const instructions = [
    ["📋 INSTRUÇÕES DE PREENCHIMENTO - FinControl"],
    [""],
    ["Este arquivo contém 5 abas para importação de dados:"],
    [""],
    ["1️⃣  TRANSAÇÕES"],
    ["   • Tipo: receita ou despesa"],
    ["   • Valor: número positivo (ex: 1500.50 ou 1500,50)"],
    ["   • Categoria: escolha da lista suspensa"],
    ["   • Descrição: texto livre (opcional)"],
    ["   • Data: formato DD/MM/AAAA (ex: 15/03/2024)"],
    [""],
    ["2️⃣  INVESTIMENTOS"],
    ["   • Tipo: escolha da lista (Ações, FII, ETF, etc.)"],
    ["   • Nome: nome do investimento"],
    ["   • Ticker: código do ativo (opcional para renda fixa)"],
    ["   • Instituição: corretora ou banco (opcional)"],
    ["   • Quantidade, Preço Médio, Total Investido, Valor Atual: números"],
    ["   • Taxa de Juros: percentual (ex: 100 para 100% do CDI)"],
    ["   • Indexador: CDI, IPCA, SELIC ou PREFIXADO"],
    ["   • Vencimento: formato DD/MM/AAAA"],
    [""],
    ["3️⃣  ORÇAMENTOS"],
    ["   • Categoria: escolha da lista suspensa"],
    ["   • Limite: valor máximo para a categoria"],
    ["   • Mês: 1–12, ou 0 para orçamento fixo mensal"],
    ["   • Ano: ex: 2024, ou 0 para orçamento fixo mensal"],
    [""],
    ["4️⃣  METAS"],
    ["   • Nome: nome da meta"],
    ["   • Descrição: detalhes da meta (opcional)"],
    ["   • Categoria: escolha da lista suspensa"],
    ["   • Valor Alvo: quanto deseja atingir"],
    ["   • Valor Atual: quanto já possui guardado"],
    ["   • Data Alvo: formato DD/MM/AAAA (opcional)"],
    ["   • Cor: código hex (ex: #8B5CF6) — opcional"],
    [""],
    ["5️⃣  DESPESAS RECORRENTES"],
    ["   • Descrição: nome da despesa"],
    ["   • Valor: valor mensal"],
    ["   • Categoria: escolha da lista suspensa"],
    ["   • Dia Vencimento: 1–31"],
    ["   • Ativa: Sim ou Não"],
    ["   • Observações: texto livre (opcional)"],
    [""],
    ["⚠️  ATENÇÃO:"],
    ["   • Não altere os nomes das colunas (linha 1 de cada aba)"],
    ["   • Linhas com erros serão listadas no preview antes da importação"],
    ["   • A linha de exemplo (linha 2) pode ser apagada ou substituída"],
  ];

  instructions.forEach(([text]) => {
    instrSheet.addRow([text]);
  });

  instrSheet.getRow(1).font = { bold: true, size: 14 };

  // ── Aba: Transações ──
  const txSheet = workbook.addWorksheet("Transações");
  txSheet.columns = [
    { header: "Tipo", key: "tipo" },
    { header: "Valor", key: "valor" },
    { header: "Categoria", key: "categoria" },
    { header: "Descrição", key: "descricao" },
    { header: "Data", key: "data" },
  ];
  txSheet.addRow(["despesa", 150.0, "Supermercado", "Compras da semana", "15/01/2024"]);
  styleHeaders(txSheet);
  addDropdown(txSheet, "A", ["receita", "despesa"], 2, 500);
  addDropdown(txSheet, "C", allCategories, 2, 500);
  autoWidth(txSheet);

  // ── Aba: Investimentos ──
  const invSheet = workbook.addWorksheet("Investimentos");
  invSheet.columns = [
    { header: "Tipo", key: "tipo" },
    { header: "Nome", key: "nome" },
    { header: "Ticker", key: "ticker" },
    { header: "Instituição", key: "instituicao" },
    { header: "Quantidade", key: "quantidade" },
    { header: "Preço Médio", key: "precoMedio" },
    { header: "Total Investido", key: "totalInvestido" },
    { header: "Valor Atual", key: "valorAtual" },
    { header: "Taxa de Juros", key: "taxaJuros" },
    { header: "Indexador", key: "indexador" },
    { header: "Vencimento", key: "vencimento" },
  ];
  invSheet.addRow(["Ações", "Petrobras", "PETR4", "XP", 100, 28.5, 2850, 3200, "", "", ""]);
  invSheet.addRow(["CDB", "CDB Banco X", "", "Nubank", 1, 5000, 5000, 5150, 100, "CDI", "15/01/2026"]);
  styleHeaders(invSheet);
  addDropdown(invSheet, "A", investmentTypeLabels, 2, 500);
  addDropdown(invSheet, "J", INDEXER_OPTIONS, 2, 500);
  autoWidth(invSheet);

  // ── Aba: Orçamentos ──
  const budgetSheet = workbook.addWorksheet("Orçamentos");
  budgetSheet.columns = [
    { header: "Categoria", key: "categoria" },
    { header: "Limite", key: "limite" },
    { header: "Mês", key: "mes" },
    { header: "Ano", key: "ano" },
  ];
  budgetSheet.addRow(["Supermercado", 800, 0, 0]);
  styleHeaders(budgetSheet);
  addDropdown(budgetSheet, "A", [...EXPENSE_CATEGORIES], 2, 500);
  autoWidth(budgetSheet);

  // ── Aba: Metas ──
  const goalSheet = workbook.addWorksheet("Metas");
  goalSheet.columns = [
    { header: "Nome", key: "nome" },
    { header: "Descrição", key: "descricao" },
    { header: "Categoria", key: "categoria" },
    { header: "Valor Alvo", key: "valorAlvo" },
    { header: "Valor Atual", key: "valorAtual" },
    { header: "Data Alvo", key: "dataAlvo" },
    { header: "Cor", key: "cor" },
  ];
  goalSheet.addRow(["Reserva de Emergência", "6 meses de despesas", "Reserva de Emergência", 30000, 5000, "31/12/2025", "#EF4444"]);
  styleHeaders(goalSheet);
  addDropdown(goalSheet, "C", goalCategoryLabels, 2, 500);
  autoWidth(goalSheet);

  // ── Aba: Despesas Recorrentes ──
  const recSheet = workbook.addWorksheet("Despesas Recorrentes");
  recSheet.columns = [
    { header: "Descrição", key: "descricao" },
    { header: "Valor", key: "valor" },
    { header: "Categoria", key: "categoria" },
    { header: "Dia Vencimento", key: "diaVencimento" },
    { header: "Ativa", key: "ativa" },
    { header: "Observações", key: "observacoes" },
  ];
  recSheet.addRow(["Netflix", 55.9, "Streaming", 15, "Sim", "Plano família"]);
  styleHeaders(recSheet);
  addDropdown(recSheet, "C", [...EXPENSE_CATEGORIES], 2, 500);
  addDropdown(recSheet, "E", ["Sim", "Não"], 2, 500);
  autoWidth(recSheet);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
