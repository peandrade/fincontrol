"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorBoundaryLabels {
  title?: string;
  description?: string;
  retryButton?: string;
  retryAriaLabel?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  labels?: ErrorBoundaryLabels;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Default labels (English as fallback)
const defaultLabels: Required<ErrorBoundaryLabels> = {
  title: "Something went wrong",
  description: "An error occurred while loading this content. Please try again or reload the page.",
  retryButton: "Try again",
  retryAriaLabel: "Try again",
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const labels = { ...defaultLabels, ...this.props.labels };

      return (
        <div
          className="flex flex-col items-center justify-center p-8 rounded-xl border border-red-500/20 bg-red-500/5"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {labels.title}
          </h3>
          <p className="text-sm text-[var(--text-muted)] text-center mb-4 max-w-md">
            {labels.description}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            aria-label={labels.retryAriaLabel}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {labels.retryButton}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper that provides translations automatically
export function TranslatedErrorBoundary({
  children,
  fallback,
  onError,
}: Omit<ErrorBoundaryProps, "labels">) {
  const t = useTranslations("common");

  const labels: ErrorBoundaryLabels = {
    title: t("somethingWentWrong"),
    description: t("errorLoadingContent"),
    retryButton: t("retry"),
    retryAriaLabel: t("retry"),
  };

  return (
    <ErrorBoundary labels={labels} fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  title?: string;
  description?: string;
  retryLabel?: string;
}

// Functional component version that uses translations
export function ErrorFallback({
  error,
  resetError,
  title,
  description,
  retryLabel,
}: ErrorFallbackProps) {
  const t = useTranslations("common");

  const displayTitle = title ?? t("somethingWentWrong");
  const displayDescription = description ?? t("errorLoadingContent");
  const displayRetry = retryLabel ?? t("retry");

  return (
    <div
      className="flex flex-col items-center justify-center p-8 rounded-xl border border-red-500/20 bg-red-500/5"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm text-[var(--text-muted)] text-center mb-4 max-w-md">
        {displayDescription}
      </p>
      {error && process.env.NODE_ENV === "development" && (
        <pre className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg mb-4 max-w-full overflow-auto">
          {error.message}
        </pre>
      )}
      {resetError && (
        <button
          onClick={resetError}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
          aria-label={displayRetry}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {displayRetry}
        </button>
      )}
    </div>
  );
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithErrorBoundary = (props: P) => (
    <TranslatedErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </TranslatedErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
