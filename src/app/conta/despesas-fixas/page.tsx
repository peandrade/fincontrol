"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { RecurringSection } from "@/components/recurring";

export default function DespesasFixasPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Background blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-secondary) 10%, transparent)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/conta")}
            className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {t("recurringExpenses")}
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              {t("recurringExpensesDesc")}
            </p>
          </div>
        </div>

        {/* Recurring Section */}
        <RecurringSection />
      </div>
    </div>
  );
}
