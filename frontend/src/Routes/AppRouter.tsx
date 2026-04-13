import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../Pages/Auth/Login";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import NotFound from "../Pages/NotFound";

// Route chunks — only loaded when the user navigates to that role's pages
const SuperAdminRoutes = lazy(() => import("./superAdminRoutes"));
const AdminRoutes = lazy(() => import("./adminRoutes"));
const AccountantRoutes = lazy(() => import("./accountantRoutes"));
const TeacherRoutes = lazy(() => import("./teacherRoutes"));
const ParentRoutes = lazy(() => import("./parentRoutes"));

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoutes />
          </Suspense>
        </ProtectedRoute>
      }
    />

    <Route
      path="/admin/*"
      element={
        <ProtectedRoute allowedRoles={["school_admin"]}>
          <Suspense fallback={<PageLoader />}>
            <AdminRoutes />
          </Suspense>
        </ProtectedRoute>
      }
    />

    <Route
      path="/accountant/*"
      element={
        <ProtectedRoute allowedRoles={["accountant"]}>
          <Suspense fallback={<PageLoader />}>
            <AccountantRoutes />
          </Suspense>
        </ProtectedRoute>
      }
    />

    <Route
      path="/teacher/*"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <Suspense fallback={<PageLoader />}>
            <TeacherRoutes />
          </Suspense>
        </ProtectedRoute>
      }
    />

    <Route
      path="/parent/*"
      element={
        <ProtectedRoute allowedRoles={["parent"]}>
          <Suspense fallback={<PageLoader />}>
            <ParentRoutes />
          </Suspense>
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRouter;

