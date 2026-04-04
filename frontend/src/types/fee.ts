import type { FeeTransaction, RecordPaymentDto } from '../services/feeService';

export interface TermGroup {
  id: string;
  termNumber: number | null;
  termLabel: string;
  dueDate: string;
  transactions: FeeTransaction[];
  totalAmountDue: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  status: 'paid' | 'pending' | 'partial';
}

export interface StudentGroup {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className: string;
  terms: TermGroup[];
  totalAmountDue: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  termsCount: number;
  paidTerms: number;
}

export interface FeeCollectionStats {
  totalStudents: number;
  fullyPaid: number;
  withPending: number;
  withPartial: number;
  totalPendingAmount: number;
}

export interface FeeCollectionPageConfig {
  layout: 'admin' | 'accountant';
  canApplyWaiver: boolean;
  canEdit: boolean;
}

export interface FeeCollectionHandlers {
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  expandedStudents: Set<number>;
  expandedTerms: Set<string>;
  toggleStudent: (studentId: number) => void;
  toggleTerm: (termId: string) => void;
  openPaymentModal: (term: TermGroup) => void;
  openWaiverModal: (transaction: FeeTransaction) => void;
  openEditModal: (transaction: FeeTransaction) => void;
  showPaymentModal: boolean;
  setShowPaymentModal: (value: boolean) => void;
  showWaiverModal: boolean;
  setShowWaiverModal: (value: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (value: boolean) => void;
  selectedTerm: TermGroup | null;
  selectedTransaction: FeeTransaction | null;
  handlePayment: (data: RecordPaymentDto) => Promise<void>;
  handleApplyWaiver: (waiverAmount: number, waiverReason: string) => Promise<void>;
  handleEditDueDate: (data: { dueDate: string }) => Promise<void>;
  handleReset: () => void;
}

export interface FeeDefaultersPageConfig {
  layout: 'admin' | 'accountant';
  canSendReminders: boolean;
}

export interface FeeDefaulterHandlers {
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  showReminderModal: boolean;
  setShowReminderModal: (value: boolean) => void;
  selectedDefaulter: import('../services/feeService').FeeDefaulter | null;
  setSelectedDefaulter: (value: import('../services/feeService').FeeDefaulter | null) => void;
  handleSendReminder: (defaulter: import('../services/feeService').FeeDefaulter) => void;
  handleReminderSubmit: (message: string) => Promise<void>;
}
