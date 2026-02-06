"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Upload,
  Download,
  FileUp,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { ImportPreview } from "@/lib/excel-parser";
import { ImportPreviewTable, type PreviewTab } from "./import-preview-table";

const TAB_KEYS: PreviewTab[] = ["transactions", "investments", "budgets", "goals", "recurringExpenses"];
const TAB_TRANSLATION_KEYS: Record<PreviewTab, string> = {
  transactions: "tabTransactions",
  investments: "tabInvestments",
  budgets: "tabBudgets",
  goals: "tabGoals",
  recurringExpenses: "tabRecurringExpenses",
};

type ImportStep =
  | "idle"
  | "uploading"
  | "preview"
  | "confirming"
  | "success"
  | "error";

interface ImportResult {
  transactionsCreated: number;
  investmentsCreated: number;
  budgetsCreated: number;
  goalsCreated: number;
  recurringExpensesCreated: number;
}

export function DataImportSection() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const td = useTranslations("data");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStep, setImportStep] = useState<ImportStep>("idle");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>("transactions");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string>("");

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/data/template");
      if (!res.ok) throw new Error("Error downloading template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fincontrol-import-template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading template:", err);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportError(t("invalidFormat"));
      setImportStep("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImportError(t("fileTooLarge"));
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
        throw new Error(data.error || t("errorProcessingFile"));
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
      const firstWithData = tabs.find((tab) => data[tab]?.total > 0);
      setActiveTab(firstWithData || "transactions");

      setImportStep("preview");
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : t("errorProcessingFile")
      );
      setImportStep("error");
    }
  }, [t]);

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
        throw new Error(data.error || t("errorImportingData"));
      }

      setImportResult(data);
      setImportStep("success");
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : t("errorImportingData")
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

  const totalValidItems = preview
    ? preview.transactions.valid.length +
      preview.investments.valid.length +
      preview.budgets.valid.length +
      preview.goals.valid.length +
      preview.recurringExpenses.valid.length
    : 0;

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-blue-500/10">
          <Upload className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("importData")}
          </h2>
          <p className="text-sm text-[var(--text-dimmed)]">
            {t("importDataDesc")}
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
            {t("downloadTemplate")}
          </button>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2 cursor-pointer"
          >
            <FileUp className="w-8 h-8 text-blue-400" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {t("dragOrClickUpload")}
            </span>
            <span className="text-xs text-[var(--text-dimmed)]">
              {t("maxFileSize")}
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
            {t("processingFile")}
          </p>
        </div>
      )}

      {/* Step: preview */}
      {importStep === "preview" && preview && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-primary)] text-sm">
            <span className="text-[var(--text-primary)] font-medium">
              {preview.summary.totalRows} {t("rows")}
            </span>
            <span className="text-emerald-400">
              {preview.summary.validRows} {t("validRows")}
            </span>
            {preview.summary.invalidRows > 0 && (
              <span className="text-red-400">
                {preview.summary.invalidRows} {t("rowsWithErrors")}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TAB_KEYS.map((tab) => {
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
                  {td(TAB_TRANSLATION_KEYS[tab])} ({section.valid.length}/
                  {section.total})
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="max-h-64 overflow-auto rounded-xl border border-[var(--border-color)]">
            <ImportPreviewTable
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
              {tc("cancel")}
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={totalValidItems === 0}
              className="flex-1 p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("importValidItems").replace("{count}", String(totalValidItems))}
            </button>
          </div>
        </div>
      )}

      {/* Step: confirming */}
      {importStep === "confirming" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">
            {t("savingData")}
          </p>
        </div>
      )}

      {/* Step: success */}
      {importStep === "success" && importResult && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {t("importComplete")}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            {importResult.transactionsCreated > 0 && (
              <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                <span className="text-[var(--text-muted)]">{t("transactions")}</span>
                <span className="text-emerald-400 font-medium">
                  +{importResult.transactionsCreated}
                </span>
              </div>
            )}
            {importResult.investmentsCreated > 0 && (
              <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                <span className="text-[var(--text-muted)]">{t("investments")}</span>
                <span className="text-emerald-400 font-medium">
                  +{importResult.investmentsCreated}
                </span>
              </div>
            )}
            {importResult.budgetsCreated > 0 && (
              <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                <span className="text-[var(--text-muted)]">{t("budgets")}</span>
                <span className="text-emerald-400 font-medium">
                  +{importResult.budgetsCreated}
                </span>
              </div>
            )}
            {importResult.goalsCreated > 0 && (
              <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                <span className="text-[var(--text-muted)]">{t("goals")}</span>
                <span className="text-emerald-400 font-medium">
                  +{importResult.goalsCreated}
                </span>
              </div>
            )}
            {importResult.recurringExpensesCreated > 0 && (
              <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                <span className="text-[var(--text-muted)]">{t("recurringExpensesLabel")}</span>
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
            {t("done")}
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
            {t("tryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
