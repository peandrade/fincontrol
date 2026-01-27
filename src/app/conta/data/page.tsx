"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Download,
  Upload,
  Cloud,
  Trash2,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  FileUp,
} from "lucide-react";
import type { ImportPreview } from "@/lib/excel-parser";

type ExportStatus = "idle" | "loading" | "success" | "error";

type ImportStep =
  | "idle"
  | "uploading"
  | "preview"
  | "confirming"
  | "success"
  | "error";

type PreviewTab =
  | "transactions"
  | "investments"
  | "budgets"
  | "goals"
  | "recurringExpenses";

interface ImportResult {
  transactionsCreated: number;
  investmentsCreated: number;
  budgetsCreated: number;
  goalsCreated: number;
  recurringExpensesCreated: number;
}

const TAB_LABELS: Record<PreviewTab, string> = {
  transactions: "Transações",
  investments: "Investimentos",
  budgets: "Orçamentos",
  goals: "Metas",
  recurringExpenses: "Despesas Recorrentes",
};

export default function DataPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");

  // Import
  const [importStep, setImportStep] = useState<ImportStep>("idle");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>("transactions");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string>("");

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Export Handlers ──

  const handleExportCSV = async () => {
    setExportStatus("loading");
    try {
      const res = await fetch("/api/data/export");
      if (!res.ok) throw new Error("Erro ao exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ||
        "fincontrol-transacoes.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch {
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
    }
  };

  const handleExportPDF = () => {
    router.push("/relatorios");
  };

  // ── Template Download ──

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/data/template");
      if (!res.ok) throw new Error("Erro ao baixar template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fincontrol-modelo-importacao.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar template:", err);
    }
  };

  // ── Import Handlers ──

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportError("Formato inválido. Envie um arquivo .xlsx");
      setImportStep("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImportError("Arquivo muito grande. Tamanho máximo: 5MB");
      setImportStep("error");
      return;
    }

    setImportStep("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/data/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar arquivo");
      }

      setPreview(data as ImportPreview);

      // Auto-select first tab with data
      const tabs: PreviewTab[] = [
        "transactions",
        "investments",
        "budgets",
        "goals",
        "recurringExpenses",
      ];
      const firstWithData = tabs.find((t) => data[t]?.total > 0);
      setActiveTab(firstWithData || "transactions");

      setImportStep("preview");
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Erro ao processar arquivo"
      );
      setImportStep("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleConfirmImport = async () => {
    if (!preview) return;

    setImportStep("confirming");

    try {
      const body = {
        transactions: preview.transactions.valid.map((r) => r.data),
        investments: preview.investments.valid.map((r) => r.data),
        budgets: preview.budgets.valid.map((r) => r.data),
        goals: preview.goals.valid.map((r) => r.data),
        recurringExpenses: preview.recurringExpenses.valid.map((r) => r.data),
      };

      const res = await fetch("/api/data/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao importar dados");
      }

      setImportResult(data);
      setImportStep("success");
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Erro ao importar dados"
      );
      setImportStep("error");
    }
  };

  const resetImport = () => {
    setImportStep("idle");
    setPreview(null);
    setImportResult(null);
    setImportError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Helpers ──

  const totalValidItems = preview
    ? preview.transactions.valid.length +
      preview.investments.valid.length +
      preview.budgets.valid.length +
      preview.goals.valid.length +
      preview.recurringExpenses.valid.length
    : 0;

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Data
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            Exporte e gerencie seus dados
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Exportar Dados ── */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Exportar Dados
                </h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Baixe suas transações e relatórios
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportCSV}
                disabled={exportStatus === "loading"}
                className="p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-emerald-500 hover:bg-emerald-500/10 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {exportStatus === "loading" ? (
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                ) : exportStatus === "success" ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                ) : exportStatus === "error" ? (
                  <AlertCircle className="w-8 h-8 text-red-400" />
                ) : (
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                )}
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Exportar CSV
                </span>
                <span className="text-xs text-[var(--text-dimmed)]">
                  Planilha Excel
                </span>
              </button>

              <button
                onClick={handleExportPDF}
                className="p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-emerald-500 hover:bg-emerald-500/10 transition-all flex flex-col items-center gap-2"
              >
                <FileText className="w-8 h-8 text-emerald-400" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Exportar PDF
                </span>
                <span className="text-xs text-[var(--text-dimmed)]">
                  Relatório completo
                </span>
              </button>
            </div>
          </div>

          {/* ── Importar Dados ── */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Importar Dados
                </h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Importe dados via planilha Excel
                </p>
              </div>
            </div>

            {/* Step: idle */}
            {importStep === "idle" && (
              <div className="space-y-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full p-3 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Baixar modelo Excel (.xlsx)
                </button>

                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2 cursor-pointer"
                >
                  <FileUp className="w-8 h-8 text-blue-400" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Arraste ou clique para enviar .xlsx
                  </span>
                  <span className="text-xs text-[var(--text-dimmed)]">
                    Máximo 5MB
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            )}

            {/* Step: uploading */}
            {importStep === "uploading" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-sm text-[var(--text-muted)]">
                  Processando arquivo...
                </p>
              </div>
            )}

            {/* Step: preview */}
            {importStep === "preview" && preview && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-primary)] text-sm">
                  <span className="text-[var(--text-primary)] font-medium">
                    {preview.summary.totalRows} linhas
                  </span>
                  <span className="text-emerald-400">
                    {preview.summary.validRows} válidas
                  </span>
                  {preview.summary.invalidRows > 0 && (
                    <span className="text-red-400">
                      {preview.summary.invalidRows} com erros
                    </span>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {(Object.keys(TAB_LABELS) as PreviewTab[]).map((tab) => {
                    const section = preview[tab];
                    if (section.total === 0) return null;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          activeTab === tab
                            ? "bg-blue-500 text-white"
                            : "bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {TAB_LABELS[tab]} ({section.valid.length}/
                        {section.total})
                      </button>
                    );
                  })}
                </div>

                {/* Table */}
                <div className="max-h-64 overflow-auto rounded-xl border border-[var(--border-color)]">
                  <PreviewTable
                    tab={activeTab}
                    preview={preview}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetImport}
                    className="flex-1 p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={totalValidItems === 0}
                    className="flex-1 p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Importar {totalValidItems} itens válidos
                  </button>
                </div>
              </div>
            )}

            {/* Step: confirming */}
            {importStep === "confirming" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-sm text-[var(--text-muted)]">
                  Salvando dados...
                </p>
              </div>
            )}

            {/* Step: success */}
            {importStep === "success" && importResult && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    Importação concluída!
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  {importResult.transactionsCreated > 0 && (
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                      <span className="text-[var(--text-muted)]">Transações</span>
                      <span className="text-emerald-400 font-medium">
                        +{importResult.transactionsCreated}
                      </span>
                    </div>
                  )}
                  {importResult.investmentsCreated > 0 && (
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                      <span className="text-[var(--text-muted)]">Investimentos</span>
                      <span className="text-emerald-400 font-medium">
                        +{importResult.investmentsCreated}
                      </span>
                    </div>
                  )}
                  {importResult.budgetsCreated > 0 && (
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                      <span className="text-[var(--text-muted)]">Orçamentos</span>
                      <span className="text-emerald-400 font-medium">
                        +{importResult.budgetsCreated}
                      </span>
                    </div>
                  )}
                  {importResult.goalsCreated > 0 && (
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                      <span className="text-[var(--text-muted)]">Metas</span>
                      <span className="text-emerald-400 font-medium">
                        +{importResult.goalsCreated}
                      </span>
                    </div>
                  )}
                  {importResult.recurringExpensesCreated > 0 && (
                    <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                      <span className="text-[var(--text-muted)]">Despesas Recorrentes</span>
                      <span className="text-emerald-400 font-medium">
                        +{importResult.recurringExpensesCreated}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={resetImport}
                  className="w-full p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium text-sm"
                >
                  Concluído
                </button>
              </div>
            )}

            {/* Step: error */}
            {importStep === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                  <p className="text-sm text-red-400 text-center">
                    {importError}
                  </p>
                </div>
                <button
                  onClick={resetImport}
                  className="w-full p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all font-medium text-sm"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>

          {/* ── Backup Automático ── */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Cloud className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Backup na Nuvem
                  </h2>
                  <p className="text-sm text-[var(--text-dimmed)]">
                    Seus dados já estão seguros no servidor
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Ativo</span>
              </div>
            </div>
          </div>

          {/* ── Limpar Dados ── */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Limpar Dados Antigos
                </h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Remover transações de períodos anteriores
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full p-4 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
              >
                Limpar dados antigos
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      Tem certeza?
                    </p>
                    <p className="text-xs text-[var(--text-dimmed)] mt-1">
                      Esta ação não pode ser desfeita. Recomendamos exportar
                      seus dados antes.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                    }}
                    className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preview Table Component ──

function PreviewTable({
  tab,
  preview,
}: {
  tab: PreviewTab;
  preview: ImportPreview;
}) {
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
