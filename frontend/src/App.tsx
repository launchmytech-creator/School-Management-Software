import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AcademicYearProvider } from "./context/AcademicYearContext";
import AppRouter from "./Routes/AppRouter";
import { ErrorBoundary, GlobalErrorFallback } from "./components/error";

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <NotificationProvider>
        <AuthProvider>
          <AcademicYearProvider>
            <AppRouter />
          </AcademicYearProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;
