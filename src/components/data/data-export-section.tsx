"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type ExportStatus = "idle" | "loading" | "success" | "error";

export function DataExportSection() {
  const router = useRouter();
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");

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

  return (
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
  );
}
