"use client";

import { Timer } from "lucide-react";
import { useTranslations } from "next-intl";

interface AutoLockProps {
  enabled: boolean;
  lockTime: number;
  onToggle: () => void;
  onTimeChange: (minutes: number) => void;
}

const LOCK_TIME_OPTIONS = [1, 5, 15, 30];

export function AutoLockSection({ enabled, lockTime, onToggle, onTimeChange }: AutoLockProps) {
  const t = useTranslations("privacy");

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Timer className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("autoLock")}</h2>
            <p className="text-sm text-[var(--text-dimmed)]">{t("autoLockDesc")}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`
            relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
            flex items-center px-0.5
            ${enabled ? "bg-amber-500" : "bg-[var(--bg-hover)]"}
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
        <div className="pt-4 border-t border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-muted)] mb-3">{t("inactivityTime")}</p>
          <div className="grid grid-cols-4 gap-2">
            {LOCK_TIME_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                onClick={() => onTimeChange(minutes)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  lockTime === minutes
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                }`}
              >
                <span className="text-sm text-[var(--text-primary)]">
                  {`${minutes} min`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
