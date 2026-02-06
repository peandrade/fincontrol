"use client";

import {
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { PortfolioInsight } from "./analytics-types";

interface PortfolioInsightsProps {
  insights: PortfolioInsight[];
  showHeader?: boolean;
}

export function PortfolioInsights({ insights, showHeader = false }: PortfolioInsightsProps) {
  const t = useTranslations("investments");

  if (insights.length === 0) return null;

  return (
    <>
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            {t("portfolioInsights")}
          </h3>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </>
  );
}

function InsightCard({ insight }: { insight: PortfolioInsight }) {
  const t = useTranslations("investments");
  const tcat = useTranslations("categories");

  const bgClass =
    insight.type === "positive"
      ? "bg-emerald-500/10 border-emerald-500/30"
      : insight.type === "negative"
      ? "bg-red-500/10 border-red-500/30"
      : insight.type === "warning"
      ? "bg-amber-500/10 border-amber-500/30"
      : "bg-blue-500/10 border-blue-500/30";

  const iconBgClass =
    insight.type === "positive"
      ? "bg-emerald-500/20"
      : insight.type === "negative"
      ? "bg-red-500/20"
      : insight.type === "warning"
      ? "bg-amber-500/20"
      : "bg-blue-500/20";

  const textClass =
    insight.type === "positive"
      ? "text-emerald-400"
      : insight.type === "negative"
      ? "text-red-400"
      : insight.type === "warning"
      ? "text-amber-400"
      : "text-blue-400";

  const Icon =
    insight.type === "positive"
      ? CheckCircle
      : insight.type === "negative"
      ? TrendingDown
      : insight.type === "warning"
      ? AlertTriangle
      : Lightbulb;

  // Translate params if they contain type keys
  const translatedParams = insight.params ? (() => {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(insight.params!)) {
      if (key === "type" && typeof value === "string") {
        params[key] = tcat(`investmentTypes.${value}`);
      } else if (value !== undefined) {
        params[key] = value;
      }
    }
    return params;
  })() : undefined;

  return (
    <div className={`p-3 sm:p-4 rounded-xl border ${bgClass}`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${iconBgClass}`}>
          <Icon className={`w-4 h-4 ${textClass}`} />
        </div>
        <div>
          <p className={`text-sm font-medium ${textClass}`}>{t(insight.titleKey)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {t(insight.descriptionKey, translatedParams)}
          </p>
        </div>
      </div>
    </div>
  );
}
