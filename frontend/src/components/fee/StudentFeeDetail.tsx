import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useStudentById } from '../../hooks/queries/useStudents';
import { useStudentFees } from '../../hooks/queries/useFeeTransactions';
import { useRecordPayment, useApplyWaiver } from '../../hooks/mutations/useFeeMutations';
import { feeService } from '../../services/feeService';
import PageHeader from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import FeeTransactionCard from './FeeTransactionCard';
import FeeStatsRow from './FeeStatsRow';
import { FeePaymentModal } from '../modals/FeePaymentModal';
import { FeeWaiverModal } from '../modals/FeeWaiverModal';
import { FeeTransactionEditModal } from '../modals/FeeTransactionEditModal';
import { computeFeeSummary, printReceipt } from '../../lib/fee-utils';
import type { FeeTransaction } from '../../services/feeService';
import type { TermGroup } from '../../types/fee';

interface StudentFeeDetailProps {
  layout: 'admin' | 'accountant';
  canApplyWaiver: boolean;
  canEdit: boolean;
}

const StudentFeeDetail: React.FC<StudentFeeDetailProps> = ({
  layout,
  canApplyWaiver,
  canEdit,
}) => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const classData = allClasses.find((c) => String(c.id) === classId);

  const { data: student, isLoading: loadingStudent } = useStudentById(
    studentId ? parseInt(studentId) : 0,
  );

  const { data: feeData = [], isLoading: loadingFee, refetch } = useStudentFees(
    studentId ? parseInt(studentId) : 0,
  );

  const recordPayment = useRecordPayment();
  const applyWaiver = useApplyWaiver();

  const [paymentModal, setPaymentModal] = useState<{ open: boolean; term: TermGroup }>({
    open: false,
    term: null as unknown as TermGroup,
  });
  const [waiverModal, setWaiverModal] = useState<{ open: boolean; tx: FeeTransaction }>({
    open: false,
    tx: null as unknown as FeeTransaction,
  });
  const [editModal, setEditModal] = useState<{ open: boolean; tx: FeeTransaction }>({
    open: false,
    tx: null as unknown as FeeTransaction,
  });

  const feeSummary = useMemo(() => computeFeeSummary(feeData), [feeData]);

  const sortedFees = useMemo(
    () => [...feeData].sort((a, b) => (a.termNumber ?? 999) - (b.termNumber ?? 999)),
    [feeData],
  );

  const handleCollect = (tx: FeeTransaction) => {
    setPaymentModal({
      open: true,
      term: {
        id: String(tx.id),
        termNumber: tx.termNumber,
        termLabel: tx.termNumber ? `Term ${tx.termNumber}` : 'Yearly',
        dueDate: tx.dueDate,
        transactions: [tx],
        totalAmountDue: tx.amountDue,
        totalAmountPaid: tx.amountPaid,
        totalAmountPending: tx.amountPending,
        status: tx.status as 'paid' | 'pending' | 'partial',
      },
    });
  };

  const handlePaymentSubmit = async () => {
    setPaymentModal({ open: false, term: null as unknown as TermGroup });
    refetch();
  };

  const handleWaive = (tx: FeeTransaction) => {
    setWaiverModal({ open: true, tx });
  };

  const handleWaiverSubmit = async () => {
    setWaiverModal({ open: false, tx: null as unknown as FeeTransaction });
    refetch();
  };

  const handleEdit = (tx: FeeTransaction) => {
    setEditModal({ open: true, tx });
  };

  const handleEditSubmit = async () => {
    setEditModal({ open: false, tx: null as unknown as FeeTransaction });
    refetch();
  };

  const handleReceipt = (tx: FeeTransaction) => {
    printReceipt(
      {
        receiptNumber: tx.receiptNumber,
        studentName: tx.studentName,
        className: tx.className,
        termNumber: tx.termNumber,
        feeType: tx.feeType,
        amountDue: tx.amountDue,
        amountPaid: tx.amountPaid,
        amountPending: tx.amountPending,
        paymentDate: tx.paymentDate,
        paymentMode: tx.paymentMode,
        dueDate: tx.dueDate,
        academicYearName: tx.academicYearName,
      },
      user?.schoolName || 'School',
    );
  };

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (loadingStudent || loadingFee) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading fee details..." />
      </div>
    );
  }

  if (!student || !classData) {
    return (
      <EmptyState
        icon={ArrowLeft}
        title="Student not found"
        action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/fees/class/${classId}`) }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${student.fullName}`}
        subtitle={`${classData.name}${classData.section ? ` - Section ${classData.section}` : ''} • ${student.admissionNumber}`}
        breadcrumb={{
          links: [
            { label: 'Finance', href: `${basePath}/fees` },
            { label: classData.name, href: `${basePath}/fees/class/${classId}` },
            { label: 'Fee Details', active: true },
          ],
        }}
        actions={[
          {
            label: 'Back to Students',
            icon: ArrowLeft,
            onClick: () => navigate(`${basePath}/fees/class/${classId}`),
          },
        ]}
      />

      {feeData.length > 0 ? (
        <>
          <FeeStatsRow
            totalAmount={feeSummary.totalAmount}
            totalPaid={feeSummary.totalPaid}
            totalPending={feeSummary.totalPending}
            paidPercentage={feeSummary.paidPercentage}
          />

          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">
              Term-wise Breakdown
            </h3>
            <div className="space-y-4">
              {sortedFees.map((tx) => (
                <div key={tx.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <FeeTransactionCard
                    termNumber={tx.termNumber}
                    academicYearName={tx.academicYearName}
                    status={tx.status}
                    originalAmount={tx.originalAmount}
                    amountPaid={tx.amountPaid}
                    amountPending={tx.amountPending}
                    dueDate={tx.dueDate}
                    waiverAmount={tx.waiverAmount}
                    paymentDate={tx.paymentDate}
                    paymentMode={tx.paymentMode}
                    receiptNumber={tx.receiptNumber}
                    studentName={tx.studentName}
                    className={tx.className}
                    onDownloadReceipt={() => handleReceipt(tx)}
                  />
                  {(canApplyWaiver || canEdit || tx.status !== 'paid') && (
                    <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
                      {canEdit && tx.status !== 'paid' && (
                        <button
                          onClick={() => handleEdit(tx)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Edit
                        </button>
                      )}
                      {canApplyWaiver && tx.status !== 'paid' && tx.amountPending > 0 && (
                        <button
                          onClick={() => handleWaive(tx)}
                          className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Waive
                        </button>
                      )}
                      {tx.status !== 'paid' && (
                        <button
                          onClick={() => handleCollect(tx)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                        >
                          <IndianRupee className="size-3" />
                          Collect Fee
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={IndianRupee}
          title="No fee records found"
          description={`No fee transactions have been generated for ${student.fullName} yet.`}
        />
      )}

      {paymentModal.open && (
        <FeePaymentModal
          isOpen={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, term: null as unknown as TermGroup })}
          term={paymentModal.term}
          onSubmit={async (data) => {
            for (const tx of paymentModal.term.transactions) {
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
            handlePaymentSubmit();
          }}
        />
      )}

      {waiverModal.open && (
        <FeeWaiverModal
          isOpen={waiverModal.open}
          onClose={() => setWaiverModal({ open: false, tx: null as unknown as FeeTransaction })}
          transaction={waiverModal.tx}
          onSubmit={async (waiverAmount: number, waiverReason: string) => {
            await applyWaiver.mutateAsync({
              transactionId: waiverModal.tx.id,
              data: { waiverAmount, waiverReason },
            });
            handleWaiverSubmit();
          }}
        />
      )}

      {editModal.open && (
        <FeeTransactionEditModal
          isOpen={editModal.open}
          onClose={() => setEditModal({ open: false, tx: null as unknown as FeeTransaction })}
          transaction={editModal.tx}
          onSubmit={async (data: { dueDate: string }) => {
            await feeService.updateTransaction(editModal.tx.id, data);
            handleEditSubmit();
          }}
        />
      )}
    </div>
  );
};

export default StudentFeeDetail;
