import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../Pages/Auth/Login";
import ForgotPassword from "../Pages/Auth/ForgotPassword";
import ResetPassword from "../Pages/Auth/ResetPassword";
import SubscriptionSuspended from "../Pages/Shared/SubscriptionSuspended";
import SubscriptionExpired from "../Pages/Shared/SubscriptionExpired";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import NotFound from "../Pages/NotFound";

const lazyWithRetry = (loader: () => Promise<{ default: React.ComponentType<any> }>) => {
  return lazy(async () => {
    try {
      return await loader();
    } catch {
      await new Promise<void>((res) => setTimeout(res, 1000));
      return loader();
    }
  });
};

const SuperAdminRoutes = lazyWithRetry(() => import("./superAdminRoutes"));
const AdminRoutes = lazyWithRetry(() => import("./adminRoutes"));
const AccountantRoutes = lazyWithRetry(() => import("./accountantRoutes"));
const TeacherRoutes = lazyWithRetry(() => import("./teacherRoutes"));
const ParentRoutes = lazyWithRetry(() => import("./parentRoutes"));

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
      path="/forgot-password"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />
    <Route
      path="/reset-password"
      element={
        <PublicRoute>
          <ResetPassword />
        </PublicRoute>
      }
    />

    <Route path="/subscription-suspended" element={<SubscriptionSuspended />} />
    <Route path="/subscription-expired" element={<SubscriptionExpired />} />

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
