import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user?.role) {
      const rolePaths: Record<string, string> = {
        school_admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        accountant: "/accountant/dashboard",
        parent: "/parent/dashboard",
        super_admin: "/super-admin/dashboard",
      };
      navigate(rolePaths[user.role] || "/login");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-center p-20">
      <div className="text-center max-w-sm">
        <div className="mb-4">
          <span
            className="material-symbols-outlined text-7xl text-slate-200"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            link_off
          </span>
        </div>

        <h1 className="text-6xl font-black text-[#1E3A5F] mb-2">404</h1>

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          Page Not Found
        </h2>

        <p className="text-slate-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-bold rounded-xl hover:bg-[#2a4d78] transition-colors"
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            home
          </span>
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
