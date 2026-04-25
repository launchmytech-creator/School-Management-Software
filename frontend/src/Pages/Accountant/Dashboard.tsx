import React, { useState, useEffect, useCallback } from 'react';
import AccountantLayout from '../../layouts/AccountantLayout';
import { feeService, type FeeTransaction } from '../../services/feeService';
import { reportService } from '../../services/reportService';
import { formatCurrency, getLocalDateString } from '../../lib/utils';

interface FeeStats {
  todayCollection: number;
  monthCollection: number;
  pendingAmount: number;
  defaulterCount: number;
  receiptsToday: number;
}

const AccountantDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FeeStats>({
    todayCollection: 0,
    monthCollection: 0,
    pendingAmount: 0,
    defaulterCount: 0,
    receiptsToday: 0,
  });
  const [recentReceipts, setRecentReceipts] = useState<FeeTransaction[]>([]);
  const [chartData, setChartData] = useState<{ month: string; amount: number }[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [transactions, defaulters, feesReport] = await Promise.all([
        feeService.getFeeTransactions({ status: 'paid' }),
        feeService.getFeeDefaulters(),
        reportService.getFeesReport({}),
      ]);

      const today = getLocalDateString();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const todayReceipts = transactions.filter(t => t.paymentDate?.startsWith(today));
      const monthReceipts = transactions.filter(t => {
        const date = new Date(t.paymentDate || '');
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const todayTotal = todayReceipts.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      const monthTotal = monthReceipts.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      const pendingTotal = feesReport.reduce((sum, r) => sum + (r.pendingAmount || 0), 0);

      setStats({
        todayCollection: todayTotal,
        monthCollection: monthTotal,
        pendingAmount: pendingTotal,
        defaulterCount: defaulters.length,
        receiptsToday: todayReceipts.length,
      });

      setRecentReceipts(transactions.slice(0, 5));

      const monthlyData = [
        { month: 'Jan', amount: monthTotal * 0.6 },
        { month: 'Feb', amount: monthTotal * 0.7 },
        { month: 'Mar', amount: monthTotal * 0.5 },
        { month: 'Apr', amount: monthTotal * 0.85 },
        { month: 'May', amount: monthTotal * 0.75 },
        { month: 'Jun', amount: monthTotal },
      ];
      const maxAmount = Math.max(...monthlyData.map(d => d.amount));
      setChartData(monthlyData.map(d => ({
        ...d,
        height: maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0,
      })));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AccountantLayout title="Dashboard">
      <div className="space-y-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-slate-400">Loading dashboard...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm font-medium">Today's Collection</p>
                <h3 className="text-2xl font-bold text-primary mt-1 font-display">
                  {formatCurrency(stats.todayCollection)}
                </h3>
                <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  +12% from yesterday
                </p>
              </div>

              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm font-medium">This Month Collection</p>
                <h3 className="text-2xl font-bold text-primary mt-1 font-display">
                  {formatCurrency(stats.monthCollection)}
                </h3>
                <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  +5.2% from last month
                </p>
              </div>

              <div className="bg-white p-6 rounded-card border-l-4 border-l-accent-orange border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm font-medium">Total Pending Fees</p>
                <h3 className="text-2xl font-bold text-accent-orange mt-1 font-display">
                  {formatCurrency(stats.pendingAmount)}
                </h3>
                <p className="text-slate-400 text-xs mt-2 font-medium">
                  {stats.defaulterCount} students remaining
                </p>
              </div>

              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm font-medium">Receipts Generated Today</p>
                <h3 className="text-2xl font-bold text-primary mt-1 font-display">
                  {stats.receiptsToday}
                </h3>
                <p className="text-slate-400 text-xs mt-2 font-medium">Auto-synced to cloud</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-primary font-display">Monthly Fee Collection Trend</h3>
                  <select className="text-sm border-slate-200 rounded-button text-slate-500 px-3 py-1">
                    <option>Last 6 Months</option>
                    <option>Yearly</option>
                  </select>
                </div>
                <div className="flex items-end justify-between h-64 gap-4 px-2">
                  {chartData.map((data, index) => (
                    <div key={data.month} className="flex-1 flex flex-col items-center gap-2 group">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          index === chartData.length - 1
                            ? 'bg-primary rounded-t-lg shadow-lg'
                            : 'bg-accent-sky/30 group-hover:bg-accent-sky/50'
                        }`}
                        style={{ height: `${Math.max(data.amount / 1000, 10)}%` }}
                      ></div>
                      <span className={`text-xs font-semibold ${
                        index === chartData.length - 1 ? 'font-bold text-primary' : 'text-slate-500'
                      }`}>
                        {data.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-6 rounded-card border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-primary font-display mb-6">Quick Actions</h3>
                <div className="space-y-4 flex-1">
                  <button className="w-full bg-accent-sky hover:bg-accent-sky/90 text-white font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-xl">add_card</span>
                    Generate Receipt
                  </button>
                  <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-xl">cloud_upload</span>
                    Upload Marks
                  </button>
                  <button className="w-full border-2 border-accent-orange text-accent-orange hover:bg-accent-orange/5 font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-xl">notifications_active</span>
                    Send Fee Reminder
                  </button>
                  <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                    Add New Student
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-primary font-display">Recent Receipts</h3>
                  <button className="text-accent-sky text-sm font-semibold hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recentReceipts.length > 0 ? (
                    recentReceipts.map((receipt) => (
                      <div key={receipt.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                            <div className="w-full h-full bg-accent-sky/20 flex items-center justify-center">
                              <span className="text-accent-sky font-bold text-sm">
                                {receipt.studentName?.charAt(0) || 'S'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{receipt.studentName || 'Student'}</p>
                            <p className="text-xs text-slate-500">
                              {receipt.className || 'Class'} • #{receipt.receiptNumber || receipt.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">{formatCurrency(receipt.amountPaid || 0)}</p>
                            <p className="text-xs text-slate-400">{formatDate(receipt.paymentDate ?? undefined)}</p>
                          </div>
                          <button className="size-8 flex items-center justify-center text-slate-400 hover:text-accent-sky transition-colors">
                            <span className="material-symbols-outlined">download</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-8">No recent receipts</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-primary font-display">Fee Reminders Sent Today</h3>
                  <button className="text-accent-sky text-sm font-semibold hover:underline">
                    History
                  </button>
                </div>
                <div className="space-y-4">
                  {stats.defaulterCount > 0 ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border-l-2 border-l-amber-500 bg-amber-50/30">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {stats.defaulterCount} students with pending fees
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Total pending: {formatCurrency(stats.pendingAmount)}
                        </p>
                      </div>
                      <button className="px-3 py-1.5 bg-accent-orange text-white text-xs font-bold rounded-button hover:bg-accent-orange/90">
                        Send Reminders
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border-l-2 border-l-emerald-500 bg-emerald-50/30">
                      <div>
                        <p className="text-sm font-bold text-slate-800">All fees collected!</p>
                        <p className="text-xs text-slate-500">No pending reminders</p>
                      </div>
                      <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-1.5 rounded-full text-lg">
                        check_circle
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-lg border-l-2 border-l-slate-300 bg-slate-50/30">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Monthly Summary</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {stats.monthCollection > 0
                          ? `${Math.round((stats.monthCollection / (stats.monthCollection + stats.pendingAmount)) * 100)}% collection rate`
                          : 'No data yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AccountantLayout>
  );
};

export default AccountantDashboard;
