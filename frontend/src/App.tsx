import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AcademicYearProvider } from "./context/AcademicYearContext";
import AppRouter from "./Routes/AppRouter";

const App = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AcademicYearProvider>
          <AppRouter />
        </AcademicYearProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
