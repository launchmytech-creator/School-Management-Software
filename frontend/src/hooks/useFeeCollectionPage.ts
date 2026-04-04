import { useState, useMemo } from 'react';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useClasses, useFeeTransactions } from './queries';
import { useRecordPayment, useApplyWaiver } from './mutations';
import { feeService, type FeeTransaction, type RecordPaymentDto } from '../services/feeService';
import type { TermGroup, StudentGroup, FeeCollectionStats, FeeCollectionHandlers } from '../types/fee';

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
