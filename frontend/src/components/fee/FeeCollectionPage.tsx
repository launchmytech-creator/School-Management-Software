import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useFeeCollectionPage } from '../../hooks/useFeeCollectionPage';
import { useAuth } from '../../context/AuthContext';
import { FeeCollectionTable } from './FeeCollectionTable';
import { FeePaymentModal } from './FeePaymentModal';
import { FeeWaiverModal } from './FeeWaiverModal';
import { FeeTransactionEditModal } from './FeeTransactionEditModal';
import { FeeStatsCards } from './FeeStatsCards';
import { FeeReceiptModal } from './FeeReceiptModal';
import PageHeader from '../common/PageHeader';
import type { FeeTransaction } from '../../services/feeService';

interface FeeCollectionPageProps {
  layout: 'admin' | 'accountant';
  canApplyWaiver: boolean;
  canEdit: boolean;
}

const FeeCollectionPage: React.FC<FeeCollectionPageProps> = ({
  layout,
  canApplyWaiver,
  canEdit,
}) => {
  const { user } = useAuth();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<FeeTransaction | null>(null);
  const [receiptStudentName, setReceiptStudentName] = useState('');
  const [receiptAcademicYear, setReceiptAcademicYear] = useState('');

  const handleViewReceipt = (transaction: FeeTransaction, studentName: string, academicYearName: string) => {
    setReceiptTransaction(transaction);
    setReceiptStudentName(studentName);
    setReceiptAcademicYear(academicYearName);
    setShowReceiptModal(true);
  };

  const {
    classes,
    filteredStudents,
    isLoading,
    stats,
    handlers,
  } = useFeeCollectionPage();

  return (
    <>
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Fee Collection"
          subtitle="Manage fee payments and track collection status"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: layout === 'admin' ? "/admin/dashboard" : "/accountant/dashboard" },
              { label: "Fee Collection", active: true },
            ],
          }}
        />

        <FeeStatsCards
          totalStudents={stats.totalStudents}
          fullyPaid={stats.fullyPaid}
          withPending={stats.withPending}
          withPartial={stats.withPartial}
          totalPendingAmount={stats.totalPendingAmount}
        />

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Search Student
              </label>
              <input
                type="text"
                value={handlers.searchTerm}
                onChange={(e) => handlers.setSearchTerm(e.target.value)}
                placeholder="Search by name or admission number..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Filter by Class
              </label>
              <select
                value={handlers.selectedClass}
                onChange={(e) => handlers.setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">All Classes</option>
                {classes?.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- ${cls.section}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Filter by Status
              </label>
              <select
                value={handlers.statusFilter}
                onChange={(e) => handlers.setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="paid">Fully Paid</option>
                <option value="partial">Partially Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handlers.handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        <FeeCollectionTable
          students={filteredStudents}
          expandedStudents={handlers.expandedStudents}
          expandedTerms={handlers.expandedTerms}
          onToggleStudent={handlers.toggleStudent}
          onToggleTerm={handlers.toggleTerm}
          onCollect={handlers.openPaymentModal}
          onWaive={handlers.openWaiverModal}
          onEdit={handlers.openEditModal}
          onViewReceipt={handleViewReceipt}
          canApplyWaiver={canApplyWaiver}
          canEdit={canEdit}
          loading={isLoading}
        />

        {handlers.showPaymentModal && handlers.selectedTerm && (
          <FeePaymentModal
            isOpen={handlers.showPaymentModal}
            onClose={() => handlers.setShowPaymentModal(false)}
            term={handlers.selectedTerm}
            onSubmit={handlers.handlePayment}
          />
        )}

        {handlers.showWaiverModal && handlers.selectedTransaction && (
          <FeeWaiverModal
            isOpen={handlers.showWaiverModal}
            onClose={() => handlers.setShowWaiverModal(false)}
            transaction={handlers.selectedTransaction}
            onSubmit={handlers.handleApplyWaiver}
          />
        )}

        {handlers.showEditModal && handlers.selectedTransaction && (
          <FeeTransactionEditModal
            isOpen={handlers.showEditModal}
            onClose={() => handlers.setShowEditModal(false)}
            transaction={handlers.selectedTransaction}
            onSubmit={handlers.handleEditDueDate}
          />
        )}

        {showReceiptModal && receiptTransaction && (
          <FeeReceiptModal
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            transaction={receiptTransaction}
            studentName={receiptStudentName}
            academicYearName={receiptAcademicYear}
            schoolName={user?.schoolName || 'School Name'}
          />
        )}
      </div>
    </>
  );
};

export default FeeCollectionPage;
