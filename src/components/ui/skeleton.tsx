"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base skeleton component with pulse animation
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando..."
      className={cn(
        "animate-pulse rounded-lg bg-[var(--bg-hover)]",
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando texto..." className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-lg bg-[var(--bg-hover)] h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for cards (summary cards, stat cards)
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando card..."
      className={cn(
        "bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-4 w-24" aria-hidden="true" />
        <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-8 w-8" aria-hidden="true" />
      </div>
      <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-8 w-32 mb-2" aria-hidden="true" />
      <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-3 w-20" aria-hidden="true" />
    </div>
  );
}

/**
 * Skeleton for chart components
 */
export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando gráfico..."
      className={cn(
        "bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-6 w-40" aria-hidden="true" />
        <div className="flex gap-2">
          <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-8 w-16" aria-hidden="true" />
          <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-8 w-16" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 h-48" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-t-lg bg-[var(--bg-hover)] flex-1"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for list items
 */
export function SkeletonListItem({ className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando item..."
      className={cn(
        "flex items-center gap-4 p-4 bg-[var(--bg-hover)] rounded-xl",
        className
      )}
    >
      <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-10 w-10 shrink-0" aria-hidden="true" />
      <div className="flex-1 space-y-2" aria-hidden="true">
        <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-4 w-3/4" />
        <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-3 w-1/2" />
      </div>
      <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-6 w-20" aria-hidden="true" />
    </div>
  );
}

/**
 * Skeleton for a list of items
 */
export function SkeletonList({ count = 3, className }: SkeletonProps & { count?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando lista..." className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-[var(--bg-hover)] rounded-xl"
          aria-hidden="true"
        >
          <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-4 w-3/4" />
            <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-3 w-1/2" />
          </div>
          <div className="animate-pulse rounded-lg bg-[var(--bg-secondary)] h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for dashboard quick stats row
 */
export function SkeletonQuickStats() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando estatísticas..." className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3">
            <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-10 w-10" />
            <div className="space-y-2">
              <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-3 w-16" />
              <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for summary cards (income, expense, balance)
 */
export function SkeletonSummaryCards() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando resumo..." className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-4 w-24" />
            <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-8 w-8" />
          </div>
          <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-8 w-32 mb-2" />
          <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the entire dashboard
 */
export function SkeletonDashboard() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando dashboard..." className="space-y-6">
      <SkeletonQuickStats />
      <SkeletonSummaryCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-hidden="true">
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
        <SkeletonChart />
      </div>
    </div>
  );
}

/**
 * Skeleton for investment list
 */
export function SkeletonInvestmentList() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando investimentos..." className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
      <div className="flex items-center justify-between mb-4" aria-hidden="true">
        <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-6 w-32" />
        <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-8 w-24" />
      </div>
      <SkeletonList count={4} />
    </div>
  );
}

/**
 * Skeleton for allocation chart (pie/donut)
 */
export function SkeletonAllocationChart() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando alocação..." className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
      <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-6 w-32 mb-6" aria-hidden="true" />
      <div className="flex items-center justify-center" aria-hidden="true">
        <div className="animate-pulse rounded-full bg-[var(--bg-hover)] h-48 w-48" />
      </div>
      <div className="mt-4 space-y-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="animate-pulse rounded-full bg-[var(--bg-hover)] h-3 w-3" />
              <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-3 w-16" />
            </div>
            <div className="animate-pulse rounded-lg bg-[var(--bg-hover)] h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
