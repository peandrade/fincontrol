"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

// Shimmer animation for skeleton
const shimmer = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className, style, ariaLabel = "Loading..." }: SkeletonProps) {
  return (
    <motion.div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      variants={shimmer}
      initial="initial"
      animate="animate"
      className={cn(
        "rounded-lg bg-[var(--bg-hover)]",
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ className, lines = 1, ariaLabel = "Loading text..." }: SkeletonProps & { lines?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          variants={shimmer}
          initial="initial"
          animate="animate"
          className={cn(
            "rounded-lg bg-[var(--bg-hover)] h-4",
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
export function SkeletonCard({ className, ariaLabel = "Loading card..." }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
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
export function SkeletonChart({ className, ariaLabel = "Loading chart..." }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
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
export function SkeletonListItem({ className, ariaLabel = "Loading item..." }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
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
export function SkeletonList({ count = 3, className, ariaLabel = "Loading list..." }: SkeletonProps & { count?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className={cn("space-y-3", className)}>
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
export function SkeletonQuickStats({ ariaLabel = "Loading stats..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
export function SkeletonSummaryCards({ ariaLabel = "Loading summary..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
export function SkeletonDashboard({ ariaLabel = "Loading dashboard..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className="space-y-6">
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
export function SkeletonInvestmentList({ ariaLabel = "Loading investments..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
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
export function SkeletonAllocationChart({ ariaLabel = "Loading allocation..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="flex items-center justify-center" aria-hidden="true">
        <Skeleton className="rounded-full h-48 w-48" />
      </div>
      <div className="mt-4 space-y-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="rounded-full h-3 w-3" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for cards page
 */
export function SkeletonCardsPage({ ariaLabel = "Loading cards..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <motion.div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5"
            >
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-20 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
        <SkeletonChart />
      </div>
    </motion.div>
  );
}

/**
 * Skeleton for investments page
 */
export function SkeletonInvestmentsPage({ ariaLabel = "Loading investments..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <motion.div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonInvestmentList />
        </div>
        <div className="space-y-6">
          <SkeletonAllocationChart />
          <SkeletonChart />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Skeleton for reports page
 */
export function SkeletonReportsPage({ ariaLabel = "Loading reports..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <motion.div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonAllocationChart />
      </div>

      <SkeletonChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </motion.div>
  );
}

/**
 * Skeleton for settings page
 */
export function SkeletonSettingsPage({ ariaLabel = "Loading settings..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <motion.div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Settings Sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6"
        >
          <Skeleton className="h-5 w-32 mb-6" />
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/**
 * Skeleton for goals section
 */
export function SkeletonGoals({ ariaLabel = "Loading goals..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full mb-2" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for budget section
 */
export function SkeletonBudget({ ariaLabel = "Loading budget..." }: Pick<SkeletonProps, "ariaLabel">) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
