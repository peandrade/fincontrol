"use client";

import { CheckCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ImportPreview } from "@/lib/excel-parser";

export type PreviewTab =
  | "transactions"
  | "investments"
  | "budgets"
  | "goals"
  | "recurringExpenses";

// Tab labels are now retrieved via translations in components

interface ImportPreviewTableProps {
  tab: PreviewTab;
  preview: ImportPreview;
}

export function ImportPreviewTable({ tab, preview }: ImportPreviewTableProps) {
  const t = useTranslations("data");
  const section = preview[tab];

  const allRows = [
    ...section.valid.map((r) => ({ ...r, isValid: true })),
    ...section.invalid.map((r) => ({ ...r, isValid: false })),
  ].sort((a, b) => a.rowNumber - b.rowNumber);

  if (allRows.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[var(--text-dimmed)]">
        {t("noDataInTab")}
      </div>
    );
  }

  const columns = getColumnsForTab(tab, t);

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

function getColumnsForTab(tab: PreviewTab, t: (key: string) => string) {
  switch (tab) {
    case "transactions":
      return [
        { key: "tipo", label: t("colType") },
        { key: "valor", label: t("colValue") },
        { key: "categoria", label: t("colCategory") },
        { key: "descricao", label: t("colDescription") },
        { key: "data", label: t("colDate") },
      ];
    case "investments":
      return [
        { key: "tipo", label: t("colType") },
        { key: "nome", label: t("colName") },
        { key: "ticker", label: "Ticker" },
        { key: "totalInvestido", label: t("colTotal") },
        { key: "valorAtual", label: t("colCurrent") },
      ];
    case "budgets":
      return [
        { key: "categoria", label: t("colCategory") },
        { key: "limite", label: t("colLimit") },
        { key: "mes", label: t("colMonth") },
        { key: "ano", label: t("colYear") },
      ];
    case "goals":
      return [
        { key: "nome", label: t("colName") },
        { key: "categoria", label: t("colCategory") },
        { key: "valorAlvo", label: t("colTarget") },
        { key: "valorAtual", label: t("colCurrent") },
      ];
    case "recurringExpenses":
      return [
        { key: "descricao", label: t("colDescription") },
        { key: "valor", label: t("colValue") },
        { key: "categoria", label: t("colCategory") },
        { key: "diaVencimento", label: t("colDay") },
      ];
  }
}

function formatCellValue(val: unknown, locale: string = "pt-BR"): string {
  if (val === null || val === undefined) return "—";
  if (val instanceof Date) return val.toLocaleDateString(locale);
  if (typeof val === "number") return val.toLocaleString(locale);
  return String(val);
}
