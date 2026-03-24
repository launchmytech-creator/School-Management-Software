import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { feeService, type FeeTransaction, type RecordPaymentDto, type StudentFeeSummary } from '../../services/feeService';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { CheckCircle, XCircle, AlertTriangle, Receipt, Wallet, Percent, GraduationCap } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import { SkeletonTable } from '../../components/common/Skeleton';
import InputField from '../../components/ui/InputField';

const FeeCollection: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [studentFees, setStudentFees] = useState<StudentFeeSummary[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<FeeTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<RecordPaymentDto['paymentMode']>('cash');
  const [paymentDate, setPaymentDate] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [waiverAmount, setWaiverAmount] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses(selectedYear?.id);
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [selectedYear, showNotification]);

  const fetchStudentFees = useCallback(async () => {
    if (!selectedClass) {
      setStudentFees([]);
      return;
    }

    try {
      setLoading(true);
      const data = await feeService.getFeeTransactions({
        classId: parseInt(selectedClass),
      });
      const aggregated = feeService.aggregateByStudent(data);
      setStudentFees(aggregated);
    } catch {
      showNotification('Failed to fetch fee data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchStudentFees();
  }, [fetchStudentFees]);

  const handlePayment = async () => {
    if (!selectedTransaction || !paymentAmount) return;

    try {
      setProcessing(true);
      const data: RecordPaymentDto = {
        amountPaid: parseFloat(paymentAmount),
        paymentMode,
      };
      if (paymentDate) data.paymentDate = paymentDate;
      if (receiptNumber) data.receiptNumber = receiptNumber;

      await feeService.recordPayment(selectedTransaction.id, data);
      showNotification('Payment recorded successfully', 'success');
      setShowPaymentModal(false);
      setSelectedStudent(null);
      setSelectedTransaction(null);
      setPaymentAmount('');
      setPaymentMode('cash');
      setPaymentDate('');
      setReceiptNumber('');
      fetchStudentFees();
    } catch {
      showNotification('Failed to record payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = (student: StudentFeeSummary, transaction?: FeeTransaction) => {
    setSelectedStudent(student);
    const txToPay = transaction || student.pendingTransactions[0];
    if (txToPay) {
      setSelectedTransaction(txToPay);
      setPaymentAmount(txToPay.amountPending.toString());
    }
    setPaymentMode('cash');
    setPaymentDate('');
    setReceiptNumber('');
    setShowPaymentModal(true);
  };

  const openWaiverModal = (student: StudentFeeSummary, transaction: FeeTransaction) => {
    setSelectedStudent(student);
    setSelectedTransaction(transaction);
    setWaiverAmount('');
    setWaiverReason('');
    setShowWaiverModal(true);
  };

  const handleApplyWaiver = async () => {
    if (!selectedTransaction || !waiverAmount || !waiverReason) {
      showNotification('Please enter waiver amount and reason', 'error');
      return;
    }

    try {
      setProcessing(true);
      await feeService.applyWaiver(selectedTransaction.id, {
        waiverAmount: parseFloat(waiverAmount),
        waiverReason,
      });
      showNotification('Fee waiver applied successfully', 'success');
      setShowWaiverModal(false);
      setSelectedStudent(null);
      setSelectedTransaction(null);
      setWaiverAmount('');
      setWaiverReason('');
      fetchStudentFees();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply waiver';
      showNotification(message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const stats = {
    total: studentFees.length,
    paid: studentFees.filter(s => s.status === 'paid').length,
    pending: studentFees.filter(s => s.status === 'pending').length,
    partial: studentFees.filter(s => s.status === 'partial').length,
  };

  const totalAmountPending = studentFees.reduce((sum, s) => sum + s.totalPending, 0);

  const filteredStudents = studentFees.filter(s => {
    const matchesSearch = 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-rose-100 text-rose-700';
      case 'partial':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const selectedClassName = classes.find(c => c.id === parseInt(selectedClass))?.name || '';

  return (
    <AdminLayout title="Fee Collection">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Fee Collection"
          subtitle={selectedClass ? `Manage fee payments for Class ${selectedClassName}` : "Select a class to manage fee payments"}
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Fee Collection", active: true }
            ]
          }}
        />

        {!selectedClass ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <GraduationCap className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Select a Class</h3>
            <p className="text-amber-600 mb-6">
              Please select a class from the filter below to view student fee details
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    <p className="text-sm text-slate-500">Total Students</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Receipt className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
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

              <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-rose-700">{stats.pending}</p>
                    <p className="text-sm text-rose-600">Pending</p>
                  </div>
                  <div className="p-3 bg-rose-100 rounded-xl">
                    <XCircle className="w-5 h-5 text-rose-600" />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-amber-700">{stats.partial}</p>
                    <p className="text-sm text-amber-600">Partial</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalAmountPending)}</p>
                    <p className="text-sm text-blue-600">Total Pending</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex gap-3 items-center">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setStatusFilter('');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- Section ${cls.section}` : ''}</option>
                  ))}
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-32"
                >
                  <option value="">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>

                {(searchTerm || statusFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <SkeletonTable columns={7} rows={8} />
            ) : filteredStudents.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Admission No.</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Contact</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fee</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</th>
                        <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600">
                                {student.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{student.studentName}</p>
                                <p className="text-xs text-slate-500">{student.className}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-slate-600">{student.admissionNumber}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-slate-700">{student.parentName || '—'}</p>
                              {student.parentPhone && (
                                <p className="text-xs text-blue-600">{student.parentPhone}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-slate-900">{formatCurrency(student.totalAmount)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-emerald-600">{formatCurrency(student.totalPaid)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-rose-600">{formatCurrency(student.totalPending)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(student.status)}`}>
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {student.status !== 'paid' && (
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openPaymentModal(student)}
                                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  Collect
                                </Button>
                                {student.pendingTransactions.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openWaiverModal(student, student.pendingTransactions[0])}
                                    className="gap-1.5"
                                  >
                                    <Percent className="w-3.5 h-3.5" />
                                    Waiver
                                  </Button>
                                )}
                              </div>
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
                icon={Receipt}
                title="No students found"
                description={searchTerm || statusFilter ? "Try adjusting your filters" : "No fee records for this class"}
              />
            )}
          </>
        )}

        <BaseModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedStudent(null);
            setSelectedTransaction(null);
          }}
          title="Record Payment"
          size="md"
        >
          {selectedStudent && selectedTransaction && (
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Student</span>
                  <span className="font-semibold text-slate-900">{selectedStudent.studentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Class</span>
                  <span className="font-semibold">{selectedStudent.className}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Pending</span>
                  <span className="font-bold text-rose-600">{formatCurrency(selectedStudent.totalPending)}</span>
                </div>
              </div>

              {selectedStudent.pendingTransactions.length > 1 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Term to Pay</label>
                  <select
                    value={selectedTransaction.id}
                    onChange={(e) => {
                      const tx = selectedStudent.pendingTransactions.find(t => t.id === parseInt(e.target.value));
                      if (tx) {
                        setSelectedTransaction(tx);
                        setPaymentAmount(tx.amountPending.toString());
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {selectedStudent.pendingTransactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.feeType} - Term {tx.termNumber} ({formatCurrency(tx.amountPending)} pending)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fee Type</span>
                  <span className="font-semibold">{selectedTransaction.feeType} - Term {selectedTransaction.termNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Amount</span>
                  <span className="font-semibold">{formatCurrency(selectedTransaction.amountDue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Already Paid</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(selectedTransaction.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-700 font-semibold">Pending for this term</span>
                  <span className="font-bold text-rose-600">{formatCurrency(selectedTransaction.amountPending)}</span>
                </div>
              </div>

              <InputField
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount to collect"
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as RecordPaymentDto['paymentMode'])}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Defaults to today</p>
                </div>
                <InputField
                  label="Receipt Number"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedStudent(null);
                    setSelectedTransaction(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  loading={processing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </BaseModal>

        <BaseModal
          isOpen={showWaiverModal}
          onClose={() => {
            setShowWaiverModal(false);
            setSelectedStudent(null);
            setSelectedTransaction(null);
          }}
          title="Apply Fee Waiver"
          size="md"
        >
          {selectedStudent && selectedTransaction && (
            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-700">
                  A waiver will reduce the pending amount. This action will be recorded.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Student</span>
                  <span className="font-semibold text-slate-900">{selectedStudent.studentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fee Type</span>
                  <span className="font-semibold">{selectedTransaction.feeType} - Term {selectedTransaction.termNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Original Amount</span>
                  <span className="font-semibold">{formatCurrency(selectedTransaction.amountDue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pending Amount</span>
                  <span className="font-bold text-rose-600">{formatCurrency(selectedTransaction.amountPending)}</span>
                </div>
              </div>

              <InputField
                label="Waiver Amount"
                type="number"
                value={waiverAmount}
                onChange={(e) => setWaiverAmount(e.target.value)}
                placeholder="Enter waiver amount"
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Waiver Reason</label>
                <textarea
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  placeholder="Enter reason for waiver (e.g., scholarship, financial hardship, etc.)"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWaiverModal(false);
                    setSelectedStudent(null);
                    setSelectedTransaction(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyWaiver}
                  loading={processing}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Apply Waiver
                </Button>
              </div>
            </div>
          )}
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default FeeCollection;
