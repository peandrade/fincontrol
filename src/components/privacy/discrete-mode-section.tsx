"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

interface DiscreteModeProps {
  enabled: boolean;
  onToggle: () => void;
}

export function DiscreteModeSection({ enabled, onToggle }: DiscreteModeProps) {
  const t = useTranslations("privacy");

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-500/10">
            {enabled ? (
              <EyeOff className="w-5 h-5 text-violet-400" />
            ) : (
              <Eye className="w-5 h-5 text-violet-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("discreteMode")}</h2>
            <p className="text-sm text-[var(--text-dimmed)]">{t("discreteModeDesc")}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`
            relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
            flex items-center px-0.5
            ${enabled ? "bg-violet-500" : "bg-[var(--bg-hover)]"}
          `}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`
              w-6 h-6 rounded-full bg-white shadow-md
              transition-transform duration-200 ease-in-out
              ${enabled ? "translate-x-[26px]" : "translate-x-0"}
            `}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-4 p-4 rounded-xl bg-violet-500/10">
          <p className="text-sm text-[var(--text-muted)]">{t("example")}</p>
          <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
            {t("balanceHidden")}
          </p>
        </div>
      )}
    </div>
  );
}
