import React, { useState, useEffect, useCallback } from 'react';
import AccountantLayout from '../../layouts/AccountantLayout';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { feeService, type FeeTransaction, type RecordPaymentDto } from '../../services/feeService';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Receipt } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { SkeletonTable } from '../../components/common/Skeleton';

const AccountantFeeCollection: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FeeTransaction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<RecordPaymentDto>({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const filters: { classId?: number; status?: string } = {};
      
      if (selectedClass) filters.classId = parseInt(selectedClass);
      if (statusFilter) filters.status = statusFilter;
      
      const data = await feeService.getFeeTransactions(filters);
      setTransactions(data);
    } catch {
      showNotification('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, statusFilter, showNotification]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const cls = await classService.getClasses();
        setClasses(cls);
      } catch {
        showNotification('Failed to fetch filters', 'error');
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTransactions = transactions.filter(t =>
    t.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: transactions.length,
    paid: transactions.filter(t => t.status === 'paid').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    partial: transactions.filter(t => t.status === 'partial').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'partial':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            <AlertTriangle className="w-3 h-3" /> Partial
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
            {status}
          </span>
        );
    }
  };

  const openPaymentModal = (transaction: FeeTransaction) => {
    setSelectedTransaction(transaction);
    const remaining = (transaction.amountDue || 0) - (transaction.amountPaid || 0);
    setPaymentData({
      amount: remaining,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedTransaction || !paymentData.amount) {
      showNotification('Please enter payment amount', 'error');
      return;
    }

    try {
      setProcessing(true);
      await feeService.recordPayment(selectedTransaction.id, paymentData);
      showNotification('Payment recorded successfully', 'success');
      setShowPaymentModal(false);
      fetchData();
    } catch {
      showNotification('Failed to record payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AccountantLayout title="Fee Collection">
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Transactions</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-card border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.paid}</p>
                <p className="text-sm text-emerald-600">Paid</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-card border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-sm text-amber-600">Pending</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-card border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.partial}</p>
                <p className="text-sm text-blue-600">Partial</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => { setSelectedClass(''); setStatusFilter(''); }} className="w-full">
              Clear Filters
            </Button>
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
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
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
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {transaction.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentModal(transaction)}
                            className="gap-1.5"
                          >
                            <Receipt className="w-4 h-4" />
                            Record
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={DollarSign}
            title="No transactions found"
            description="No fee transactions match your current filters"
          />
        )}

        <BaseModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Record Payment"
          size="md"
        >
          {selectedTransaction && (
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Student</p>
                    <p className="font-semibold text-slate-900">{selectedTransaction.studentName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Fee Type</p>
                    <p className="font-semibold text-slate-900">{selectedTransaction.feeType}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Amount</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(selectedTransaction.amountDue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Already Paid</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(selectedTransaction.amountPaid || 0)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Remaining</p>
                    <p className="font-bold text-accent-orange text-lg">
                      {formatCurrency((selectedTransaction.amountDue || 0) - (selectedTransaction.amountPaid || 0))}
                    </p>
                  </div>
                </div>
              </div>

              <InputField
                label="Payment Amount"
                type="number"
                value={paymentData.amount || ''}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
              />

              <InputField
                label="Payment Date"
                type="date"
                value={paymentData.paymentDate || ''}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                <select
                  value={paymentData.paymentMethod || 'cash'}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRecordPayment} loading={processing} className="flex-1">
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </BaseModal>
      </div>
    </AccountantLayout>
  );
};

export default AccountantFeeCollection;
