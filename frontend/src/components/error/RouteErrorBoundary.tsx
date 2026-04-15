import React from "react";
import { useLocation } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import RouteErrorFallback from "./RouteErrorFallback";

const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <ErrorBoundary resetKeys={[location.pathname]} FallbackComponent={RouteErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
