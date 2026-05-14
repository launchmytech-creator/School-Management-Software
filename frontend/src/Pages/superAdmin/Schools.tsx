import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import AdminStatCard from "../../components/dashboard/AdminStatCard";
import type { School } from "../../types/school";
import { useSchoolStats, useToggleSchoolStatus } from "../../hooks/queries/useSchools";
import { usePagination } from "../../hooks/usePagination";
import { Building2, CheckCircle, XCircle } from "lucide-react";

const Schools: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: schools = [], stats, isLoading: loading } = useSchoolStats();
  const toggleMutation = useToggleSchoolStatus();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [plan, setPlan] = useState(searchParams.get("plan") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [subscriptionStatus, setSubscriptionStatus] = useState(searchParams.get("subscriptionStatus") || "");
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesSearch =
        !search ||
        school.name.toLowerCase().includes(search.toLowerCase()) ||
        school.id.toString().toLowerCase().includes(search.toLowerCase()) ||
        (school.email &&
          school.email.toLowerCase().includes(search.toLowerCase()));

      const matchesPlan = !plan || school.plan === plan;

      const matchesStatus =
        status === "" ||
        (status === "true" && school.status === true) ||
        (status === "false" && school.status === false);

      const matchesSubscriptionStatus =
        subscriptionStatus === "" ||
        school.subscriptionStatus.toLowerCase() === subscriptionStatus.toLowerCase();

      return matchesSearch && matchesPlan && matchesStatus && matchesSubscriptionStatus;
    });
  }, [schools, search, plan, status]);

  const {
    currentPage,
    setPage,
    totalPages,
    currentItems,
    hasNextPage,
    hasPrevPage,
  } = usePagination({
    items: filteredSchools,
    pageSize: 10,
    initialPage: 1,
  });

  const handleView = (school: School) => {
    navigate(`/super-admin/schools/${school.id}`);
  };

  const handleEdit = (school: School) => {
    navigate("/super-admin/create-school", { state: { school } });
  };

  const statItems = [
    {
      label: "Total Schools",
      value: stats.total,
      icon: Building2,
      variant: 'default' as const,
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      variant: 'emerald' as const,
    },
    {
      label: "Inactive",
      value: stats.inactive,
      icon: XCircle,
      variant: 'rose' as const,
    },
  ];

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleMutation.mutateAsync({ id, status: !currentStatus });
  };

  return (
    <MainLayout title="All Schools">
      <div className="space-y-12 pb-24">
        {/* Header with Search & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h2 className="text-[28px] font-display font-extrabold text-[#1E3A5F] mb-1">
              All Schools
            </h2>
            <p className="text-slate-400 text-sm font-medium tracking-tight">
              {stats.total} schools registered across all regions
            </p>
          </div>
          <button
            onClick={() => navigate("/super-admin/create-school")}
            className="h-12 px-8 bg-[#4A9FD4] text-white font-bold rounded-xl flex items-center gap-3 hover:bg-[#4A9FD4]/90 transition-all shadow-lg shadow-[#4A9FD4]/20 text-sm whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Create New School
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statItems.map((stat) => (
            <AdminStatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search schools by name, ID or principal..."
              className="w-full pl-12 pr-6 h-12 bg-[#F8FAFC] border border-slate-100 rounded-lg outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary text-sm text-slate-700 placeholder:text-slate-400 font-medium transition-all cursor-text"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <select
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value);
                setPage(1);
              }}
              className="h-12 px-5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm text-slate-600 font-bold min-w-[140px] appearance-none cursor-pointer"
            >
              <option value="">Plan: All</option>
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
              <option value="BUSINESS">Business</option>
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-12 px-5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm text-slate-600 font-bold min-w-[140px] appearance-none cursor-pointer"
            >
              <option value="">Status: All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={subscriptionStatus}
              onChange={(e) => {
                setSubscriptionStatus(e.target.value);
                setPage(1);
              }}
              className="h-12 px-5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm text-slate-600 font-bold min-w-[160px] appearance-none cursor-pointer"
            >
              <option value="">Subscription: All</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
            <button
              onClick={() => {
                setSearch("");
                setPlan("");
                setStatus("");
                setSubscriptionStatus("");
                setPage(1);
              }}
              className="text-primary text-[11px] font-black uppercase tracking-widest hover:underline px-4 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden  relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100">
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    School ID
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    School Name
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Plan
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Fee Terms
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Academic Year
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Subscription
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Created
                  </th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.length > 0
                  ? currentItems.map((school) => (
                      <tr
                        key={school.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-6 px-4 text-xs font-bold text-slate-400">
                          #{String(school.id).slice(-4).toUpperCase()}
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-white bg-primary shadow-sm overflow-hidden`}
                            >
                              {school.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                              {school.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span
                            className={`text-[9px] font-black px-3 py-1.5 rounded-lg tracking-widest leading-none border ${
                              school.plan === "BUSINESS"
                                ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                                : school.plan === "PREMIUM"
                                  ? "bg-[#4A9FD4] text-white border-[#4A9FD4]"
                                  : "bg-slate-400 text-white border-slate-400"
                            }`}
                          >
                            {school.plan}
                          </span>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                            {school.feeTerm}
                          </span>
                        </td>
                        <td className="py-6 px-4 text-center text-xs font-bold text-slate-500">
                          {school.academicYear}
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex justify-center">
                            <div
                              onClick={() =>
                                handleToggleStatus(school.id, school.status)
                              }
                              className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center shadow-inner transition-colors duration-300 ${school.status ? "bg-emerald-400" : "bg-red-300"}`}
                            >
                              <div
                                className={`w-3 h-3 bg-white rounded-full shadow absolute transition-all duration-300 transform ${school.status ? "translate-x-6" : "translate-x-1"}`}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span
                            className={`text-[9px] font-black px-3 py-1.5 rounded-md tracking-wider uppercase ${
                              school.subscriptionStatus === 'trial'
                                ? 'bg-blue-100 text-blue-700'
                                : school.subscriptionStatus === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : school.subscriptionStatus === 'suspended'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {school.subscriptionStatus}
                          </span>
                        </td>
                        <td className="py-6 px-4 text-[11px] font-bold text-slate-400">
                          {new Date(school.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-6 px-6 text-right">
                          <div className="flex justify-end gap-3 text-slate-300">
                            <button
                              onClick={() => handleView(school)}
                              className="hover:text-primary transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">
                                visibility
                              </span>
                            </button>
                            <button
                              onClick={() => handleEdit(school)}
                              className="hover:text-slate-500 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">
                                edit
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : !loading && (
                       <tr>
                         <td
                           colSpan={10}
                           className="py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic"
                         >
                           No matching schools found
                         </td>
                       </tr>
                    )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {currentItems.length} of {filteredSchools.length} schools
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrevPage}
                onClick={() => setPage(currentPage - 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_left
                </span>
              </button>
              <span className="px-4 text-xs font-bold text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={!hasNextPage}
                onClick={() => setPage(currentPage + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Schools;
