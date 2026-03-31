import { apiRequest } from "./api";

// ── Fee breakdown type (per-component amounts per term) ──────────────
export type FeeBreakdown = Record<string, number>;

// ── Backend row shape (snake_case) ──────────────────────────────────
interface BackendFeeTransaction {
  id: number;
  school_id: number;
  student_id: number;
  fee_structure_id: number;
  academic_year_id: number;
  term_number: number | null;
  original_amount: string;
  amount_due: string;
  amount_paid: string;
  due_date: string;
  status: string;
  payment_date: string | null;
  payment_mode: string | null;
  receipt_number: string | null;
  waiver_amount: string | null;
  waiver_reason: string | null;
  waiver_approved_by: number | null;
  collected_by: number | null;
  fee_breakdown: FeeBreakdown | null;
  // joined fields
  student_name: string;
  admission_number: string;
  class_name: string;
  class_section: string | null;
  academic_year_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email?: string | null;
  pending_amount?: number;
  waiver_approved_by_name?: string | null;
  collected_by_name?: string | null;
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
  termNumber: number | null;
  originalAmount: number;
  amountDue: number;
  amountPaid: number;
  amountPending: number;
  dueDate: string;
  status: "paid" | "pending" | "partial" | "waived";
  paymentDate: string | null;
  paymentMode: string | null;
  receiptNumber: string | null;
  waiverAmount: number | null;
  waiverReason: string | null;
  parentName: string | null;
  parentPhone: string | null;
  feeBreakdown: FeeBreakdown | null;
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
  status: "paid" | "pending" | "partial";
  allTransactions: FeeTransaction[];
  pendingTransactions: FeeTransaction[];
}

export interface RecordPaymentDto {
  amountPaid: number;
  paymentMode: "cash" | "card" | "upi" | "cheque" | "bank_transfer";
  paymentDate?: string;
  receiptNumber?: string;
}

export interface ApplyWaiverDto {
  waiverAmount: number;
  waiverReason: string;
}

export interface GenerateFeeTransactionsDto {
  classId: number;
  academicYearId: number;
}

export interface GenerateFeeTransactionsResponse {
  feeTerms: number;
  totalAnnualFee: number;
  perTermAmount: number;
  termBreakdown: FeeBreakdown;
  generated: number;
  skippedStudents: number;
  transactions: FeeTransaction[];
}

// ── Mappers ─────────────────────────────────────────────────────────
const mapTransaction = (row: BackendFeeTransaction): FeeTransaction => ({
  id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  admissionNumber: row.admission_number,
  className: row.class_name,
  classSection: row.class_section,
  feeStructureId: row.fee_structure_id,
  academicYearId: row.academic_year_id,
  academicYearName: row.academic_year_name,
  feeType: row.fee_type,
  termNumber: row.term_number,
  originalAmount: parseFloat(String(row.original_amount)) || 0,
  amountDue: parseFloat(String(row.amount_due)) || 0,
  amountPaid: parseFloat(String(row.amount_paid)) || 0,
  amountPending:
    (parseFloat(String(row.amount_due)) || 0) -
    (parseFloat(String(row.amount_paid)) || 0),
  dueDate: row.due_date,
  status: row.status as FeeTransaction["status"],
  paymentDate: row.payment_date,
  paymentMode: row.payment_mode,
  receiptNumber: row.receipt_number,
  waiverAmount: row.waiver_amount
    ? parseFloat(String(row.waiver_amount))
    : null,
  waiverReason: row.waiver_reason,
  parentName: row.parent_name,
  parentPhone: row.parent_phone,
  feeBreakdown: row.fee_breakdown || null,
});

/**
 * Backend /defaulters returns flat rows (one per overdue transaction).
 * We group them by student for the FeeDefaulters page.
 */
const groupDefaulters = (rows: BackendFeeTransaction[]): FeeDefaulter[] => {
  const map = new Map<number, FeeDefaulter>();

  for (const row of rows) {
    const pending = row.pending_amount
      ? parseFloat(String(row.pending_amount))
      : (parseFloat(String(row.amount_due)) || 0) -
        (parseFloat(String(row.amount_paid)) || 0);

    const termLabel = row.term_number ? `Term ${row.term_number}` : "Yearly";

    if (map.has(row.student_id)) {
      const existing = map.get(row.student_id)!;
      existing.totalDue += pending;
      existing.pendingTerms.push(`${termLabel}`);
    } else {
      map.set(row.student_id, {
        studentId: row.student_id,
        studentName: row.student_name,
        admissionNumber: row.admission_number,
        className: row.class_name,
        parentName: row.parent_name || "N/A",
        parentPhone: row.parent_phone || "",
        parentEmail: row.parent_email || "",
        totalDue: pending,
        pendingTerms: [`${termLabel}`],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalDue - a.totalDue);
};

const aggregateByStudent = (
  transactions: FeeTransaction[],
): StudentFeeSummary[] => {
  const map = new Map<number, StudentFeeSummary>();

  transactions.forEach((tx) => {
    if (!map.has(tx.studentId)) {
      map.set(tx.studentId, {
        studentId: tx.studentId,
        studentName: tx.studentName,
        admissionNumber: tx.admissionNumber,
        className: tx.className,
        classSection: tx.classSection,
        rollNumber: tx.classSection || "",
        parentName: tx.parentName || "",
        parentPhone: tx.parentPhone || "",
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        status: "paid",
        allTransactions: [],
        pendingTransactions: [],
      });
    }

    const summary = map.get(tx.studentId)!;
    summary.totalAmount += tx.amountDue;
    summary.totalPaid += tx.amountPaid;
    summary.allTransactions.push(tx);

    if (tx.status === "pending" || tx.status === "partial") {
      summary.pendingTransactions.push(tx);
      if (tx.status === "pending") {
        summary.status = "pending";
      } else if (tx.status === "partial" && summary.status !== "pending") {
        summary.status = "partial";
      }
    }
  });

  return Array.from(map.values())
    .map((s) => ({
      ...s,
      totalPending: s.totalAmount - s.totalPaid,
    }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
};

// ── Service ─────────────────────────────────────────────────────────
export const feeService = {
  // Generate fee transactions for students
  generateFeeTransactions: async (
    data: GenerateFeeTransactionsDto,
  ): Promise<GenerateFeeTransactionsResponse> => {
    const response = await apiRequest<{
      feeTerms: number;
      totalAnnualFee: number;
      perTermAmount: number;
      termBreakdown: FeeBreakdown;
      generated: number;
      skippedStudents: number;
      transactions: BackendFeeTransaction[];
    }>("/fee-transactions/generate", {
      method: "POST",
      data,
    });

    return {
      ...response,
      transactions: response.transactions.map(mapTransaction),
    };
  },

  // List transactions with filters
  getFeeTransactions: async (
    params: {
      classId?: number;
      studentId?: number;
      academicYearId?: number;
      status?: string;
    } = {},
  ): Promise<FeeTransaction[]> => {
    const qp = new URLSearchParams();
    if (params.classId) qp.append("classId", String(params.classId));
    if (params.studentId) qp.append("studentId", String(params.studentId));
    if (params.academicYearId)
      qp.append("academicYearId", String(params.academicYearId));
    if (params.status) qp.append("status", params.status);

    const qs = qp.toString();
    const rows = await apiRequest<BackendFeeTransaction[]>(
      `/fee-transactions${qs ? `?${qs}` : ""}`,
    );
    return rows.map(mapTransaction);
  },

  // Fee defaulters (grouped by student)
  getFeeDefaulters: async (
    params: { classId?: number; academicYearId?: number } = {},
  ): Promise<FeeDefaulter[]> => {
    const qp = new URLSearchParams();
    if (params.classId) qp.append("classId", String(params.classId));
    if (params.academicYearId)
      qp.append("academicYearId", String(params.academicYearId));
    const qs = qp.toString() ? `?${qp.toString()}` : "";
    const rows = await apiRequest<BackendFeeTransaction[]>(
      `/fee-transactions/defaulters${qs}`,
    );
    return groupDefaulters(rows);
  },

  // Single student transactions
  getStudentFeeTransactions: async (
    studentId: number,
  ): Promise<FeeTransaction[]> => {
    const rows = await apiRequest<BackendFeeTransaction[]>(
      `/fee-transactions/student/${studentId}`,
    );
    console.log(rows);
    return rows.map(mapTransaction);
  },

  // Single transaction detail
  getFeeTransactionById: async (id: number): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(
      `/fee-transactions/${id}`,
    );
    return mapTransaction(row);
  },

  // Record payment
  recordPayment: async (
    transactionId: number,
    data: RecordPaymentDto,
  ): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(
      `/fee-transactions/${transactionId}/payment`,
      {
        method: "PATCH",
        data,
      },
    );
    return mapTransaction(row);
  },

  // Apply waiver
  applyWaiver: async (
    transactionId: number,
    data: ApplyWaiverDto,
  ): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(
      `/fee-transactions/${transactionId}/waiver`,
      {
        method: "PATCH",
        data,
      },
    );
    return mapTransaction(row);
  },

  // Update transaction (e.g. due date)
  updateTransaction: async (
    transactionId: number,
    data: { dueDate?: string },
  ): Promise<FeeTransaction> => {
    const row = await apiRequest<BackendFeeTransaction>(
      `/fee-transactions/${transactionId}`,
      {
        method: "PATCH",
        data,
      },
    );
    return mapTransaction(row);
  },

  // Aggregate transactions by student
  aggregateByStudent,
};

export default feeService;
