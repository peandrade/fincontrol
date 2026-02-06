"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Lightbulb,
  Trophy,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";

export interface GoalInsight {
  type: "positive" | "negative" | "neutral" | "achievement";
  titleKey: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
}

export interface GoalsAnalyticsData {
  insights: GoalInsight[];
  summary: {
    totalGoals: number;
  };
}

export function GoalsAnalytics() {
  const [data, setData] = useState<GoalsAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("goals");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/goals/analytics");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.summary.totalGoals === 0 || data.insights.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              {t("goalsInsights")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-xl border ${
                  insight.type === "achievement"
                    ? "bg-amber-500/10 border-amber-500/30"
                    : insight.type === "positive"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : insight.type === "negative"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      insight.type === "achievement"
                        ? "bg-amber-500/20"
                        : insight.type === "positive"
                        ? "bg-emerald-500/20"
                        : insight.type === "negative"
                        ? "bg-red-500/20"
                        : "bg-blue-500/20"
                    }`}
                  >
                    {insight.type === "achievement" ? (
                      <Trophy className="w-4 h-4 text-amber-400" />
                    ) : insight.type === "positive" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : insight.type === "negative" ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        insight.type === "achievement"
                          ? "text-amber-400"
                          : insight.type === "positive"
                          ? "text-emerald-400"
                          : insight.type === "negative"
                          ? "text-red-400"
                          : "text-blue-400"
                      }`}
                    >
                      {t(insight.titleKey)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {t(insight.descriptionKey, insight.params)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// --- Pure render component (accepts data as props, no fetching) ---

export function GoalInsights({ insights }: { insights: GoalInsight[] }) {
  const t = useTranslations("goals");

  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`p-3 sm:p-4 rounded-xl border ${
            insight.type === "achievement"
              ? "bg-amber-500/10 border-amber-500/30"
              : insight.type === "positive"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : insight.type === "negative"
              ? "bg-red-500/10 border-red-500/30"
              : "bg-blue-500/10 border-blue-500/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-1.5 rounded-lg ${
                insight.type === "achievement"
                  ? "bg-amber-500/20"
                  : insight.type === "positive"
                  ? "bg-emerald-500/20"
                  : insight.type === "negative"
                  ? "bg-red-500/20"
                  : "bg-blue-500/20"
              }`}
            >
              {insight.type === "achievement" ? (
                <Trophy className="w-4 h-4 text-amber-400" />
              ) : insight.type === "positive" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : insight.type === "negative" ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <Lightbulb className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  insight.type === "achievement"
                    ? "text-amber-400"
                    : insight.type === "positive"
                    ? "text-emerald-400"
                    : insight.type === "negative"
                    ? "text-red-400"
                    : "text-blue-400"
                }`}
              >
                {t(insight.titleKey)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {t(insight.descriptionKey, insight.params)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
