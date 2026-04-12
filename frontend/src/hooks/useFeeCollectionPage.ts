import { useState, useMemo } from 'react';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useAuth } from '../context/AuthContext';
import { useClasses, useFeeTransactions } from './queries';
import { useRecordPayment, useApplyWaiver } from './mutations';
import { feeService, type FeeTransaction, type RecordPaymentDto } from '../services/feeService';
import type { TermGroup, StudentGroup, FeeCollectionStats, FeeCollectionHandlers } from '../types/fee';
import { formatCurrency } from '../lib/utils';

interface UseFeeCollectionPageReturn {
  classes: ReturnType<typeof useClasses>['data'];
  transactions: FeeTransaction[];
  isLoading: boolean;
  groupedByStudent: StudentGroup[];
  filteredStudents: StudentGroup[];
  stats: FeeCollectionStats;
  handlers: FeeCollectionHandlers;
}

export const useFeeCollectionPage = (): UseFeeCollectionPageReturn => {
  const { selectedYear } = useAcademicYear();
  const { user } = useAuth();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermGroup | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<FeeTransaction | null>(null);

  const { data: classesData } = useClasses(selectedYear?.id);
  const { data: transactions = [], isLoading } = useFeeTransactions({
    classId: selectedClass ? parseInt(selectedClass) : undefined,
    academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
  });

  const recordPayment = useRecordPayment();
  const applyWaiver = useApplyWaiver();

  const groupedByStudent = useMemo(() => {
    const studentMap = new Map<number, StudentGroup>();

    transactions.forEach(tx => {
      const termLabel = tx.termNumber ? `Term ${tx.termNumber}` : 'Yearly';
      const termId = `${tx.studentId}-${tx.termNumber ?? 'yearly'}`;

      if (!studentMap.has(tx.studentId)) {
        studentMap.set(tx.studentId, {
          studentId: tx.studentId,
          studentName: tx.studentName,
          admissionNumber: tx.admissionNumber,
          className: tx.className,
          academicYearName: tx.academicYearName,
          terms: [],
          totalAmountDue: 0,
          totalAmountPaid: 0,
          totalAmountPending: 0,
          termsCount: 0,
          paidTerms: 0,
        });
      }

      const student = studentMap.get(tx.studentId)!;
      let termGroup = student.terms.find(t => t.id === termId);

      if (!termGroup) {
        termGroup = {
          id: termId,
          termNumber: tx.termNumber,
          termLabel,
          dueDate: tx.dueDate,
          transactions: [],
          totalAmountDue: 0,
          totalAmountPaid: 0,
          totalAmountPending: 0,
          status: 'pending',
        };
        student.terms.push(termGroup);
      }

      termGroup.transactions.push(tx);
      termGroup.totalAmountDue += tx.amountDue;
      termGroup.totalAmountPaid += tx.amountPaid;
      termGroup.totalAmountPending += tx.amountPending;

      if (termGroup.transactions.length === 1) {
        termGroup.status = tx.status as 'paid' | 'pending' | 'partial';
      } else {
        const allPaid = termGroup.transactions.every(t => t.status === 'paid');
        const anyPending = termGroup.transactions.some(t => t.status === 'pending');
        const anyPartial = termGroup.transactions.some(t => t.status === 'partial');
        
        if (allPaid) {
          termGroup.status = 'paid';
        } else if (anyPartial || (anyPending && termGroup.status !== 'partial')) {
          termGroup.status = 'partial';
        } else {
          termGroup.status = 'pending';
        }
      }
    });

    studentMap.forEach(student => {
      student.terms.sort((a, b) => {
        if (a.termNumber === null) return 1;
        if (b.termNumber === null) return -1;
        return a.termNumber - b.termNumber;
      });

      student.terms.forEach(term => {
        student.totalAmountDue += term.totalAmountDue;
        student.totalAmountPaid += term.totalAmountPaid;
        student.totalAmountPending += term.totalAmountPending;
        if (term.status === 'paid') student.paidTerms++;
      });
      student.termsCount = student.terms.length;
    });

    return Array.from(studentMap.values()).sort((a, b) => 
      a.studentName.localeCompare(b.studentName)
    );
  }, [transactions]);

  const filteredStudents = useMemo(() => {
    return groupedByStudent.filter(s => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = s.studentName.toLowerCase().includes(searchLower) ||
                          s.admissionNumber.toLowerCase().includes(searchLower);
      
      let matchesStatus = true;
      if (statusFilter === 'paid') {
        matchesStatus = s.totalAmountPending === 0;
      } else if (statusFilter === 'pending') {
        matchesStatus = s.terms.some(t => t.status === 'pending' || t.status === 'partial');
      } else if (statusFilter === 'partial') {
        matchesStatus = s.terms.some(t => t.status === 'partial');
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [groupedByStudent, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    totalStudents: filteredStudents.length,
    fullyPaid: filteredStudents.filter(s => s.totalAmountPending === 0).length,
    withPending: filteredStudents.filter(s => s.terms.some(t => t.status === 'pending')).length,
    withPartial: filteredStudents.filter(s => s.terms.some(t => t.status === 'partial')).length,
    totalPendingAmount: filteredStudents.reduce((sum, s) => sum + s.totalAmountPending, 0),
  }), [filteredStudents]);

  const toggleStudent = (studentId: number) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleTerm = (termId: string) => {
    setExpandedTerms(prev => {
      const next = new Set(prev);
      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }
      return next;
    });
  };

  const openPaymentModal = (term: TermGroup) => {
    setSelectedTerm(term);
    setShowPaymentModal(true);
  };

  const openWaiverModal = (transaction: FeeTransaction) => {
    setSelectedTransaction(transaction);
    setShowWaiverModal(true);
  };

  const openEditModal = (transaction: FeeTransaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPaymentMode = (mode: string | null): string => {
    if (!mode) return '-';
    return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const openReceiptModal = (transaction: FeeTransaction, studentName: string, academicYearName: string) => {
    const schoolName = user?.schoolName || 'School Name';
    
    let feeBreakdownHtml = '';
    if (transaction.feeBreakdown && Object.keys(transaction.feeBreakdown).length > 0) {
      feeBreakdownHtml = Object.entries(transaction.feeBreakdown)
        .map(([feeName, amount]) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${feeName.replace(/_/g, ' ')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500;">${formatCurrency(amount)}</td>
          </tr>
        `).join('');
    }

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
          .header h1 { font-size: 24px; margin-bottom: 4px; }
          .header p { color: #bfdbfe; font-size: 14px; }
          .receipt-number { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; }
          .receipt-number span { color: #64748b; font-size: 12px; text-transform: uppercase; }
          .receipt-number strong { color: #1e293b; font-size: 14px; display: block; margin-top: 4px; }
          .section { background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
          .section-header { background: #f1f5f9; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; }
          .section-content { padding: 16px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .row:last-child { border-bottom: none; }
          .row-label { color: #64748b; font-size: 14px; }
          .row-value { font-weight: 500; font-size: 14px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
          .status-paid { background: #dcfce7; color: #16a34a; }
          .total-paid { font-size: 24px; font-weight: 700; color: #16a34a; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${schoolName}</h1>
          <p>Fee Receipt</p>
        </div>
        
        <div class="receipt-number">
          <div>
            <span>Receipt Number</span>
            <strong>${transaction.receiptNumber || '-'}</strong>
          </div>
          <div>
            <span>Payment Date</span>
            <strong>${formatDisplayDate(transaction.paymentDate)}</strong>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Student Details</div>
          <div class="section-content">
            <div class="row">
              <span class="row-label">Student Name</span>
              <span class="row-value">${studentName}</span>
            </div>
            <div class="row">
              <span class="row-label">Admission Number</span>
              <span class="row-value" style="font-family: monospace;">${transaction.admissionNumber}</span>
            </div>
            <div class="row">
              <span class="row-label">Class</span>
              <span class="row-value">${transaction.className} ${transaction.classSection ? `- Section ${transaction.classSection}` : ''}</span>
            </div>
            <div class="row">
              <span class="row-label">Academic Year</span>
              <span class="row-value">${academicYearName}</span>
            </div>
            ${transaction.termNumber ? `
            <div class="row">
              <span class="row-label">Term</span>
              <span class="row-value">Term ${transaction.termNumber}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="section">
          <div class="section-header" style="background: #dcfce7; color: #16a34a;">Payment Details</div>
          <div class="section-content">
            <div class="row">
              <span class="row-label">Total Amount</span>
              <span class="row-value">${formatCurrency(transaction.amountDue)}</span>
            </div>
            <div class="row">
              <span class="row-label">Amount Paid</span>
              <span class="row-value total-paid">${formatCurrency(transaction.amountPaid)}</span>
            </div>
            <div class="row">
              <span class="row-label">Payment Mode</span>
              <span class="row-value">${formatPaymentMode(transaction.paymentMode)}</span>
            </div>
            <div class="row">
              <span class="row-label">Status</span>
              <span class="status status-paid">Paid</span>
            </div>
          </div>
        </div>
        
        ${feeBreakdownHtml ? `
        <div class="section">
          <div class="section-header">Fee Breakdown</div>
          <div class="section-content" style="padding: 0;">
            <table style="width: 100%;">
              <tbody>
                ${feeBreakdownHtml}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  };

  const handlePayment = async (data: RecordPaymentDto) => {
    if (!selectedTerm) return;

    for (const tx of selectedTerm.transactions) {
      if (tx.amountPending > 0 && (data.amountPaid ?? 0) > 0) {
        await recordPayment.mutateAsync({
          transactionId: tx.id,
          data: {
            ...data,
            amountPaid: Math.min(tx.amountPending, data.amountPaid ?? 0),
          },
        });
      }
    }
    
    setShowPaymentModal(false);
    setSelectedTerm(null);
    setExpandedTerms(new Set());
  };

  const handleApplyWaiver = async (waiverAmount: number, waiverReason: string) => {
    if (!selectedTransaction) return;

    await applyWaiver.mutateAsync({
      transactionId: selectedTransaction.id,
      data: { waiverAmount, waiverReason },
    });
    
    setShowWaiverModal(false);
    setSelectedTransaction(null);
    setExpandedTerms(new Set());
  };

  const handleEditDueDate = async (data: { dueDate: string }) => {
    if (!selectedTransaction) return;
    
    await feeService.updateTransaction(selectedTransaction.id, data);
    
    setShowEditModal(false);
    setSelectedTransaction(null);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSelectedClass('');
    setExpandedStudents(new Set());
    setExpandedTerms(new Set());
  };

  return {
    classes: classesData ?? [],
    transactions,
    isLoading,
    groupedByStudent,
    filteredStudents,
    stats,
    handlers: {
      selectedClass,
      setSelectedClass,
      statusFilter,
      setStatusFilter,
      searchTerm,
      setSearchTerm,
      expandedStudents,
      expandedTerms,
      toggleStudent,
      toggleTerm,
      openPaymentModal,
      openWaiverModal,
      openEditModal,
      openReceiptModal,
      showPaymentModal,
      setShowPaymentModal,
      showWaiverModal,
      setShowWaiverModal,
      showEditModal,
      setShowEditModal,
      selectedTerm,
      selectedTransaction,
      handlePayment,
      handleApplyWaiver,
      handleEditDueDate,
      handleReset,
    },
  };
};
