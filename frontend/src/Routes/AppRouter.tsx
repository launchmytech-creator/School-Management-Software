import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../Pages/Auth/Login";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import superAdminRoutes from "./superAdminRoutes";
import adminRoutes from "./adminRoutes";
import accountantRoutes from "./accountantRoutes";
import teacherRoutes from "./teacherRoutes";
import parentRoutes from "./parentRoutes";

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />

    <Route
      path="/super-admin/*"
      element={
        <ProtectedRoute allowedRoles={["super_admin"]}>
          {superAdminRoutes}
        </ProtectedRoute>
      }
    />

    <Route
      path="/admin/*"
      element={
        <ProtectedRoute allowedRoles={["school_admin"]}>
          {adminRoutes}
        </ProtectedRoute>
      }
    />

    <Route
      path="/accountant/*"
      element={
        <ProtectedRoute allowedRoles={["accountant"]}>
          {accountantRoutes}
        </ProtectedRoute>
      }
    />

    <Route
      path="/teacher/*"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          {teacherRoutes}
        </ProtectedRoute>
      }
    />

    <Route
      path="/parent/*"
      element={
        <ProtectedRoute allowedRoles={["parent"]}>
          {parentRoutes}
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRouter;
