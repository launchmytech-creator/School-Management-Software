import React from "react";
import type { ErrorFallbackProps } from "./ErrorBoundary";

const GlobalErrorFallback: React.FC<ErrorFallbackProps> = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-premium p-12 max-w-lg w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-display font-black text-[#1E3A5F] tracking-tight">
            Something went wrong
          </h1>
          <p className="text-slate-500 font-medium">
            The application encountered an unexpected error. Your data is safe — please reload to continue.
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="bg-slate-50 rounded-xl p-4 text-left overflow-auto max-h-32 text-xs font-mono text-slate-500 border border-slate-100">
            <p className="font-bold text-slate-600 mb-1">Error details (dev only):</p>
            <p className="truncate">Reload the page to continue working.</p>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={() => window.location.reload()}
            className="h-14 px-12 rounded-xl bg-[#4A9FD4] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200/50 hover:bg-[#4A9FD4]/95 transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined">refresh</span>
            Reload Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalErrorFallback;
