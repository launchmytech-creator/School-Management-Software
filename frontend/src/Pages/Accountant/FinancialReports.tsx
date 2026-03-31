import React, { useState, useEffect, useCallback } from 'react';
import AccountantLayout from '../../layouts/AccountantLayout';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { feeService, type FeeTransaction } from '../../services/feeService';
import { feeStructureService } from '../../services/feeStructureService';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Calendar,
  Download,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { SkeletonTable } from '../../components/common/Skeleton';

interface FeeSummary {
  totalStudents: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  collectionPercentage: number;
  byStatus: { status: string; count: number; amount: number }[];
}

const FinancialReports: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeTypes, setFeeTypes] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        const types = await feeStructureService.getUniqueFeeTypes();
        setFeeTypes(types);
      } catch {
        // Ignore error
      }
    };
    fetchFeeTypes();
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const cls = await classService.getClasses();
      setClasses(cls);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [showNotification]);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      
      const transactionsData = await feeService.getFeeTransactions({
        classId: selectedClass ? parseInt(selectedClass) : undefined,
        academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
      });
      
      const uniqueStudents = new Set(transactionsData.map(t => t.studentId));
      const totalAmount = transactionsData.reduce((sum, t) => sum + t.amountDue, 0);
      const collectedAmount = transactionsData.reduce((sum, t) => sum + t.amountPaid, 0);
      const pendingAmount = transactionsData.reduce((sum, t) => sum + (t.amountDue - t.amountPaid), 0);
      const collectionPercentage = totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0;
      
      const computedSummary: FeeSummary = {
        totalStudents: uniqueStudents.size,
        totalAmount,
        collectedAmount,
        pendingAmount,
        collectionPercentage,
        byStatus: [],
      };
      
      setSummary(computedSummary);
      setTransactions(transactionsData);
    } catch {
      showNotification('Failed to fetch report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedYear, feeTypeFilter, showNotification]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const filteredTransactions = transactions.filter(t =>
    t.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    showNotification('Export feature coming soon', 'info');
  };

  return (
    <AccountantLayout title="Financial Reports" subtitle="Generate and view financial reports">
      <div className="space-y-6 pb-12">
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.collectedAmount)}</p>
                  <p className="text-sm text-slate-500">Total Collected</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-rose-600">{formatCurrency(summary.pendingAmount)}</p>
                  <p className="text-sm text-slate-500">Total Pending</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalStudents}</p>
                  <p className="text-sm text-slate-500">Total Students</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Receipt className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-600">{summary.collectionPercentage}%</p>
                  <p className="text-sm text-slate-500">Collection Rate</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl">
                  <DollarSign className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Filter Report
            </h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Fee Type</label>
              <select
                value={feeTypeFilter}
                onChange={(e) => setFeeTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Fee Types</option>
                {feeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setSelectedClass(''); setDateFrom(''); setDateTo(''); setFeeTypeFilter(''); }}
                className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => setSearchTerm('')}
          searchPlaceholder="Search by student name or admission number..."
        />

        {loading ? (
          <SkeletonTable columns={6} rows={8} />
        ) : filteredTransactions.length > 0 ? (
          <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Type</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-accent-sky/20 flex items-center justify-center">
                            <span className="text-accent-sky font-bold text-sm">
                              {transaction.studentName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{transaction.studentName}</p>
                            <p className="text-xs text-slate-500">{transaction.admissionNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{transaction.className}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{transaction.feeType}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(transaction.amountDue || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                        {formatCurrency(transaction.amountPaid || 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          transaction.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          transaction.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No transactions found"
            description="No fee transactions match your current filters"
          />
        )}
      </div>
    </AccountantLayout>
  );
};

export default FinancialReports;
