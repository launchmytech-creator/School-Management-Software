import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { parentService } from "../../services/parentService";
import { feeService } from "../../services/feeService";
import type { LinkedStudent } from "../../types/parent";
import type { FeeTransaction } from "../../services/feeService";
import { formatCurrency, formatDate } from "../../lib/utils";
import {
  Users,
  CheckCircle,
  XCircle,
  Receipt,
  GraduationCap,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

interface ChildFeeSummary {
  studentId: number;
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  totalPending: number;
}

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<LinkedStudent[]>([]);
  const [feeSummaries, setFeeSummaries] = useState<
    Map<number, ChildFeeSummary>
  >(new Map());
  const [selectedChild, setSelectedChild] = useState<LinkedStudent | null>(
    null,
  );
  const [childFees, setChildFees] = useState<FeeTransaction[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);

  const fetchChildren = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await parentService.getParentChildren(user.id);
      setChildren(data);
      if (data.length > 0 && !selectedChild) {
        setSelectedChild(data[0]);
      }
    } catch {
      showNotification("Failed to fetch children data", "error");
    }
  }, [user?.id, showNotification, selectedChild]);

  const fetchFeeSummaries = useCallback(async () => {
    if (!user?.id || children.length === 0) return;

    try {
      const summaries = new Map<number, ChildFeeSummary>();

      for (const child of children) {
        const fees = await feeService.getStudentFeeTransactions(child.id);
        const paid = fees.filter((f) => f.status === "paid").length;
        const pending = fees.filter((f) => f.status !== "paid").length;
        const totalPending = fees
          .filter((f) => f.status !== "paid")
          .reduce((sum, f) => sum + (f.amountDue - f.amountPaid), 0);

        summaries.set(child.id, {
          studentId: child.id,
          totalFees: fees.length,
          paidFees: paid,
          pendingFees: pending,
          totalPending,
        });
      }

      setFeeSummaries(summaries);
    } catch {
      showNotification("Failed to fetch fee summaries", "error");
    }
  }, [user?.id, children, showNotification]);

  const fetchChildFees = useCallback(async () => {
    if (!selectedChild) return;

    try {
      const data = await announcementService.getAnnouncements({ limit: 3 });
      setAnnouncements(data);
    } catch {
      showNotification("Failed to fetch fee details", "error");
    } finally {
      setLoadingFees(false);
    }
  }, [selectedChild, showNotification]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchChildren();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      fetchFeeSummaries();
    }
  }, [children]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildFees();
    }
  }, [selectedChild]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-rose-100 text-rose-700";
      case "partial":
        return "bg-amber-100 text-amber-700";
      case "waived":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Parent Portal">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" message="Loading dashboard..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Parent Portal">
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Welcome to Parent Portal"
          subtitle={`Hello, ${user?.fullName || "Parent"}! Track your child's academic progress and fee status.`}
        />

        {/* Children Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => {
            const summary = feeSummaries.get(child.id);
            return (
              <div
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                  selectedChild?.id === child.id
                    ? "border-blue-500 shadow-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">
                      {child.fullName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {child.className}{" "}
                      {child.classSection
                        ? `- Section ${child.classSection}`
                        : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600">
                      {summary?.paidFees || 0}
                    </p>
                    <p className="text-xs text-emerald-600">Paid</p>
                  </div>
                  <div className="text-center p-2 bg-rose-50 rounded-lg">
                    <p className="text-lg font-bold text-rose-600">
                      {summary?.pendingFees || 0}
                    </p>
                    <p className="text-xs text-rose-600">Pending</p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <p className="text-lg font-bold text-slate-600">
                      {formatCurrency(summary?.totalPending || 0)}
                    </p>
                    <p className="text-xs text-slate-600">Due</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fee Summary for Selected Child */}
        {selectedChild && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{childFees.length}</p>
                    <p className="text-sm text-blue-100">Total Fees</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">
                      {childFees.filter((f) => f.status === "paid").length}
                    </p>
                    <p className="text-sm text-emerald-600">Paid</p>
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-rose-700">
                      {childFees.filter((f) => f.status !== "paid").length}
                    </p>
                    <p className="text-sm text-rose-600">Pending</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700">
                      {formatCurrency(
                        childFees
                          .filter((f) => f.status !== "paid")
                          .reduce((sum, f) => sum + f.amountPending, 0),
                      )}
                    </p>
                    <p className="text-sm text-amber-600">Amount Due</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Details Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-900">
                  Fee Details - {selectedChild.fullName}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedChild.className}{" "}
                  {selectedChild.classSection
                    ? `- Section ${selectedChild.classSection}`
                    : ""}
                </p>
              </div>

              {loadingFees ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="md" message="Loading fees..." />
                </div>
              ) : childFees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">
                          Fee Type
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">
                          Academic Year
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">
                          Paid
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">
                          Pending
                        </th>
                        <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">
                          Due Date
                        </th>
                        <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {childFees.map((fee) => (
                        <tr
                          key={fee.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-900">
                              {fee.feeType}
                            </span>
                            {fee.amountPending > 0 && (
                              <span className="block text-xs text-slate-500">
                                Term {fee.amountPending}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {fee.admissionNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900">
                            {formatCurrency(fee.amountDue)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600">
                            {formatCurrency(fee.amountPaid)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-rose-600">
                            {formatCurrency(fee.amountPending)}
                          </td>
                          <td className="px-6 py-4 text-sm text-center text-slate-600">
                            {fee.dueDate ? formatDate(fee.dueDate) : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(fee.status)}`}
                            >
                              {fee.status.charAt(0).toUpperCase() +
                                fee.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="border-l-4 border-amber-400 pl-4 py-1"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {ann.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {ann.message}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <button className="text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                              Download Circular
                            </button>
                            <button className="text-xs font-semibold text-[#4A9FD4] hover:underline">
                              Read More
                            </button>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex-shrink-0">
                          {timeAgo(ann.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Children Message */}
        {children.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              No Students Linked
            </h3>
            <p className="text-slate-500">
              No students are linked to your account. Please contact the school
              administration.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ParentDashboard;
