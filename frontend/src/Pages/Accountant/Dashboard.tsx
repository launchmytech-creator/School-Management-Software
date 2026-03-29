import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountantLayout from '../../layouts/AccountantLayout';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { feeService, type FeeTransaction } from '../../services/feeService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, getLocalDateString } from '../../lib/utils';

interface FeeStats {
  todayCollection: number;
  monthCollection: number;
  pendingAmount: number;
  defaulterCount: number;
  receiptsToday: number;
  yesterdayCollection: number;
  lastMonthCollection: number;
  todayPercentChange: number;
  monthPercentChange: number;
}

interface NotificationItem {
  id: number;
  notificationType: string;
  message: string;
  status: string;
  createdAt: string;
}

const AccountantDashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('6months');
  const [stats, setStats] = useState<FeeStats>({
    todayCollection: 0,
    monthCollection: 0,
    pendingAmount: 0,
    defaulterCount: 0,
    receiptsToday: 0,
    yesterdayCollection: 0,
    lastMonthCollection: 0,
    todayPercentChange: 0,
    monthPercentChange: 0,
  });
  const [recentReceipts, setRecentReceipts] = useState<FeeTransaction[]>([]);
  const [chartData, setChartData] = useState<{ month: string; amount: number; height: number }[]>([]);
  const [remindersSent, setRemindersSent] = useState<NotificationItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // Get yesterday and last month dates
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      // Fetch all transactions (not just paid) for accurate stats
      const academicYearId = selectedYear?.id ? parseInt(selectedYear.id) : undefined;
      const [allTransactions, defaulters, notifications] = await Promise.all([
        feeService.getFeeTransactions({ academicYearId }),
        feeService.getFeeDefaulters(undefined),
        notificationService.getMyNotifications({ type: 'fee_reminder', limit: 10 }),
      ]);

      // Get paid transactions for collection calculations
      const paidTransactions = allTransactions.filter(t => t.status === 'paid');
      
      const today = getLocalDateString();
      
      // Today's stats
      const todayReceipts = paidTransactions.filter(t => t.paymentDate?.startsWith(today));
      const todayTotal = todayReceipts.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      
      // Yesterday's stats
      const yesterdayReceipts = paidTransactions.filter(t => t.paymentDate?.startsWith(yesterdayStr));
      const yesterdayTotal = yesterdayReceipts.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      
      // This month stats
      const monthReceipts = paidTransactions.filter(t => {
        const date = new Date(t.paymentDate || '');
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      const monthTotal = monthReceipts.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      
      // Last month stats
      const lastMonthReceipts = paidTransactions.filter(t => {
        const date = new Date(t.paymentDate || '');
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      });
      const lastMonthTotal = lastMonthReceipts.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      
      // Pending amounts (from all transactions)
      const pendingTotal = allTransactions.reduce((sum, t) => {
        const pending = (t.amountDue || 0) - (t.amountPaid || 0);
        return sum + (pending > 0 ? pending : 0);
      }, 0);
      
      // Calculate percentage changes
      const calculatePercentChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };
      
      const todayPercentChange = calculatePercentChange(todayTotal, yesterdayTotal);
      const monthPercentChange = calculatePercentChange(monthTotal, lastMonthTotal);
      
      const todayReminders = notifications.filter(n => n.createdAt.startsWith(today));

      setStats({
        todayCollection: todayTotal,
        monthCollection: monthTotal,
        pendingAmount: pendingTotal,
        defaulterCount: defaulters.length,
        receiptsToday: todayReceipts.length,
        yesterdayCollection: yesterdayTotal,
        lastMonthCollection: lastMonthTotal,
        todayPercentChange,
        monthPercentChange,
      });

      setRecentReceipts(paidTransactions.slice(0, 5));
      setRemindersSent(todayReminders);

      // Build monthly data for chart
      const monthlyMap = new Map<string, number>();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      paidTransactions.forEach(t => {
        if (t.paymentDate) {
          const date = new Date(t.paymentDate);
          if (date.getFullYear() === currentYear) {
            const monthName = monthNames[date.getMonth()];
            monthlyMap.set(monthName, (monthlyMap.get(monthName) || 0) + (t.amountPaid || 0));
          }
        }
      });

      const monthlyData = monthNames.map(month => ({
        month,
        amount: monthlyMap.get(month) || 0,
      }));

      const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);
      setChartData(monthlyData.map(d => ({
        ...d,
        height: (d.amount / maxAmount) * 100,
      })));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, showNotification]);

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

  // Filter chart data based on dropdown selection
  const filteredChartData = React.useMemo(() => {
    if (chartFilter === '6months') {
      const currentMonth = new Date().getMonth();
      return chartData.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    }
    return chartData;
  }, [chartData, chartFilter]);

  const handlePrintReceipt = (receipt: FeeTransaction) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
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
            <tr><td>Student Name:</td><td>${receipt.studentName || 'N/A'}</td></tr>
            <tr><td>Admission Number:</td><td>${receipt.admissionNumber || 'N/A'}</td></tr>
            <tr><td>Class:</td><td>${receipt.className || 'N/A'}</td></tr>
            <tr><td>Fee Type:</td><td>${receipt.feeType || 'N/A'}</td></tr>
            <tr><td>Amount Due:</td><td>${formatCurrency(receipt.amountDue || 0)}</td></tr>
            <tr><td>Amount Paid:</td><td>${formatCurrency(receipt.amountPaid || 0)}</td></tr>
            <tr><td>Payment Date:</td><td>${formatDate(receipt.paymentDate || '')}</td></tr>
            <tr><td>Payment Mode:</td><td>${receipt.paymentMode || 'N/A'}</td></tr>
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

  return (
    <AccountantLayout title="Dashboard">
      <div className="space-y-8 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-card border border-slate-200">
                <div className="h-4 bg-slate-200 rounded w-24 mb-3 animate-pulse"></div>
                <div className="h-8 bg-slate-200 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm font-medium">Today's Collection</p>
                <h3 className="text-2xl font-bold text-primary mt-1 font-display">
                  {formatCurrency(stats.todayCollection)}
                </h3>
                <p className={`text-xs mt-2 flex items-center gap-1 font-semibold ${stats.todayPercentChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <span className="material-symbols-outlined text-sm">{stats.todayPercentChange >= 0 ? 'trending_up' : 'trending_down'}</span>
                  {stats.todayPercentChange >= 0 ? '+' : ''}{stats.todayPercentChange}% from yesterday
                </p>
              </div>

              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm font-medium">This Month Collection</p>
                <h3 className="text-2xl font-bold text-primary mt-1 font-display">
                  {formatCurrency(stats.monthCollection)}
                </h3>
                <p className={`text-xs mt-2 flex items-center gap-1 font-semibold ${stats.monthPercentChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <span className="material-symbols-outlined text-sm">{stats.monthPercentChange >= 0 ? 'trending_up' : 'trending_down'}</span>
                  {stats.monthPercentChange >= 0 ? '+' : ''}{stats.monthPercentChange}% from last month
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
                  <select 
                    value={chartFilter}
                    onChange={(e) => setChartFilter(e.target.value)}
                    className="text-sm border-slate-200 rounded-button text-slate-500 px-3 py-1"
                  >
                    <option value="6months">Last 6 Months</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex items-end justify-between h-64 gap-4 px-2">
                  {filteredChartData.map((data, index) => (
                    <div key={data.month} className="flex-1 flex flex-col items-center gap-2 group">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          index === filteredChartData.length - 1
                            ? 'bg-primary rounded-t-lg shadow-lg'
                            : 'bg-accent-sky/30 group-hover:bg-accent-sky/50'
                        }`}
                        style={{ height: `${Math.max(data.height, 5)}%` }}
                        title={`${data.month}: ${formatCurrency(data.amount)}`}
                      ></div>
                      <span className={`text-xs font-semibold ${
                        index === filteredChartData.length - 1 ? 'font-bold text-primary' : 'text-slate-500'
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
                  <button 
                    className="w-full bg-accent-sky hover:bg-accent-sky/90 text-white font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors"
                    onClick={() => navigate('/accountant/fees')}
                  >
                    <span className="material-symbols-outlined text-xl">add_card</span>
                    Generate Receipt
                  </button>
                  <button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors"
                    onClick={() => navigate('/accountant/students')}
                  >
                    <span className="material-symbols-outlined text-xl">group</span>
                    View Students
                  </button>
                  <button 
                    className="w-full border-2 border-accent-orange text-accent-orange hover:bg-accent-orange/5 font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors"
                    onClick={() => navigate('/accountant/fee-defaulters')}
                  >
                    <span className="material-symbols-outlined text-xl">notifications_active</span>
                    Send Fee Reminder
                  </button>
                  <button 
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-button flex items-center justify-center gap-2 transition-colors"
                    onClick={() => navigate('/accountant/reports')}
                  >
                    <span className="material-symbols-outlined text-xl">download</span>
                    View Reports
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-primary font-display">Recent Receipts</h3>
                  <button 
                    className="text-accent-sky text-sm font-semibold hover:underline"
                    onClick={() => navigate('/accountant/fees')}
                  >
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
                            <p className="text-xs text-slate-400">{formatDate(receipt.paymentDate || '')}</p>
                          </div>
                          <button 
                            className="size-8 flex items-center justify-center text-slate-400 hover:text-accent-sky transition-colors"
                            onClick={() => handlePrintReceipt(receipt)}
                            title="Print Receipt"
                          >
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
                    <button 
                    className="text-accent-sky text-sm font-semibold hover:underline"
                    onClick={() => navigate('/accountant/fee-defaulters')}
                  >
                    Send Reminders
                  </button>
                </div>
                <div className="space-y-4">
                  {remindersSent.length > 0 ? (
                    remindersSent.slice(0, 3).map((reminder) => (
                      <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg border-l-2 border-l-amber-500 bg-amber-50/30">
                        <div>
                          <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                            {reminder.message}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            {formatDate(reminder.createdAt)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          reminder.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                          reminder.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {reminder.status}
                        </span>
                      </div>
                    ))
                  ) : stats.defaulterCount > 0 ? (
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
                      <button 
                        className="px-3 py-1.5 bg-accent-orange text-white text-xs font-bold rounded-button hover:bg-accent-orange/90"
                        onClick={() => navigate('/accountant/fee-defaulters')}
                      >
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
