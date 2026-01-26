"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";

type ExportStatus = "idle" | "loading" | "success" | "error";

export default function DataPage() {
  const router = useRouter();
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExport = async (format: "csv" | "pdf") => {
    setExportStatus("loading");

    // Simular exportação
    setTimeout(() => {
      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 3000);
    }, 2000);
  };

  const handleImport = () => {
    // Abrir seletor de arquivo
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.ofx,.qif";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log("Arquivo selecionado:", file.name);
        // TODO: Processar importação
      }
    };
    input.click();
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
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
          {/* Exportar Dados */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Exportar Dados</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Baixe suas transações e relatórios</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExport("csv")}
                disabled={exportStatus === "loading"}
                className="p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-emerald-500 hover:bg-emerald-500/10 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {exportStatus === "loading" ? (
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                ) : exportStatus === "success" ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                ) : (
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                )}
                <span className="text-sm font-medium text-[var(--text-primary)]">Exportar CSV</span>
                <span className="text-xs text-[var(--text-dimmed)]">Planilha Excel</span>
              </button>

              <button
                onClick={() => handleExport("pdf")}
                disabled={exportStatus === "loading"}
                className="p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-emerald-500 hover:bg-emerald-500/10 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {exportStatus === "loading" ? (
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                ) : exportStatus === "success" ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                ) : (
                  <FileText className="w-8 h-8 text-emerald-400" />
                )}
                <span className="text-sm font-medium text-[var(--text-primary)]">Exportar PDF</span>
                <span className="text-xs text-[var(--text-dimmed)]">Relatório completo</span>
              </button>
            </div>
          </div>

          {/* Importar Dados */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Importar Dados</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Importe extrato bancário ou backup</p>
              </div>
            </div>

            <button
              onClick={handleImport}
              className="w-full p-6 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-blue-400" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Clique para selecionar arquivo</span>
              <span className="text-xs text-[var(--text-dimmed)]">CSV, OFX ou QIF</span>
            </button>
          </div>

          {/* Backup Automático */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Cloud className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Backup na Nuvem</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">Seus dados já estão seguros no servidor</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Ativo</span>
              </div>
            </div>
          </div>

          {/* Limpar Dados */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Limpar Dados Antigos</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Remover transações de períodos anteriores</p>
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
                    <p className="text-sm text-[var(--text-primary)] font-medium">Tem certeza?</p>
                    <p className="text-xs text-[var(--text-dimmed)] mt-1">
                      Esta ação não pode ser desfeita. Recomendamos exportar seus dados antes.
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
                      // TODO: Implementar limpeza
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
