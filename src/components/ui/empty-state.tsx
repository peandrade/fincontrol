"use client";

import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <Icon className="w-12 h-12 text-[var(--text-dimmed)] mx-auto mb-3" />
      <h3 className="text-lg font-medium text-[var(--text-muted)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-dimmed)] mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl font-medium bg-primary-gradient text-white hover:opacity-90 transition-all shadow-lg shadow-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
