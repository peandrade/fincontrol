"use client";

import { useState, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  badge?: string | number;
  badgeColor?: "violet" | "emerald" | "amber" | "red";
}

const badgeColors = {
  violet: "bg-primary-soft text-primary-color border-[var(--color-primary)]/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
};

export function CollapsibleSection({
  id,
  title,
  icon,
  children,
  defaultExpanded = true,
  badge,
  badgeColor = "violet",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`section-${id}`);
    if (savedState !== null) {
      setIsExpanded(savedState === "true");
    }
    setIsInitialized(true);
  }, [id]);

  // Save state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`section-${id}`, String(newState));
  };

  // Avoid hydration mismatch
  if (!isInitialized) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] mb-6">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 bg-primary-soft rounded-lg">
                  {icon}
                </div>
              )}
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
              {badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badgeColors[badgeColor]}`}>
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] mb-6 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={toggleExpanded}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-primary-soft rounded-lg">
              {icon}
            </div>
          )}
          <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          {badge !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badgeColors[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-dimmed)] hidden sm:inline">
            {isExpanded ? "Recolher" : "Expandir"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Content - Collapsible */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-4 sm:p-5 pt-0 sm:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
