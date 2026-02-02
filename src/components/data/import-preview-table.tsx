"use client";

import { CheckCircle, X } from "lucide-react";
import type { ImportPreview } from "@/lib/excel-parser";

export type PreviewTab =
  | "transactions"
  | "investments"
  | "budgets"
  | "goals"
  | "recurringExpenses";

export const TAB_LABELS: Record<PreviewTab, string> = {
  transactions: "Transações",
  investments: "Investimentos",
  budgets: "Orçamentos",
  goals: "Metas",
  recurringExpenses: "Despesas Recorrentes",
};

interface ImportPreviewTableProps {
  tab: PreviewTab;
  preview: ImportPreview;
}

export function ImportPreviewTable({ tab, preview }: ImportPreviewTableProps) {
  const section = preview[tab];

  const allRows = [
    ...section.valid.map((r) => ({ ...r, isValid: true })),
    ...section.invalid.map((r) => ({ ...r, isValid: false })),
  ].sort((a, b) => a.rowNumber - b.rowNumber);

  if (allRows.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[var(--text-dimmed)]">
        Nenhum dado encontrado nesta aba
      </div>
    );
  }

  const columns = getColumnsForTab(tab);

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-[var(--border-color)]">
          <th className="p-2 text-left text-[var(--text-dimmed)] font-medium">
            #
          </th>
          {columns.map((col) => (
            <th
              key={col.key}
              className="p-2 text-left text-[var(--text-dimmed)] font-medium"
            >
              {col.label}
            </th>
          ))}
          <th className="p-2 text-left text-[var(--text-dimmed)] font-medium">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {allRows.map((row) => (
          <tr
            key={row.rowNumber}
            className={`border-b border-[var(--border-color)] ${
              row.isValid ? "" : "bg-red-500/5"
            }`}
          >
            <td className="p-2 text-[var(--text-dimmed)]">{row.rowNumber}</td>
            {columns.map((col) => (
              <td
                key={col.key}
                className="p-2 text-[var(--text-primary)] max-w-[120px] truncate"
              >
                {formatCellValue(row.raw[col.key])}
              </td>
            ))}
            <td className="p-2">
              {row.isValid ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <div className="flex items-center gap-1">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span
                    className="text-red-400 truncate max-w-[150px]"
                    title={row.errors.join("; ")}
                  >
                    {row.errors[0]}
                  </span>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function getColumnsForTab(tab: PreviewTab) {
  switch (tab) {
    case "transactions":
      return [
        { key: "tipo", label: "Tipo" },
        { key: "valor", label: "Valor" },
        { key: "categoria", label: "Categoria" },
        { key: "descricao", label: "Descrição" },
        { key: "data", label: "Data" },
      ];
    case "investments":
      return [
        { key: "tipo", label: "Tipo" },
        { key: "nome", label: "Nome" },
        { key: "ticker", label: "Ticker" },
        { key: "totalInvestido", label: "Total" },
        { key: "valorAtual", label: "Atual" },
      ];
    case "budgets":
      return [
        { key: "categoria", label: "Categoria" },
        { key: "limite", label: "Limite" },
        { key: "mes", label: "Mês" },
        { key: "ano", label: "Ano" },
      ];
    case "goals":
      return [
        { key: "nome", label: "Nome" },
        { key: "categoria", label: "Categoria" },
        { key: "valorAlvo", label: "Alvo" },
        { key: "valorAtual", label: "Atual" },
      ];
    case "recurringExpenses":
      return [
        { key: "descricao", label: "Descrição" },
        { key: "valor", label: "Valor" },
        { key: "categoria", label: "Categoria" },
        { key: "diaVencimento", label: "Dia" },
      ];
  }
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (val instanceof Date) return val.toLocaleDateString("pt-BR");
  if (typeof val === "number") return val.toLocaleString("pt-BR");
  return String(val);
}
