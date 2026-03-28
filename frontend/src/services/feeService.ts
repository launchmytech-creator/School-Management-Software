import { apiRequest } from './api';

// ── Backend row shape (snake_case) ──────────────────────────────────
interface BackendFeeTransaction {
  id: number;
  school_id: number;
  student_id: number;
  fee_structure_id: number;
  academic_year_id: number;
  term_number: number | null;
  original_amount: number;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  status: string;
  payment_date: string | null;
  payment_mode: string | null;
  receipt_number: string | null;
  waiver_amount: number | null;
  waiver_reason: string | null;
  waiver_approved_by: number | null;
  collected_by: number | null;
  // fee_breakdown is present on student-scoped queries (JSON: { "Tuition Fee": 7500, ... })
  fee_breakdown?: Record<string, number> | string | null;
  // joined fields — present on admin/accountant list queries, absent on student-scoped queries
  student_name?: string;
  admission_number?: string;
  class_name?: string;
  class_section?: string | null;
  academic_year_name?: string;
  fee_type?: string;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  pending_amount?: number;
}

// ── Frontend types (camelCase) ──────────────────────────────────────
export interface FeeTransaction {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className: string;
  classSection: string | null;
  feeStructureId: number;
  academicYearId: number;
  academicYearName: string;
  // feeType is only present on admin/accountant list queries
  feeType: string;
  // feeBreakdown is present on student-scoped queries: { "Tuition Fee": 7500, "Transport Fee": 2500 }
  feeBreakdown: Record<string, number> | null;
  termNumber: number | null;
  originalAmount: number;
  amountDue: number;
  amountPaid: number;
  amountPending: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'partial' | 'waived';
  paymentDate: string | null;
  paymentMode: string | null;
  receiptNumber: string | null;
  waiverAmount: number | null;
  waiverReason: string | null;
  parentName: string | null;
  parentPhone: string | null;
}

export interface FeeDefaulter {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  totalDue: number;
  pendingTerms: string[];
}

export interface StudentFeeSummary {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className: string;
  classSection: string | null;
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  status: 'paid' | 'pending' | 'partial';
  allTransactions: FeeTransaction[];
  pendingTransactions: FeeTransaction[];
}

export interface RecordPaymentDto {
  amountPaid: number;
  paymentMode: 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer';
  paymentDate?: string;
  receiptNumber?: string;
}

export interface ApplyWaiverDto {
  waiverAmount: number;
  waiverReason: string;
}

export interface GenerateFeeTransactionsDto {
  feeStructureId: number;
  academicYearStartDate: string;
}

// ── Mappers ─────────────────────────────────────────────────────────

/** Parse fee_breakdown — backend may return it as a string or object */
const parseFeeBreakdown = (raw: BackendFeeTransaction['fee_breakdown']): Record<string, number> | null => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
};

/**
 * Derive a human-readable label for a transaction.
 * - Admin/accountant list queries include fee_type directly.
 * - Student-scoped queries include fee_breakdown (JSON map of components).
 *   We join the component names as the label, e.g. "Tuition Fee, Transport Fee".
 */
const deriveFeeLabel = (row: BackendFeeTransaction): string => {
  if (row.fee_type) return row.fee_type;
  const breakdown = parseFeeBreakdown(row.fee_breakdown);
  if (breakdown) return Object.keys(breakdown).join(', ');
  return 'Fee';
};

const mapTransaction = (row: BackendFeeTransaction): FeeTransaction => {
  const amountDue = parseFloat(String(row.amount_due)) || 0;
  const amountPaid = parseFloat(String(row.amount_paid)) || 0;
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name ?? '',
    admissionNumber: row.admission_number ?? '',
    className: row.class_name ?? '',
    classSection: row.class_section ?? null,
    feeStructureId: row.fee_structure_id,
    academicYearId: row.academic_year_id,
    academicYearName: row.academic_year_name ?? '',
    feeType: deriveFeeLabel(row),
    feeBreakdown: parseFeeBreakdown(row.fee_breakdown),
    termNumber: row.term_number ?? null,
    originalAmount: parseFloat(String(row.original_amount)) || 0,
    amountDue,
    amountPaid,
    amountPending: row.pending_amount
      ? parseFloat(String(row.pending_amount))
      : amountDue - amountPaid,
    dueDate: row.due_date,
    status: row.status as FeeTransaction['status'],
    paymentDate: row.payment_date,
    paymentMode: row.payment_mode,
    receiptNumber: row.receipt_number,
    waiverAmount: row.waiver_amount ? parseFloat(String(row.waiver_amount)) : null,
    waiverReason: row.waiver_reason,
    parentName: row.parent_name ?? null,
    parentPhone: row.parent_phone ?? null,
  };
};

/**
 * Backend /defaulters returns flat rows (one per overdue transaction).
 * We group them by student for the FeeDefaulters page.
 */
const groupDefaulters = (rows: BackendFeeTransaction[]): FeeDefaulter[] => {
  const map = new Map<number, FeeDefaulter>();

  for (const row of rows) {
    const pending = row.pending_amount
      ? parseFloat(String(row.pending_amount))
      : (parseFloat(String(row.amount_due)) || 0) - (parseFloat(String(row.amount_paid)) || 0);

    if (map.has(row.student_id)) {
      const existing = map.get(row.student_id)!;
      existing.totalDue += pending;
      existing.pendingTerms.push(`Term ${row.term_number} – ${row.fee_type}`);
    } else {
      map.set(row.student_id, {
        studentId: row.student_id,
        studentName: row.student_name ?? '',
        admissionNumber: row.admission_number ?? '',
        className: row.class_name ?? '',
        parentName: row.parent_name || 'N/A',
        parentPhone: row.parent_phone || '',
        parentEmail: row.parent_email || '',
        totalDue: pending,
        pendingTerms: [`Term ${row.term_number} – ${row.fee_type}`],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalDue - a.totalDue);
};

const aggregateByStudent = (transactions: FeeTransaction[]): StudentFeeSummary[] => {
  const map = new Map<number, StudentFeeSummary>();
  
  transactions.forEach(tx => {
    if (!map.has(tx.studentId)) {
      map.set(tx.studentId, {
        studentId: tx.studentId,
        studentName: tx.studentName,
        admissionNumber: tx.admissionNumber,
        className: tx.className,
        classSection: tx.classSection,
        rollNumber: tx.classSection || '',
        parentName: tx.parentName || '',
        parentPhone: tx.parentPhone || '',
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        status: 'paid',
        allTransactions: [],
        pendingTransactions: [],
      });
    }
    
    const summary = map.get(tx.studentId)!;
    summary.totalAmount += tx.amountDue;
    summary.totalPaid += tx.amountPaid;
    summary.allTransactions.push(tx);
    
    if (tx.status === 'pending' || tx.status === 'partial') {
      summary.pendingTransactions.push(tx);
      if (tx.status === 'pending') {
        summary.status = 'pending';
      } else if (tx.status === 'partial' && summary.status !== 'pending') {
        summary.status = 'partial';
      }
    }
  });
  
  return Array.from(map.values()).map(s => ({
    ...s,
    totalPending: s.totalAmount - s.totalPaid,
  })).sort((a, b) => 
    a.studentName.localeCompare(b.studentName)
  );
};

// ── Service ─────────────────────────────────────────────────────────
export const feeService = {
  // Generate fee transactions for students
  generateFeeTransactions: async (data: GenerateFeeTransactionsDto): Promise<{ count: number }> => {
    return apiRequest<{ count: number }>('/fee-transactions/generate', {
      method: 'POST',
      data,
    });
  },

  // List transactions with filters
  getFeeTransactions: async (params: {
    classId?: number;
    studentId?: number;
    academicYearId?: number;
    status?: string;
  } = {}): Promise<FeeTransaction[]> => {
    const qp = new URLSearchParams();
    if (params.classId) qp.append('classId', String(params.classId));
    if (params.studentId) qp.append('studentId', String(params.studentId));
    if (params.academicYearId) qp.append('academicYearId', String(params.academicYearId));
    if (params.status) qp.append('status', params.status);

    const qs = qp.toString();
    const rows = await apiRequest<BackendFeeTransaction[]>(`/fee-transactions${qs ? `?${qs}` : ''}`);
    return rows.map(mapTransaction);
  },

  // Fee defaulters (grouped by student)
  getFeeDefaulters: async (classId?: number): Promise<FeeDefaulter[]> => {
    const qs = classId ? `?classId=${classId}` : '';
    const rows = await apiRequest<BackendFeeTransaction[]>(`/fee-transactions/defaulters${qs}`);
    return groupDefaulters(rows);
  },

  // Single student transactions
  getStudentFeeTransactions: async (studentId: number): Promise<FeeTransaction[]> => {
    const rows = await apiRequest<BackendFeeTransaction[]>(`/fee-transactions/student/${studentId}`);
    return rows.map(mapTransaction);
  },

  // Single transaction detail
  getFeeTransactionById: async (id: number): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(`/fee-transactions/${id}`);
    return mapTransaction(row);
  },

  // Record payment
  recordPayment: async (transactionId: number, data: RecordPaymentDto): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(`/fee-transactions/${transactionId}/payment`, {
      method: 'PATCH',
      data,
    });
    return mapTransaction(row);
  },

  // Apply waiver
  applyWaiver: async (transactionId: number, data: ApplyWaiverDto): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(`/fee-transactions/${transactionId}/waiver`, {
      method: 'PATCH',
      data,
    });
    return mapTransaction(row);
  },

  // Update transaction (e.g. due date)
  updateTransaction: async (transactionId: number, data: { dueDate?: string }): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(`/fee-transactions/${transactionId}`, {
      method: 'PATCH',
      data,
    });
    return mapTransaction(row);
  },

  // Aggregate transactions by student
  aggregateByStudent,
};

export default feeService;
