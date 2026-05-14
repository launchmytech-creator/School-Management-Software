import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import type { ErrorFallbackProps } from "./ErrorBoundary";

interface QueryErrorFallbackProps {
  children: React.ReactNode;
  onRetry?: () => void;
  message?: string;
}

const QueryErrorFallbackContent: React.FC<ErrorFallbackProps & {
  message?: string;
  onRetry?: () => void;
}> = ({ error, resetErrorBoundary, message = "Failed to load data", onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center space-y-3">
      <div className="mx-auto w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-xl text-red-500">error</span>
      </div>
      <div>
        <p className="text-sm font-bold text-red-700">{message}</p>
        {import.meta.env.DEV && error && (
          <p className="text-xs text-red-500 mt-1 truncate">{error.message}</p>
        )}
      </div>
      <div className="flex justify-center gap-2">
        {onRetry && (
          <button
            onClick={() => {
              onRetry();
              resetErrorBoundary();
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({
  children,
  onRetry,
  message,
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <QueryErrorFallbackContent {...props} message={message} onRetry={onRetry} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default QueryErrorFallback;
