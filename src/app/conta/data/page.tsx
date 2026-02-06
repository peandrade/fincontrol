"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Cloud, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { DataExportSection, DataImportSection } from "@/components/data";

export default function DataPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tc("back")}</span>
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t("data")}
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            {t("dataDesc")}
          </p>
        </div>

        <div className="space-y-6">
          {/* Export Section */}
          <DataExportSection />

          {/* Import Section */}
          <DataImportSection />

          {/* Cloud Backup */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Cloud className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t("cloudBackup")}
                  </h2>
                  <p className="text-sm text-[var(--text-dimmed)]">
                    {t("cloudBackupDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{tc("active")}</span>
              </div>
            </div>
          </div>

          {/* Delete Data Section */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t("clearOldData")}
                </h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  {t("clearOldDataDesc")}
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full p-4 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
              >
                {t("clearOldDataButton")}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      {t("areYouSure")}
                    </p>
                    <p className="text-xs text-[var(--text-dimmed)] mt-1">
                      {t("clearOldDataWarning")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                  >
                    {tc("cancel")}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                    }}
                    className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    {tc("confirm")}
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
