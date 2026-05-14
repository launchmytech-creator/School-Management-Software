import React, { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import AdminStatCard from "../../components/dashboard/AdminStatCard";
import { useAccountantDashboard } from "../../hooks/queries";
import { formatCurrency, formatDate } from "../../lib/utils";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  AlertCircle,
  Users,
  FileText,
  Printer,
  Send,
  Download,
} from "lucide-react";

const FeeLineChart = lazy(() => 
  import("../../components/charts/FeeLineChart").then(m => ({ default: m.default }))
);

const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [chartFilter, setChartFilter] = useState("6months");
  const { data, isLoading } = useAccountantDashboard();

  const stats = data?.stats ?? {
    todayCollection: 0,
    monthCollection: 0,
    pendingAmount: 0,
    defaulterCount: 0,
    receiptsToday: 0,
  };

  const recentReceipts = data?.recentReceipts ?? [];

  const filteredChartData = useMemo(() => {
    const chartData = data?.monthlyChart ?? [];
    if (chartFilter === "6months") {
      const currentMonth = new Date().getMonth();
      return chartData.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    }
    return chartData;
  }, [data?.monthlyChart, chartFilter]);

  const handlePrintReceipt = (receipt: {
    id: number;
    receiptNumber?: string | null;
    studentName?: string;
    admissionNumber?: string;
    className?: string;
    amountDue?: number;
    amountPaid?: number;
    paymentDate?: string | null;
    paymentMode?: string | null;
  }) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${receipt.receiptNumber || receipt.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .details { margin-bottom: 30px; }
          .details table { width: 100%; }
          .details td { padding: 8px 0; }
          .details td:first-child { font-weight: bold; width: 40%; }
          .total { font-size: 20px; font-weight: bold; text-align: right; margin: 20px 0; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fee Receipt</h1>
          <p>Receipt No: ${receipt.receiptNumber || receipt.id}</p>
        </div>
        <div class="details">
          <table>
            <tr><td>Student Name:</td><td>${receipt.studentName || "N/A"}</td></tr>
            <tr><td>Admission Number:</td><td>${receipt.admissionNumber || "N/A"}</td></tr>
            <tr><td>Class:</td><td>${receipt.className || "N/A"}</td></tr>
            <tr><td>Amount Due:</td><td>${formatCurrency(receipt.amountDue || 0)}</td></tr>
            <tr><td>Amount Paid:</td><td>${formatCurrency(receipt.amountPaid || 0)}</td></tr>
            <tr><td>Payment Date:</td><td>${formatDate(receipt.paymentDate || "")}</td></tr>
            <tr><td>Payment Mode:</td><td>${receipt.paymentMode || "N/A"}</td></tr>
          </table>
        </div>
        <div class="total">Pending: ${formatCurrency((receipt.amountDue || 0) - (receipt.amountPaid || 0))}</div>
        <div class="footer">
          <p>Thank you for your payment!</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const statCards = [
    {
      label: "Today's Collection",
      value: formatCurrency(stats.todayCollection),
      icon: DollarSign,
      variant: "emerald" as const,
      onClick: () => navigate("/accountant/fees"),
    },
    {
      label: "This Month",
      value: formatCurrency(stats.monthCollection),
      icon: Receipt,
      variant: "blue" as const,
      onClick: () => navigate("/accountant/fees"),
    },
    {
      label: "Total Pending",
      value: formatCurrency(stats.pendingAmount),
      icon: AlertCircle,
      variant: "rose" as const,
      onClick: () => navigate("/accountant/fee-defaulters"),
    },
    {
      label: "Receipts Today",
      value: stats.receiptsToday,
      icon: FileText,
      variant: "default" as const,
      onClick: () => navigate("/accountant/fees"),
    },
  ];

  return (
      <div className="space-y-10 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="w-11 h-11 bg-slate-200 rounded-xl"></div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, index) => (
                <AdminStatCard key={index} {...stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Monthly Fee Collection
                  </h3>
                  <select
                    value={chartFilter}
                    onChange={(e) => setChartFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg text-slate-500 px-3 py-1.5 bg-white"
                  >
                    <option value="6months">Last 6 Months</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="h-64 w-full">
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <LoadingSpinner size="md" message="Loading chart..." />
                    </div>
                  }>
                    <FeeLineChart data={filteredChartData} />
                  </Suspense>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-5">
                  Quick Actions
                </h3>
                <div className="space-y-2.5">
                  <button
                    className="w-full bg-[#4A9FD4] hover:bg-[#3A8FC4] text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    onClick={() => navigate("/accountant/fees")}
                  >
                    <DollarSign className="w-4 h-4" />
                    Generate Receipt
                  </button>
                  <button
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    onClick={() => navigate("/accountant/students")}
                  >
                    <Users className="w-4 h-4" />
                    View Students
                  </button>
                  <button
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-rose-200 text-sm"
                    onClick={() => navigate("/accountant/fee-defaulters")}
                  >
                    <Send className="w-4 h-4" />
                    Send Reminders
                  </button>
                  <button
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    onClick={() => navigate("/accountant/reports")}
                  >
                    <Download className="w-4 h-4" />
                    View Reports
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    Recent Receipts
                  </h3>
                  <button
                    className="text-[#4A9FD4] text-sm font-medium hover:underline"
                    onClick={() => navigate("/accountant/fees")}
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {recentReceipts.length > 0 ? (
                    recentReceipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#4A9FD4]/10 flex items-center justify-center">
                            <span className="text-[#4A9FD4] font-semibold text-xs">
                              {receipt.studentName?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {receipt.studentName || "Student"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {receipt.className || "Class"} • #
                              {receipt.receiptNumber || receipt.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-800">
                              {formatCurrency(receipt.amountPaid || 0)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(receipt.paymentDate || "")}
                            </p>
                          </div>
                          <button
                            className="size-7 flex items-center justify-center text-slate-400 hover:text-[#4A9FD4] transition-colors"
                            onClick={() => handlePrintReceipt(receipt)}
                            title="Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-8">
                      No recent receipts
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    Fee Reminders
                  </h3>
                  <button
                    className="text-[#4A9FD4] text-sm font-medium hover:underline"
                    onClick={() => navigate("/accountant/fee-defaulters")}
                  >
                    Send Reminders
                  </button>
                </div>
                <div className="space-y-2">
                  {stats.defaulterCount > 0 ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border-l-2 border-l-amber-500 bg-amber-50/30">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {stats.defaulterCount} students with pending fees
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Total pending: {formatCurrency(stats.pendingAmount)}
                        </p>
                      </div>
                      <button
                        className="px-3 py-1.5 bg-rose-500 text-white text-xs font-medium rounded-lg hover:bg-rose-600"
                        onClick={() => navigate("/accountant/fee-defaulters")}
                      >
                        Send Reminders
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border-l-2 border-l-emerald-500 bg-emerald-50/30">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          All fees collected!
                        </p>
                        <p className="text-xs text-slate-500">
                          No pending reminders
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-xl border-l-2 border-l-slate-300 bg-slate-50/30">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Monthly Summary
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {stats.monthCollection > 0
                          ? `${Math.round((stats.monthCollection / (stats.monthCollection + stats.pendingAmount)) * 100)}% collection rate`
                          : "No data yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default AccountantDashboard;
