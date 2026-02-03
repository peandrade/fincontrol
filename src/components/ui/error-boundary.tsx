"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

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

      return (
        <div
          className="flex flex-col items-center justify-center p-8 rounded-xl border border-red-500/20 bg-red-500/5"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Algo deu errado
          </h3>
          <p className="text-sm text-[var(--text-muted)] text-center mb-4 max-w-md">
            Ocorreu um erro ao carregar este conteúdo. Tente novamente ou recarregue a página.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            aria-label="Tentar novamente"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  resetError,
  title = "Algo deu errado",
  description = "Ocorreu um erro ao carregar este conteúdo.",
}: ErrorFallbackProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 rounded-xl border border-red-500/20 bg-red-500/5"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] text-center mb-4 max-w-md">
        {description}
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
          aria-label="Tentar novamente"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Tentar novamente
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
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
